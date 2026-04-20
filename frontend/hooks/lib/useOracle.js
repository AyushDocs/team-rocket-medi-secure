import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';

const ORACLE_ABI = [
  'function getLatestPrice(address _token) view returns (uint256 price, uint256 updatedAt)',
  'function getValueInUSD(address _token, uint256 _amount) view returns (uint256 usdValue)',
  'function getETHPrice() view returns (uint256 price)',
  'function updatePrice(address _token) returns (uint256 price)',
  'function priceFeeds(address) view returns (address)',
  'function lastPrices(address) view returns (uint256)',
];

const INSURANCE_ORACLE_ABI = [
  'function calculatePremium(address _token, uint256 _basePremium, uint256 _riskScore) view returns (uint256)',
  'function getLatestPrice(address _token) view returns (uint256 price, bool isStale)',
  'function updatePrice(address _token) returns (uint256)',
  'function setPriceFeed(address _token, address _feed)',
];

export function useOracle(contractAddress) {
  const { provider } = useWeb3();
  const [oracle, setOracle] = useState(null);
  const [ethPrice, setEthPrice] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractAddress && provider) {
      const o = new ethers.Contract(contractAddress, ORACLE_ABI, provider);
      setOracle(o);
    }
  }, [contractAddress, provider]);

  const getETHPrice = useCallback(async () => {
    if (!oracle) return '0';
    try {
      const price = await oracle.getETHPrice();
      return ethers.formatEther(price);
    } catch (e) {
      console.error(e);
      return '0';
    }
  }, [oracle]);

  const getTokenPrice = useCallback(async (tokenAddress) => {
    if (!oracle) return { price: '0', updatedAt: 0 };
    try {
      const [price, updatedAt] = await oracle.getLatestPrice(tokenAddress);
      return { price: price.toString(), updatedAt: updatedAt.toString() };
    } catch (e) {
      console.error(e);
      return { price: '0', updatedAt: 0 };
    }
  }, [oracle]);

  const getValueInUSD = useCallback(async (tokenAddress, amount) => {
    if (!oracle) return '0';
    try {
      const value = await oracle.getValueInUSD(tokenAddress, ethers.parseEther(amount.toString()));
      return ethers.formatEther(value);
    } catch (e) {
      console.error(e);
      return '0';
    }
  }, [oracle]);

  const refresh = useCallback(async (tokenAddress) => {
    if (!oracle) return null;
    setLoading(true);
    try {
      const tx = await oracle.updatePrice(tokenAddress);
      await tx.wait();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [oracle]);

  return {
    oracle,
    ethPrice,
    getETHPrice,
    getTokenPrice,
    getValueInUSD,
    refresh,
    loading,
    error
  };
}

export function useInsuranceOracle(contractAddress) {
  const { provider } = useWeb3();
  const [oracle, setOracle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractAddress && provider) {
      const o = new ethers.Contract(contractAddress, INSURANCE_ORACLE_ABI, provider);
      setOracle(o);
    }
  }, [contractAddress, provider]);

  const calculatePremium = useCallback(async (tokenAddress, basePremium, riskScore) => {
    if (!oracle) return '0';
    try {
      const premium = await oracle.calculatePremium(
        tokenAddress,
        ethers.parseEther(basePremium.toString()),
        riskScore
      );
      return ethers.formatEther(premium);
    } catch (e) {
      console.error(e);
      return '0';
    }
  }, [oracle]);

  const getLatestPrice = useCallback(async (tokenAddress) => {
    if (!oracle) return { price: '0', isStale: true };
    try {
      const [price, isStale] = await oracle.getLatestPrice(tokenAddress);
      return { price: price.toString(), isStale };
    } catch (e) {
      console.error(e);
      return { price: '0', isStale: true };
    }
  }, [oracle]);

  const setPriceFeed = useCallback(async (tokenAddress, feedAddress) => {
    if (!oracle) return null;
    setLoading(true);
    try {
      const tx = await oracle.setPriceFeed(tokenAddress, feedAddress);
      await tx.wait();
      return tx;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [oracle]);

  return {
    oracle,
    calculatePremium,
    getLatestPrice,
    setPriceFeed,
    loading,
    error
  };
}

export function usePriceFeeds() {
  const ETH_USD_FEED = process.env.NEXT_PUBLIC_ETH_USD_FEED || '0x5f4eC3Df9cEEbF5ac5D17E2E2A2C7fB3C1aE9F2e';
  const MATIC_USD_FEED = process.env.NEXT_PUBLIC_MATIC_USD_FEED || '0x572bSc55E3D1bB3C3b55D9F3dB2b3fB3C3b55D9F';
  
  const { provider } = useWeb3();
  const [prices, setPrices] = useState({ ETH: '0', MATIC: '0' });
  const [loading, setLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    if (!provider) return;
    setLoading(true);

    try {
      const feeds = [
        { symbol: 'ETH', address: ETH_USD_FEED },
        { symbol: 'MATIC', address: MATIC_USD_FEED }
      ];

      const newPrices = {};
      
      for (const feed of feeds) {
        try {
          const aggregator = new ethers.Contract(
            feed.address,
            ['function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)'],
            provider
          );
          const [, answer] = await aggregator.latestRoundData();
          newPrices[feed.symbol] = (Number(answer) / 1e8).toFixed(2);
        } catch (e) {
          console.error(`Price fetch error for ${feed.symbol}:`, e);
          newPrices[feed.symbol] = '0';
        }
      }

      setPrices(newPrices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [provider, ETH_USD_FEED, MATIC_USD_FEED]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    refresh: fetchPrices
  };
}