"use client";

import { ethers } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import DoctorContractABI from "../contracts/Doctor.json";
import HospitalContractABI from "../contracts/Hospital.json";
import MarketplaceContractABI from "../contracts/Marketplace.json";
import PatientContractABI from "../contracts/Patient.json";
import PatientDetailsContractABI from "../contracts/PatientDetailsProxy.json";

// Force HMR Check
const Web3Context = createContext();
export const Web3Provider = ({ children }) => {
    const [patientContract, setPatientContract] = useState(null);
    const [doctorContract, setDoctorContract] = useState(null);
    const [marketplaceContract, setMarketplaceContract] = useState(null);
    const [hospitalContract, setHospitalContract] = useState(null);
    const [patientDetailsContract, setPatientDetailsContract] = useState(null);
    const [emergencyState, setEmergencyState] = useState({ active: false, hospital: "" });
    const [knownHospitals, setKnownHospitals] = useState([
        { name: "City General (NYC)", address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1" },
        { name: "Community Health (LA)", address: "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E" }
    ]);
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
            let hospitalNetworkData = HospitalContractABI.networks[netId];
            let patientDetailsNetworkData = PatientDetailsContractABI.networks[netId];

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

            if (!hospitalNetworkData) {
                const hIds = Object.keys(HospitalContractABI.networks);
                if (hIds.length > 0) {
                    const fallbackId = hIds[hIds.length - 1];
                    console.warn(`Hospital Contract not found on network ${netId}. Falling back to ${fallbackId}`);
                    hospitalNetworkData = HospitalContractABI.networks[fallbackId];
                }
            }

            if (!patientDetailsNetworkData) {
                const pdIds = Object.keys(PatientDetailsContractABI.networks);
                if (pdIds.length > 0) {
                    const fallbackId = pdIds[pdIds.length - 1];
                    console.warn(`PatientDetails Contract not found on network ${netId}. Falling back to ${fallbackId}`);
                    patientDetailsNetworkData = PatientDetailsContractABI.networks[fallbackId];
                }
            }

            if (!patientNetworkData || !doctorNetworkData || !marketNetworkData || !hospitalNetworkData || !patientDetailsNetworkData) {
                throw new Error(`Contracts not deployed on this network (ID: ${netId})`);
            }
            
            console.log("Patient Contract Address:", patientNetworkData.address);
            console.log("Doctor Contract Address:", doctorNetworkData.address);
            console.log("Marketplace Contract Address:", marketNetworkData.address);
            console.log("Hospital Contract Address:", hospitalNetworkData.address);
            console.log("PatientDetails Contract Address:", patientDetailsNetworkData.address);

            const patientContract = new ethers.Contract(patientNetworkData.address, PatientContractABI.abi, signer);
            const doctorContract = new ethers.Contract(doctorNetworkData.address, DoctorContractABI.abi, signer);
            const marketContract = new ethers.Contract(marketNetworkData.address, MarketplaceContractABI.abi, signer);
            const hospContract = new ethers.Contract(hospitalNetworkData.address, HospitalContractABI.abi, signer);
            const pDetailsContract = new ethers.Contract(patientDetailsNetworkData.address, PatientDetailsContractABI.abi, signer);

            setPatientContract(patientContract);
            setDoctorContract(doctorContract);
            setMarketplaceContract(marketContract);
            setHospitalContract(hospContract);
            setPatientDetailsContract(pDetailsContract);
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
        setHospitalContract(null);
        setPatientDetailsContract(null);
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

    // Load Emergency State from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem("mediSecure_dutyHospital");
        if (stored && ethers.isAddress(stored)) {
            setEmergencyState({ active: true, hospital: stored });
        }
    }, []);

    const updateEmergencyState = (state) => {
        setEmergencyState(state);
        if (state.active && state.hospital) {
            localStorage.setItem("mediSecure_dutyHospital", state.hospital);
        } else {
            localStorage.removeItem("mediSecure_dutyHospital");
        }
    };

    // Load custom hospitals from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem("mediSecure_customHospitals");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setKnownHospitals(prev => {
                        // Avoid duplicates
                        const combined = [...prev];
                        parsed.forEach(h => {
                            if (!combined.find(c => c.address.toLowerCase() === h.address.toLowerCase())) {
                                combined.push(h);
                            }
                        });
                        return combined;
                    });
                }
            } catch(e) { console.error("Failed to parse custom hospitals", e); }
        }
    }, []);

    const addHospital = (address, name = "Custom Hospital") => {
        if (!ethers.isAddress(address)) return;
        setKnownHospitals(prev => {
            if (prev.find(h => h.address.toLowerCase() === address.toLowerCase())) return prev;
            const updated = [...prev, { name, address }];
            localStorage.setItem("mediSecure_customHospitals", JSON.stringify(updated.filter(h => 
                !["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E"].includes(h.address)
            )));
            return updated;
        });
    };

  return (
    <Web3Context.Provider
      value={{
        connect,
        patientContract,
        doctorContract,
        marketplaceContract,
        hospitalContract,
        patientDetailsContract,
        emergencyState,
        setEmergencyState: updateEmergencyState,
        isConnected,
        account,
        loading,
        error,
        disconnect,
        knownHospitals,
        addHospital
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};
