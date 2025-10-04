"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Web3 from "web3";

export default function SignupDoctor({ contract }) {
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async () => {
    if (!name || !specialization || !email) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      if (!window.ethereum) {
        setErrorMessage("MetaMask is not installed. Please install it to continue.");
        return;
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);

      await contract.methods
        .registerDoctor(name, specialization, email)
        .send({ from: accounts[0] });

      setSuccessMessage("Doctor registered successfully!");
    } catch (error) {
      setErrorMessage(error.message || "An error occurred during registration.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Doctor Signup</CardTitle>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {errorMessage}
            </div>
          )}
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleSignup} className="w-full bg-[#703FA1] hover:bg-[#5a2f81]">
              Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}