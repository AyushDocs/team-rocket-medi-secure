import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';

const META_TX_ABI = [
  'function getDomainSeparator() view returns (bytes32)',
  'function getNonce(address _user) view returns (uint256)',
  'function executeMetaTransaction((address from,address to,uint256 value,bytes data,uint256 nonce,uint256 gasPrice,uint256 gasLimit,uint256 deadline) _tx,bytes _signature)',
  'function getTransactionHash(address _from,address _to,uint256 _value,bytes _data,uint256 _nonce,uint256 _gasPrice,uint256 _gasLimit,uint256 _deadline) view returns (bytes32)',
];

export function useMetaTransaction(contractAddress) {
  const { provider, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metaContract, setMetaContract] = useState(null);

  if (contractAddress && !metaContract && provider) {
    const contract = new ethers.Contract(contractAddress, META_TX_ABI, provider.getSigner());
    setMetaContract(contract);
  }

  const getNonce = useCallback(async () => {
    if (!metaContract || !account) return 0;
    try {
      return await metaContract.getNonce(account);
    } catch (e) {
      console.error('Nonce error:', e);
      return 0;
    }
  }, [metaContract, account]);

  const signTransaction = useCallback(async (tx) => {
    if (!account) {
      setError('No account');
      return null;
    }

    try {
      const signer = provider.getSigner();
      const domainSeparator = await metaContract.getDomainSeparator();
      
      const domain = {
        name: 'Sanjeevni',
        version: '1.0',
        chainId: (await provider.getNetwork()).chainId,
        verifyingContract: contractAddress
      };

      const types = {
        MetaTransaction: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'nonce', type: 'uint256' },
          { name: 'gasPrice', type: 'uint256' },
          { name: 'gasLimit', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      const signature = await signer._signTypedData(domain, types, tx);
      return signature;
    } catch (e) {
      console.error('Sign error:', e);
      setError(e.message);
      return null;
    }
  }, [metaContract, provider, account, contractAddress]);

  const executeTransaction = useCallback(async (tx, signature) => {
    setLoading(true);
    setError(null);
    
    try {
      const gasEstimate = await provider.estimate({
        to: contractAddress,
        data: metaContract.interface.encodeFunctionData('executeMetaTransaction', [tx, signature])
      });

      const txResponse = await metaContract.executeMetaTransaction(tx, signature, {
        gasLimit: Math.floor(gasEstimate * 1.2)
      });
      
      await txResponse.wait();
      return txResponse;
    } catch (e) {
      console.error('Execute error:', e);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [metaContract, provider, contractAddress]);

  const sendMetaTransaction = useCallback(async (to, data, options = {}) => {
    if (!account || !metaContract) {
      setError('Not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const nonce = options.nonce || await getNonce();
      const gasPrice = options.gasPrice || await provider.getGasPrice();
      const gasLimit = options.gasLimit || 500000;
      const deadline = options.deadline || Math.floor(Date.now() / 1000) + 3600;

      const tx = {
        from: account,
        to: to || contractAddress,
        value: options.value || 0,
        data: data || '0x',
        nonce,
        gasPrice,
        gasLimit,
        deadline
      };

      const signature = await signTransaction(tx);
      if (!signature) return null;

      return await executeTransaction(tx, signature);
    } catch (e) {
      console.error('Meta tx error:', e);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [account, metaContract, getNonce, signTransaction, executeTransaction, provider, contractAddress]);

  return {
    sendMetaTransaction,
    getNonce,
    signTransaction,
    executeTransaction,
    loading,
    error
  };
}

export function useGaslessTx() {
  const { provider, account } = useWeb3();
  const [txHash, setTxHash] = useState(null);
  const [status, setStatus] = useState('idle');

  const signAndSend = useCallback(async (contract, method, args, options = {}) => {
    if (!account) {
      throw new Error('No account');
    }

    setStatus('signing');
    
    try {
      const nonce = await contract.getNonce(account);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      const tx = {
        from: account,
        to: contract.address,
        value: 0,
        data: contract.interface.encodeFunctionData(method, args),
        nonce,
        gasPrice: options.gasPrice || await provider.getGasPrice(),
        gasLimit: options.gasLimit || 200000,
        deadline
      };

      const signature = await provider.getSigner()._signTypedData(
        {
          name: 'Sanjeevni',
          version: '1.0',
          chainId: (await provider.getNetwork()).chainId,
          verifyingContract: contract.address
        },
        {
          MetaTransaction: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
            { name: 'nonce', type: 'uint256' },
            { name: 'gasPrice', type: 'uint256' },
            { name: 'gasLimit', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        },
        tx
      );

      setStatus('relaying');
      const txResponse = await contract.executeMetaTransaction(tx, signature);
      setTxHash(txResponse.hash);
      setStatus('mining');
      
      await txResponse.wait();
      setStatus('confirmed');
      
      return txResponse;
    } catch (e) {
      setStatus('error');
      throw e;
    }
  }, [account, provider]);

  return { signAndSend, txHash, status };
}

export default useMetaTransaction;