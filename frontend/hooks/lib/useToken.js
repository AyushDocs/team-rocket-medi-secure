import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';

const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'function mint(address, uint256)',
  'function burn(uint256)',
  'function pause()',
  'function unpause()',
];

export function useToken(contractAddress) {
  const { provider, account } = useWeb3();
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractAddress && provider) {
      const t = new ethers.Contract(contractAddress, TOKEN_ABI, provider.getSigner());
      setToken(t);
    }
  }, [contractAddress, provider]);

  const loadBalance = useCallback(async () => {
    if (!token || !account) return;
    try {
      const bal = await token.balanceOf(account);
      setBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error(e);
    }
  }, [token, account]);

  const loadTotalSupply = useCallback(async () => {
    if (!token) return;
    try {
      const supply = await token.totalSupply();
      setTotalSupply(ethers.formatEther(supply));
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    loadBalance();
    loadTotalSupply();
  }, [loadBalance, loadTotalSupply]);

  const transfer = useCallback(async (to, amount) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await token.transfer(to, ethers.parseEther(amount));
      await tx.wait();
      await loadBalance();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, loadBalance]);

  const approve = useCallback(async (spender, amount) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await token.approve(spender, ethers.parseEther(amount));
      await tx.wait();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const burn = useCallback(async (amount) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await token.burn(ethers.parseEther(amount));
      await tx.wait();
      await loadBalance();
      await loadTotalSupply();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, loadBalance, loadTotalSupply]);

  return {
    token,
    balance,
    totalSupply,
    transfer,
    approve,
    burn,
    loading,
    error,
    refresh: loadBalance
  };
}

export function useVesting(vestingAddress) {
  const { provider, account } = useWeb3();
  const [vesting, setVesting] = useState(null);
  const [claimable, setClaimable] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const VESTING_ABI = [
    'function claim() returns (uint256)',
    'function getReleasableAmount(address) view returns (uint256)',
    'function createVesting(address, uint256, uint256, uint256, bool)',
  ];

  useEffect(() => {
    if (vestingAddress && provider) {
      const v = new ethers.Contract(vestingAddress, VESTING_ABI, provider.getSigner());
      setVesting(v);
    }
  }, [vestingAddress, provider]);

  const loadClaimable = useCallback(async () => {
    if (!vesting || !account) return;
    try {
      const amount = await vesting.getReleasableAmount(account);
      setClaimable(ethers.formatEther(amount));
    } catch (e) {
      console.error(e);
    }
  }, [vesting, account]);

  useEffect(() => {
    loadClaimable();
  }, [loadClaimable]);

  const claim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tx = await vesting.claim();
      await tx.wait();
      await loadClaimable();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [vesting, loadClaimable]);

  return {
    vesting,
    claimable,
    claim,
    loading,
    error,
    refresh: loadClaimable
  };
}

export function useICO(icoAddress) {
  const { provider, account } = useWeb3();
  const [ico, setIco] = useState(null);
  const [stats, setStats] = useState({ rate: 0, raised: 0, hardCap: 0, active: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ICO_ABI = [
    'function buyTokens(uint256)',
    'function getStats() view returns (uint256, uint256, uint256, uint256, bool)',
    'function setRate(uint256)',
    'function whitelist(address[], bool)',
  ];

  useEffect(() => {
    if (icoAddress && provider) {
      const i = new ethers.Contract(icoAddress, ICO_ABI, provider.getSigner());
      setIco(i);
    }
  }, [icoAddress, provider]);

  const loadStats = useCallback(async () => {
    if (!ico) return;
    try {
      const s = await ico.getStats();
      setStats({
        rate: Number(s[0]),
        raised: ethers.formatEther(s[1]),
        hardCap: ethers.formatEther(s[2]),
        active: s[4]
      });
    } catch (e) {
      console.error(e);
    }
  }, [ico]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const buyTokens = useCallback(async (ethAmount) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await ico.buyTokens(ethers.parseEther(ethAmount.toString()));
      await tx.wait();
      await loadStats();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [ico, loadStats]);

  return {
    ico,
    stats,
    buyTokens,
    loading,
    error,
    refresh: loadStats
  };
}