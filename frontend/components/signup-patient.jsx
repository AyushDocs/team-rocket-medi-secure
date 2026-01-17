"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWeb3 } from "../context/Web3Context";

export default function SignupPatient() {
  const { patientContract, account } = useWeb3();
  const router = useRouter();

  const [username, setUsername] = useState(""); // 1. Add username state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!patientContract) {
      setErrorMessage("Contract not connected. Please check your network.");
      return;
    }
    if (!username || !name || !email || !age || !bloodGroup) { // 2. Validate username
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // 3. Pass username to contract
      const tx = await patientContract.registerPatient(username, name, email, parseInt(age), bloodGroup);
      await tx.wait();

      setSuccessMessage("Patient registered successfully!");
      setTimeout(() => {
          router.push("/patient/dashboard");
      }, 1500);

    } catch (error) {
      console.error(error);
      setErrorMessage(error.reason || error.message || "An error occurred during registration.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Patient Signup</CardTitle>
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
              placeholder="Unique Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <Input
              placeholder="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            />
            <Button onClick={handleSignup} disabled={loading} className="w-full bg-[#703FA1] hover:bg-[#5a2f81]">
              {loading ? "Registering..." : "Sign Up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
