"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Heart } from "lucide-react";
import DoctorDashboard from "@/components/doctor-dashboard";
import PatientDashboard from "@/components/patient-dashboard";
import Web3 from "web3";
import PatientContractABI from "../contracts/Patient.json";
import DoctorContractABI from "../contracts/Doctor.json";
import SignupPatient from "@/components/signup-patient";
import SignupDoctor from "@/components/signup-doctor";

export default function HomePage() {
    const [userType, setUserType] = useState("patient");
    const [walletAddress, setWalletAddress] = useState("");
    const [dashboard, setDashboard] = useState(null);
    const [Account, setAccount] = useState("");
    const [PatientContract, setPatientContract] = useState(null);
    const [DoctorContract, setDoctorContract] = useState(null);
    const [error, setError] = useState("");

    const onLogout = () => {
        setAccount("");
        setPatientContract(null);
        setDoctorContract(null);
        setDashboard(null);
        setUserType("patient"); // Reset to default user type or handle as needed
        console.log("User logged out successfully.");
    };

    const handleConnect = async () => {
        try {
            if (!window.ethereum) {
                setError(
                    "MetaMask is not installed. Please install it to continue."
                );
                return;
            }

            const web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.requestAccounts();
            setWalletAddress(accounts[0]);

            if (userType === "doctor") {
                const exists = await DoctorContract.methods
                    .doctorExists(accounts[0])
                    .call();
                if (exists) {
                    setDashboard(
                        <DoctorDashboard
                            account={accounts[0]}
                            contract={DoctorContract}
                            onLogout={onLogout}
                        />
                    );
                } else {
                    setDashboard(<SignupDoctor contract={DoctorContract} />);
                }
            } else if (userType === "patient") {
                const exists = await PatientContract.methods
                    .userExists(accounts[0])
                    .call();
                if (exists) {
                    setDashboard(
                        <PatientDashboard
                            account={accounts[0]}
                            contract={PatientContract}
                            onLogout={onLogout}
                            doctorContract={DoctorContract}
                        />
                    );
                } else {
                    setDashboard(<SignupPatient contract={PatientContract} />);
                }
            }
        } catch (err) {
            setError(err.message || "An error occurred while connecting.");
        }
    };

    useEffect(() => {
        const init = async () => {
            if (!window.ethereum) {
                setError(
                    "MetaMask is not installed. Please install it to continue."
                );
                return;
            }
            const web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            setAccount(accounts[0]);

            const networkId = await web3.eth.net.getId();

            const patientDeployedNetwork =
                PatientContractABI.networks[networkId];
            const patientInstance = new web3.eth.Contract(
                PatientContractABI.abi,
                patientDeployedNetwork && patientDeployedNetwork.address
            );
            console.log(patientInstance);
            setPatientContract(patientInstance);
            const doctorDeployedNetwork = DoctorContractABI.networks[networkId];
            const DoctorInstance = new web3.eth.Contract(
                DoctorContractABI.abi,
                doctorDeployedNetwork && doctorDeployedNetwork.address
            );
            console.log(DoctorInstance);
            setDoctorContract(DoctorInstance);
        };
        init();
    }, [Account, userType]);

    if (dashboard) return dashboard;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-2">
                            <Heart className="h-8 w-8 text-[#7eb0d5]" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                HealthShare
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Shield className="h-5 w-5 text-[#b2e061]" />
                            <span className="text-sm text-gray-600">
                                Secure & Private
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Secure Healthcare Data Exchange
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Connecting patients and healthcare providers through
                        secure, privacy-focused data sharing
                    </p>
                </div>

                {/* Authentication */}
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Access Your Account</CardTitle>
                        <CardDescription>
                            Sign in to access your secure healthcare dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={userType} onValueChange={setUserType}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="patient">
                                    Patient
                                </TabsTrigger>
                                <TabsTrigger value="doctor">Doctor</TabsTrigger>
                            </TabsList>

                            <TabsContent value="patient">
                                <div className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleConnect}
                                        className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                                    >
                                        {Account
                                            ? `Connected: ${Account.slice(
                                                  0,
                                                  6
                                              )}...${Account.slice(-4)}`
                                            : "Connect with MetaMask"}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="doctor">
                                <div className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleConnect}
                                        className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                                    >
                                        {Account
                                            ? `Connected: ${Account.slice(
                                                  0,
                                                  6
                                              )}...${Account.slice(-4)}`
                                            : "Connect with MetaMask"}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
