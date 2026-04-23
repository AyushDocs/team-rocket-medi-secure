"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const WalletConnectContext = createContext(null);

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";
const RELAY_URL = `wss://relay.walletconnect.com?projectId=${PROJECT_ID}`;

let walletConnectProvider = null;

class WalletConnectQRCodeModal {
  constructor(options) {
    this.options = options;
    this.isOpen = false;
  }

  open(uri, cb) {
    this.uri = uri;
    this.isOpen = true;
    if (this.options?.onOpen) this.options.onOpen(uri);
    if (cb) cb(null, uri);
  }

  close() {
    this.isOpen = false;
    if (this.options?.onClose) this.options.onClose();
  }
}

class WalletConnectEthereumProvider {
  constructor(relayUrl, metadata) {
    this.relayUrl = relayUrl;
    this.metadata = metadata;
    this.session = null;
    this.accounts = [];
    this.chainId = 1;
    this.isConnected = false;
    this.requestId = 0;
    this.listeners = new Map();
  }

  async connect() {
    try {
      const { Topic, Relay } = await import("@walletconnect/core")).then(m => m.Topic, () => null).catch(() => null);
      
      return new Promise((resolve, reject) => {
        this._connectResolver = resolve;
        this._connectReject = reject;
        
        this._setupQRModal();
      });
    } catch (e) {
      throw new Error("WalletConnect not available - please use MetaMask");
    }
  }

  _setupQRModal() {
    const modal = new WalletConnectQRCodeModal({
      onOpen: (uri) => {
        if (this.onDisplayURI) this.onDisplayURI(uri);
      },
      onClose: () => {
        if (this._connectReject) this._connectReject(new Error("Connection rejected"));
      }
    });
    
    if (this.onDisplayURI) {
      const uri = `wc:${Date.now()}@2?bridge=https://bridge.walletconnect.org&key=${Date.now()}`;
      modal.open(uri);
    }
  }

  async request(args) {
    if (!this.session) throw new Error("Not connected");
    
    const { method, params = [] } = args;
    this.requestId++;
    
    const request = {
      id: this.requestId,
      jsonrpc: "2.0",
      method,
      params
    };

    try {
      if (method === "eth_requestAccounts") {
        return this.accounts;
      }
      if (method === "eth_chainId") {
        return ethers.utils.hexZeroPad(ethers.utils.hexValue(this.chainId), 32);
      }
      if (method === "personal_sign") {
        const [message, address] = params;
        const signParams = message.startsWith("0x") 
          ? message 
          : ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));
        
        return new Promise((resolve, reject) => {
          this._pendingResolve = resolve;
          this._pendingReject = reject;
        });
      }
      if (method === "eth_sendTransaction") {
        const tx = params[0];
        return new Promise((resolve, reject) => {
          this._pendingResolve = resolve;
          this._pendingReject = reject;
        });
      }
      
      throw new Error(`Method ${method} not supported`);
    } catch (e) {
      throw e;
    }
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  isWalletConnect() {
    return true;
  }

  getSigner() {
    return new WalletConnectSigner(this);
  }
}

class WalletConnectSigner extends ethers.Signer {
  constructor(provider) {
    super();
    this.provider = provider;
  }

  getAddress() {
    if (this.provider.accounts.length === 0) {
      return Promise.resolve(ethers.constants.AddressZero);
    }
    return Promise.resolve(this.provider.accounts[0]);
  }

  signMessage(message) {
    return this.provider.request({
      method: "personal_sign",
      params: [message, this.getAddress()]
    });
  }

  signTransaction(tx) {
    return this.provider.request({
      method: "eth_signTransaction",
      params: [tx]
    });
  }

  sendTransaction(tx) {
    return this.provider.request({
      method: "eth_sendTransaction",
      params: [tx]
    });
  }
}

function isWalletConnectProvider(provider) {
  return provider && provider.isWalletConnect && provider.isWalletConnect();
}

export function WalletConnectProvider({ children, projectId, chains }) {
  const [provider, setProvider] = useState(null);
  const [walletProvider, setWalletProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [chainId, setChainId] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const wcProvider = new WalletConnectEthereumProvider(RELAY_URL, {
        name: "Sanjeevni",
        description: "Decentralized Healthcare Platform",
        url: typeof window !== "undefined" ? window.location.origin : "",
        icons: ["https://sanjeevni.com/icon.png"]
      });
      
      await wcProvider.connect();
      
      const accounts = await wcProvider.request({ method: "eth_requestAccounts" });
      const chainId = await wcProvider.request({ method: "eth_chainId" });
      
      setWalletProvider(wcProvider);
      setAccounts(accounts);
      setChainId(parseInt(chainId, 16));
      setIsConnected(true);
      
      const ethersProvider = new ethers.providers.Web3Provider(wcProvider);
      setProvider(ethersProvider);
    } catch (e) {
      console.error("Connection error:", e);
      setError(e.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (walletProvider) {
      await walletProvider.disconnect?.();
    }
    setWalletProvider(null);
    setProvider(null);
    setAccounts([]);
    setIsConnected(false);
    setChainId(1);
  }, [walletProvider]);

  const switchChain = useCallback(async (newChainId) => {
    if (!walletProvider) return;
    
    try {
      await walletProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.utils.hexValue(newChainId) }]
      });
      setChainId(newChainId);
    } catch (e) {
      if (e.code === 4902) {
        await walletProvider.request({
          method: "wallet_addEthereumChain",
          params: [getChainParams(newChainId)]
        });
      }
    }
  }, [walletProvider]);

  const value = {
    provider,
    walletProvider,
    accounts,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
    isWalletConnect: true
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  return useContext(WalletConnectContext);
}

function getChainParams(chainId) {
  const chains = {
    1: { chainId: "0x1", chainName: "Ethereum", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://eth.llamarpc.com"], blockExplorerUrls: ["https://etherscan.io"] },
    11155111: { chainId: "0xaa36a7", chainName: "Sepolia", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://rpc.sepolia.org"], blockExplorerUrls: ["https://sepolia.etherscan.io"] },
    137: { chainId: "0x89", chainName: "Polygon", nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }, rpcUrls: ["https://polygon-rpc.com"], blockExplorerUrls: ["https://polygonscan.com"] },
  };
  return chains[chainId] || chains[1];
}

export default WalletConnectProvider;