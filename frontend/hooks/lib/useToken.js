import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';

export function useToken(contract) {
  const { account } = useWeb3();
  const [balance, setBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const [bal, supply] = await Promise.all([
        contract.balanceOf(account),
        contract.totalSupply()
      ]);
      setBalance(ethers.formatEther(bal));
      setTotalSupply(ethers.formatEther(supply));
    } catch (e) {
      console.error("useToken error:", e);
    }
  }, [contract, account]);

  useEffect(() => {
    loadData();
    if (contract) {
      const filter = contract.filters.Transfer(null, account);
      contract.on(filter, loadData);
      return () => contract.off(filter, loadData);
    }
  }, [contract, account, loadData]);

  const transfer = async (to, amount) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.transfer(to, ethers.parseEther(amount));
      await tx.wait();
      await loadData();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const burn = async (amount) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.burn(ethers.parseEther(amount));
      await tx.wait();
      await loadData();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { balance, totalSupply, transfer, burn, loading, error, refresh: loadData };
}

export function useVesting(contract) {
  const { account } = useWeb3();
  const [claimable, setClaimable] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadClaimable = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const amount = await contract.getReleasableAmount(account);
      setClaimable(ethers.formatEther(amount));
    } catch (e) {
      console.error("useVesting error:", e);
    }
  }, [contract, account]);

  useEffect(() => {
    loadClaimable();
  }, [loadClaimable]);

  const claim = async () => {
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.claim();
      await tx.wait();
      await loadClaimable();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { claimable, claim, loading, error, refresh: loadClaimable };
}

export function useICO(contract) {
  const { account } = useWeb3();
  const [stats, setStats] = useState({ rate: 0, raised: '0', hardCap: '0', tokensSold: '0', active: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!contract) return;
    try {
      const s = await contract.getStats();
      setStats({
        rate: Number(s[0]),
        raised: ethers.formatEther(s[1]),
        hardCap: ethers.formatEther(s[2]),
        tokensSold: ethers.formatEther(s[3]),
        active: s[4]
      });
    } catch (e) {
      console.error("useICO error:", e);
    }
  }, [contract]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const buyTokens = async (ethAmount) => {
    setLoading(true);
    setError(null);
    try {
      // Note: If buyTokens is nonpayable, it expects a payment token amount. 
      // If it's intended to be ETH, it should be payable.
      // Based on previous analysis, it might be nonpayable and take an amount.
      const tx = await contract.buyTokens(ethers.parseEther(ethAmount.toString()));
      await tx.wait();
      await loadStats();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { stats, buyTokens, loading, error, refresh: loadStats };
}