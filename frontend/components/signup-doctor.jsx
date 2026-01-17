"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWeb3 } from "../context/Web3Context";

export default function SignupDoctor() {
  const { doctorContract, account } = useWeb3();
  const router = useRouter();

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!doctorContract) {
      setErrorMessage("Contract not connected. Please check your network.");
      return;
    }
    if (!name || !specialization || !email) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Ethers transaction
      const tx = await doctorContract.registerDoctor(name, specialization, email);
      await tx.wait();

      setSuccessMessage("Doctor registered successfully!");
      // Redirect after a short delay
      setTimeout(() => {
          router.push("/doctor/dashboard");
      }, 1500);

    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "An error occurred during registration.");
    } finally {
        setLoading(false);
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
            <Button onClick={handleSignup} disabled={loading} className="w-full bg-[#703FA1] hover:bg-[#5a2f81]">
              {loading ? "Registering..." : "Sign Up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}