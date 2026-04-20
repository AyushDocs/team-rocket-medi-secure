"use client";

import { ethers } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import DoctorContractABI from "../contracts/Doctor.json";
import HospitalContractABI from "../contracts/Hospital.json";
import InsuranceContractABI from "../contracts/Insurance.json";
import MarketplaceContractABI from "../contracts/Marketplace.json";
import PatientContractABI from "../contracts/Patient.json";
import PatientDetailsContractABI from "../contracts/PatientDetails.json";
import SanjeevniTokenABI from "../contracts/SanjeevniToken.json";
import InsurancePriceOracleABI from "../contracts/InsurancePriceOracle.json";
import WellnessRewardsABI from "../contracts/WellnessRewards.json";
import PriceMedianizerABI from "../contracts/PriceMedianizer.json";
import ConsentSBTABI from "../contracts/ConsentSBT.json";
import { signInWithGoogle, onAuthChange } from "../hooks/lib/auth";
import { captureContractError, captureContractEvent, setUserContext, clearUserContext } from "@/lib/sentry";
import { logEvent, logError, logContractEvent, logWeb3Action } from "@/lib/elk";

const Web3Context = createContext();

const ENV_CONTRACTS = {
    patient: process.env.NEXT_PUBLIC_PATIENT_CONTRACT,
    doctor: process.env.NEXT_PUBLIC_DOCTOR_CONTRACT,
    hospital: process.env.NEXT_PUBLIC_HOSPITAL_CONTRACT,
    patientDetails: process.env.NEXT_PUBLIC_PATIENT_DETAILS_CONTRACT,
    insurance: process.env.NEXT_PUBLIC_INSURANCE_CONTRACT,
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    wellness: process.env.NEXT_PUBLIC_WELLNESS_CONTRACT,
    medianizer: process.env.NEXT_PUBLIC_MEDIANIZER_CONTRACT,
    consentSbt: process.env.NEXT_PUBLIC_CONSENT_SBT_CONTRACT
};

class ManagedSigner extends ethers.AbstractSigner {
    constructor(address, provider, userId) {
        super(provider);
        this.address = address;
        this.userId = userId;
    }

    async getAddress() {
        return this.address;
    }

    async signMessage(message) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/sign-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, message })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Failed to sign message");
        return data.signature;
    }

    async signTransaction(transaction) {
        throw new Error("signTransaction not supported by ManagedSigner. Use sendTransaction instead.");
    }

    async signTypedData(domain, types, value) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/sign-typed-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, domain, types, value })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Failed to sign typed data");
        return data.signature;
    }

    async sendTransaction(transaction) {
        const txData = {
            to: transaction.to,
            data: transaction.data,
            value: transaction.value ? transaction.value.toString() : "0",
            gasLimit: transaction.gasLimit ? transaction.gasLimit.toString() : "1000000",
            gasPrice: transaction.gasPrice ? transaction.gasPrice.toString() : undefined,
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/send-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, txData })
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Failed to send transaction via custodian");
        
        const txHash = data.transactionHash;

        // In Ethers v6, Contract functions expect a TransactionResponse
        // which should be then-able or have a wait() method.
        // We return an object that mimics the expected structure.
        const txResponse = {
            hash: txHash,
            to: transaction.to,
            from: this.address,
            data: transaction.data || "0x",
            value: transaction.value ? BigInt(transaction.value.toString()) : 0n,
            chainId: (await this.provider.getNetwork()).chainId,
            confirmations: 0,
            nonce: await this.provider.getTransactionCount(this.address),
            gasLimit: BigInt(txData.gasLimit),
            gasPrice: txData.gasPrice ? BigInt(txData.gasPrice) : undefined,
            type: 0,
            blockNumber: null,
            blockHash: null,
            wait: async (confirms) => {
                console.log(`Waiting for tx: ${txHash}`);
                const receipt = await this.provider.waitForTransaction(txHash, confirms);
                return receipt;
            }
        };

        // Ensure it's not double-unwrapped by removing or fixing 'then'
        // Ethers v6 TransactionResponse is not thenable, but if we want to support 
        // older patterns where people might await it twice:
        return txResponse;

    }

    connect(provider) {
        return new ManagedSigner(this.address, provider, this.userId);
    }
}

export const Web3Provider = ({ children }) => {
    const [patientContract, setPatientContract] = useState(null);
    const [doctorContract, setDoctorContract] = useState(null);
    const [marketplaceContract, setMarketplaceContract] = useState(null);
    const [hospitalContract, setHospitalContract] = useState(null);
    const [patientDetailsContract, setPatientDetailsContract] = useState(null);
    const [insuranceContract, setInsuranceContract] = useState(null);
    const [wellnessContract, setWellnessContract] = useState(null);
    const [medianizerContract, setMedianizerContract] = useState(null);
    const [consentSbtContract, setConsentSbtContract] = useState(null);
    const [emergencyState, setEmergencyState] = useState({ active: false, hospital: "" });
    const [knownHospitals, setKnownHospitals] = useState([
        { name: "City General (NYC)", address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1" },
        { name: "Community Health (LA)", address: "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E" }
    ]);
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Custodian wallet state
    const [custodianUser, setCustodianUser] = useState(null);
    const [authMode, setAuthMode] = useState(null); // 'wallet' | 'custodian' | null

    const connectWithWallet = async () => {
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
            
            // Priority: env variables > ABI networks
            const getContractAddress = (envVar, abiNetworks, netId) => {
                if (envVar && ethers.isAddress(envVar)) {
                    console.log(`Using contract address from Environment Variable: ${envVar}`);
                    return { address: envVar, fromEnv: true };
                }
                const networkData = abiNetworks[netId];
                if (networkData) {
                    return { address: networkData.address, fromEnv: false };
                }
                // Fallback to last known network
                const keys = Object.keys(abiNetworks);
                if (keys.length > 0) {
                    const fallbackId = keys[keys.length - 1];
                    const addr = abiNetworks[fallbackId].address;
                    console.warn(`Contract not found on network ${netId}. Falling back to network ${fallbackId} address: ${addr}`);
                    return { address: addr, fromEnv: false };
                }
                console.error(`Contract NOT FOUND for network ${netId} and no fallback available.`);
                return null;
            };

            const patientAddr = getContractAddress(ENV_CONTRACTS.patient, PatientContractABI.networks, netId);
            const doctorAddr = getContractAddress(ENV_CONTRACTS.doctor, DoctorContractABI.networks, netId);
            const marketAddr = getContractAddress(ENV_CONTRACTS.marketplace, MarketplaceContractABI.networks, netId);
            const hospitalAddr = getContractAddress(ENV_CONTRACTS.hospital, HospitalContractABI.networks, netId);
            const patientDetailsAddr = getContractAddress(ENV_CONTRACTS.patientDetails, PatientDetailsContractABI.networks, netId);
            const insuranceAddr = getContractAddress(ENV_CONTRACTS.insurance, InsuranceContractABI.networks, netId);
            const wellnessAddr = getContractAddress(ENV_CONTRACTS.wellness, WellnessRewardsABI.networks, netId);
            const medianizerAddr = getContractAddress(ENV_CONTRACTS.medianizer, PriceMedianizerABI.networks, netId);
            const sbtAddr = getContractAddress(ENV_CONTRACTS.consentSbt, ConsentSBTABI.networks, netId);

            if (!patientAddr || !doctorAddr || !marketAddr || !hospitalAddr || !patientDetailsAddr || !insuranceAddr) {
                throw new Error(`Contracts not deployed on this network (ID: ${netId})`);
            }
            
            console.log("Patient Contract Address:", patientAddr.address, patientAddr.fromEnv ? "(from env)" : "(from ABI)");
            console.log("Doctor Contract Address:", doctorAddr.address, doctorAddr.fromEnv ? "(from env)" : "(from ABI)");
            console.log("Marketplace Contract Address:", marketAddr.address, marketAddr.fromEnv ? "(from env)" : "(from ABI)");
            console.log("Hospital Contract Address:", hospitalAddr.address, hospitalAddr.fromEnv ? "(from env)" : "(from ABI)");
            console.log("PatientDetails Contract Address:", patientDetailsAddr.address, patientDetailsAddr.fromEnv ? "(from env)" : "(from ABI)");
            console.log("Insurance Contract Address:", insuranceAddr.address, insuranceAddr.fromEnv ? "(from env)" : "(from ABI)");

            const patientContract = new ethers.Contract(patientAddr.address, PatientContractABI.abi, signer);
            const doctorContract = new ethers.Contract(doctorAddr.address, DoctorContractABI.abi, signer);
            const marketContract = new ethers.Contract(marketAddr.address, MarketplaceContractABI.abi, signer);
            const hospContract = new ethers.Contract(hospitalAddr.address, HospitalContractABI.abi, signer);
            const pDetailsContract = new ethers.Contract(patientDetailsAddr.address, PatientDetailsContractABI.abi, signer);
            const insContract = new ethers.Contract(insuranceAddr.address, InsuranceContractABI.abi, signer);
            const wellContract = wellnessAddr ? new ethers.Contract(wellnessAddr.address, WellnessRewardsABI.abi, signer) : null;
            const medContract = medianizerAddr ? new ethers.Contract(medianizerAddr.address, PriceMedianizerABI.abi, signer) : null;
            const sbtContract = sbtAddr ? new ethers.Contract(sbtAddr.address, ConsentSBTABI.abi, signer) : null;

            setPatientContract(patientContract);
            setDoctorContract(doctorContract);
            setMarketplaceContract(marketContract);
            setHospitalContract(hospContract);
            setPatientDetailsContract(pDetailsContract);
            setInsuranceContract(insContract);
            setWellnessContract(wellContract);
            setMedianizerContract(medContract);
            setConsentSbtContract(sbtContract);
            setAccount(address);
            setIsConnected(true);
            setAuthMode('wallet');
            localStorage.removeItem("mediSecure_manualDisconnect");

            setUserContext(address, 'wallet');
            captureContractEvent('WalletConnected', { address, network: netId });
            logWeb3Action('wallet_connected', { address, network: netId });
        } catch (error) {
            console.error(error);
            captureContractError(error, { context: 'connectWithWallet' });
            logError(error, { context: 'connectWithWallet' });
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const connectWithGoogle = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = await signInWithGoogle();
            if (user) {
                setCustodianUser(user);
                setAuthMode('custodian');
                
                // If user has NO linked wallet, create a new custodian wallet on the backend
                let walletAddress = user.walletAddress;
                if (!walletAddress) {
                    try {
                        console.log("Web3Context: Requesting new custodian wallet for", user.uid);
                        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/create-wallet`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.uid })
                        });
                        const data = await response.json();
                        if (data.success && data.wallet) {
                            walletAddress = data.wallet.address;
                            console.log("Web3Context: New custodian wallet created:", walletAddress);
                            
                            // Link it in Firestore for future sessions
                            await linkWallet(walletAddress);
                        }
                    } catch (apiError) {
                        console.error("Web3Context: Failed to create custodian wallet:", apiError);
                    }
                }

                if (walletAddress) {
                    setAccount(walletAddress);
                    // Ensure wallet is seeded for local dev
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/faucet`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: walletAddress })
                        });
                    } catch (faucetErr) {
                        console.warn("Auto-faucet failed:", faucetErr);
                    }
                    // Setup contracts with ManagedSigner for this address
                    await setupContractsForCustodian(walletAddress, user.uid);

                }
            }
        } catch (error) {
            console.error("Google sign-in error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const setupContractsForCustodian = async (walletAddress, userId) => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545');
            const signer = new ManagedSigner(walletAddress, provider, userId);
            const network = await provider.getNetwork();
            const netId = network.chainId.toString();
            
            const getContractAddress = (envVar, abiNetworks, netId) => {
                if (envVar && ethers.isAddress(envVar)) return envVar;
                const networkData = abiNetworks[netId];
                if (networkData) return networkData.address;
                const keys = Object.keys(abiNetworks);
                if (keys.length > 0) {
                    const fallbackId = keys[keys.length - 1];
                    const addr = abiNetworks[fallbackId].address;
                    console.warn(`[Custodian] Contract not on network ${netId}. Falling back to network ${fallbackId} address: ${addr}`);
                    return addr;
                }
                return null;
            };

            console.log(`Web3Context: [Custodian] Detected Network ID: ${netId}`);

            const addrs = {
                patient: getContractAddress(ENV_CONTRACTS.patient, PatientContractABI.networks, netId),
                doctor: getContractAddress(ENV_CONTRACTS.doctor, DoctorContractABI.networks, netId),
                marketplace: getContractAddress(ENV_CONTRACTS.marketplace, MarketplaceContractABI.networks, netId),
                hospital: getContractAddress(ENV_CONTRACTS.hospital, HospitalContractABI.networks, netId),
                patientDetails: getContractAddress(ENV_CONTRACTS.patientDetails, PatientDetailsContractABI.networks, netId),
                insurance: getContractAddress(ENV_CONTRACTS.insurance, InsuranceContractABI.networks, netId),
                wellness: getContractAddress(ENV_CONTRACTS.wellness, WellnessRewardsABI.networks, netId),
                medianizer: getContractAddress(ENV_CONTRACTS.medianizer, PriceMedianizerABI.networks, netId),
                consentSbt: getContractAddress(ENV_CONTRACTS.consentSbt, ConsentSBTABI.networks, netId)
            };

            console.log("Web3Context: [Custodian] Patient Address:", addrs.patient);
            console.log("Web3Context: [Custodian] Signer Address:", walletAddress);

            setPatientContract(new ethers.Contract(addrs.patient, PatientContractABI.abi, signer));
            setDoctorContract(new ethers.Contract(addrs.doctor, DoctorContractABI.abi, signer));
            setMarketplaceContract(new ethers.Contract(addrs.marketplace, MarketplaceContractABI.abi, signer));
            setHospitalContract(new ethers.Contract(addrs.hospital, HospitalContractABI.abi, signer));
            setPatientDetailsContract(new ethers.Contract(addrs.patientDetails, PatientDetailsContractABI.abi, signer));
            setInsuranceContract(new ethers.Contract(addrs.insurance, InsuranceContractABI.abi, signer));
            setWellnessContract(new ethers.Contract(addrs.wellness, WellnessRewardsABI.abi, signer));
            setMedianizerContract(new ethers.Contract(addrs.medianizer, PriceMedianizerABI.abi, signer));
            setConsentSbtContract(new ethers.Contract(addrs.consentSbt, ConsentSBTABI.abi, signer));

            setIsConnected(true);
        } catch (error) {
            console.error("Error setting up contracts for custodian:", error);
        } finally {
            setLoading(false);
        }

    };

    const disconnect = () => {
        setPatientContract(null);
        setDoctorContract(null);
        setMarketplaceContract(null);
        setHospitalContract(null);
        setPatientDetailsContract(null);
        setInsuranceContract(null);
        setIsConnected(false);
        setAccount(null);
        setCustodianUser(null);
        setAuthMode(null);
        clearUserContext();
        localStorage.setItem("mediSecure_manualDisconnect", "true");
        captureContractEvent('WalletDisconnected', {});
        logWeb3Action('wallet_disconnected', {});
    }

    const linkWallet = async (walletAddress) => {
        if (custodianUser && walletAddress) {
            // Update Firestore
            const { linkWalletToCustodian } = await import("../hooks/lib/auth");
            await linkWalletToCustodian(custodianUser.uid, walletAddress);
            
            // Update local state
            setCustodianUser(prev => ({
                ...prev,
                walletAddress,
                linkedToWallet: true
            }));
            setAccount(walletAddress);
            setAuthMode('custodian');
        }
    };
    
    useEffect(() => {
        // Listen for auth changes
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setCustodianUser(user);
                if (user.walletAddress) {
                    setAccount(user.walletAddress);
                    setAuthMode('custodian');
                    setLoading(true);
                    setupContractsForCustodian(user.walletAddress, user.uid);
                }

            } else {
                setCustodianUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    connectWithWallet();
                } else {
                    disconnect();
                }
            });
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
        
        const checkConnection = async () => {
             const isManualDisconnect = localStorage.getItem("mediSecure_manualDisconnect") === "true";
             if (window.ethereum && !isManualDisconnect) {
                  const provider = new ethers.BrowserProvider(window.ethereum);
                  const accounts = await provider.listAccounts();
                  if (accounts.length > 0) {
                      connectWithWallet();
                  }
             }
        };
        checkConnection();
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("mediSecure_dutyHospital");
        if (stored && ethers.isAddress(stored)) {
            setEmergencyState({ active: true, hospital: stored });
        }
    }, []);

    const updateEmergencyState = (state) => {
        console.log(state)
        setEmergencyState(state);
        if (state.active && state.hospital) {
            localStorage.setItem("mediSecure_dutyHospital", state.hospital);
        } else {
            localStorage.removeItem("mediSecure_dutyHospital");
        }
    };

    const toggleEmergencyMode = () => {
        setEmergencyState(prev => ({
            active: !prev.active,
            hospital: prev.hospital
        }));
    };

    useEffect(() => {
        const stored = localStorage.getItem("mediSecure_customHospitals");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setKnownHospitals(prev => {
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
        connect: connectWithWallet,
        connectWithGoogle,
        linkWallet,
        patientContract,
        doctorContract,
        marketplaceContract,
        hospitalContract,
        patientDetailsContract,
        insuranceContract,
        wellnessContract,
        medianizerContract,
        consentSbtContract,
        emergencyState,
        setEmergencyState: updateEmergencyState,
        toggleEmergencyMode,
        isConnected,
        account,
        loading,
        error,
        disconnect,
        knownHospitals,
        addHospital,
        // Specialized EIP-712 Helpers
        signGrantConsent: async (doctor, metadataURI) => {
            if (!patientContract || !account) throw new Error("Wallet not connected");
            const activeSigner = patientContract.runner; // Gets the signer the contract is connected to
            if (!activeSigner) throw new Error("Contract runner not available");

            const network = await activeSigner.provider.getNetwork();
            const domain = {
                name: "Sanjeevni Patient",
                version: "1",
                chainId: network.chainId,
                verifyingContract: await patientContract.getAddress()
            };
            const types = {
                GrantConsent: [
                    { name: "doctor", type: "address" },
                    { name: "metadataURI", type: "string" },
                    { name: "patient", type: "address" },
                    { name: "nonce", type: "uint256" }
                ]
            };
            const nonce = await patientContract.nonces(account);
            const value = { doctor, metadataURI, patient: account, nonce };
            
            return await activeSigner.signTypedData(domain, types, value);
        },
        signSellData: async (offerId, ipfsHash) => {
            if (!marketplaceContract || !account) throw new Error("Wallet not connected");
            const activeSigner = marketplaceContract.runner;
            if (!activeSigner) throw new Error("Contract runner not available");

            const network = await activeSigner.provider.getNetwork();
            const domain = {
                name: "Sanjeevni Marketplace",
                version: "1",
                chainId: network.chainId,
                verifyingContract: await marketplaceContract.getAddress()
            };
            const types = {
                SellData: [
                    { name: "offerId", type: "uint256" },
                    { name: "ipfsHash", type: "bytes32" },
                    { name: "patient", type: "address" },
                    { name: "nonce", type: "uint256" }
                ]
            };
            const nonce = await marketplaceContract.nonces(account);
            const value = { offerId, ipfsHash, patient: account, nonce };

            return await activeSigner.signTypedData(domain, types, value);
        },
        // Custodian auth
        custodianUser,
        authMode,
        isCustodian: authMode === 'custodian'
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};