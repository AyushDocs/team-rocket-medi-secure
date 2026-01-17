"use client";

import { ethers } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import DoctorContractABI from "../contracts/Doctor.json";
import PatientContractABI from "../contracts/Patient.json";
import MarketplaceContractABI from "../contracts/Marketplace.json";

const Web3Context = createContext();
export const Web3Provider = ({ children }) => {
    const [patientContract, setPatientContract] = useState(null);
    const [doctorContract, setDoctorContract] = useState(null);
    const [marketplaceContract, setMarketplaceContract] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const connect = async () => {
        setLoading(true);
        setError(null);
        try {
            if (typeof window.ethereum === 'undefined')
                throw new Error("MetaMask is not installed.");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
                
            const network = await provider.getNetwork();
            const netId = network.chainId.toString();
                
            console.log(`Web3Context: Detected Network ID: ${netId}`);
            
            let patientNetworkData = PatientContractABI.networks[netId];
            let doctorNetworkData = DoctorContractABI.networks[netId];
            let marketNetworkData = MarketplaceContractABI.networks[netId];

            if (!patientNetworkData) {
                const pIds = Object.keys(PatientContractABI.networks);
                if (pIds.length > 0) {
                    const fallbackId = pIds[pIds.length - 1];
                    console.warn(`Patient Contract not found on network ${netId}. Falling back to ${fallbackId}`);
                    patientNetworkData = PatientContractABI.networks[fallbackId];
                }
            }

            if (!doctorNetworkData) {
                const dIds = Object.keys(DoctorContractABI.networks);
                if (dIds.length > 0) {
                    const fallbackId = dIds[dIds.length - 1];
                    console.warn(`Doctor Contract not found on network ${netId}. Falling back to ${fallbackId}`);
                    doctorNetworkData = DoctorContractABI.networks[fallbackId];
                }
            }

            if (!marketNetworkData) {
                const mIds = Object.keys(MarketplaceContractABI.networks);
                if (mIds.length > 0) {
                    const fallbackId = mIds[mIds.length - 1];
                    console.warn(`Marketplace Contract not found on network ${netId}. Falling back to ${fallbackId}`);
                    marketNetworkData = MarketplaceContractABI.networks[fallbackId];
                }
            }

            if (!patientNetworkData || !doctorNetworkData || !marketNetworkData) {
                throw new Error(`Contracts not deployed on this network (ID: ${netId})`);
            }
            
            console.log("Patient Contract Address:", patientNetworkData.address);
            console.log("Doctor Contract Address:", doctorNetworkData.address);
            console.log("Marketplace Contract Address:", marketNetworkData.address);

            const patientContract = new ethers.Contract(patientNetworkData.address, PatientContractABI.abi, signer);
            const doctorContract = new ethers.Contract(doctorNetworkData.address, DoctorContractABI.abi, signer);
            const marketContract = new ethers.Contract(marketNetworkData.address, MarketplaceContractABI.abi, signer);

            setPatientContract(patientContract);
            setDoctorContract(doctorContract);
            setMarketplaceContract(marketContract);
            setAccount(address);
            setIsConnected(true);
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    const disconnect = () => {
        setPatientContract(null);
        setDoctorContract(null);
        setMarketplaceContract(null);
        setIsConnected(false);
        setAccount(null);
    }
    
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    connect();
                } else {
                    disconnect();
                }
            });
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
        
        // Optional: Check if already connected
        const checkConnection = async () => {
            if (window.ethereum) {
                 const provider = new ethers.BrowserProvider(window.ethereum);
                 const accounts = await provider.listAccounts();
                 if (accounts.length > 0) {
                     connect();
                 }
            }
        };
        checkConnection();
    }, []);

  return (
    <Web3Context.Provider
      value={{
        connect,
        patientContract,
        doctorContract,
        marketplaceContract,
        isConnected,
        account,
        loading,
        error,
        disconnect
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};
