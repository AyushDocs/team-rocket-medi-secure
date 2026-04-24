"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";

export default function SignupPatient() {
  const { patientContract, account, custodianUser } = useWeb3();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (custodianUser) {
        if (custodianUser.displayName && !name) setName(custodianUser.displayName);
        if (custodianUser.email && !email) setEmail(custodianUser.email);
    }
  }, [custodianUser]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (patientContract && account) {
        try {
          const registered = await patientContract.isRegistered(account);
          if (registered) {
            router.push("/patient/dashboard");
          }
        } catch (e) {
          console.error("Error checking registration status:", e);
        }
      }
    };
    checkRegistration();
  }, [patientContract, account, router]);

  const handleSignup = async () => {
    if (!patientContract) {
      setErrorMessage("Contract not connected. Please check your network.");
      return;
    }
    if (!username || !name || !email || !age || !bloodGroup) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // 1. Check if already registered (Pre-flight)
      const alreadyRegistered = await patientContract.isRegistered(account);
      if (alreadyRegistered) {
        setErrorMessage("This wallet is already registered. Redirecting...");
        setTimeout(() => router.push("/patient/dashboard"), 2000);
        return;
      }

      // 2. Check if username taken (Pre-flight)
      // Note: mapping usernameToPatientId is public, so it generates a getter
      const existingId = await patientContract.usernameToPatientId(username);
      if (existingId && existingId.toString() !== "0") {
        setErrorMessage("Username is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      // 3. Register Patient
      console.log("Registering patient:", { username, name, email, age, bloodGroup });
      const tx = await patientContract.registerPatient(username, name, email, parseInt(age), bloodGroup);
      await tx.wait();

      setSuccessMessage("Patient registered successfully!");
      setTimeout(() => {
          router.push("/patient/dashboard");
      }, 1500);

    } catch (error) {
      console.error("Signup error:", error);
      
      // Try to extract a more useful error message
      let msg = "An error occurred during registration.";
      if (error.reason) msg = error.reason;
      else if (error.message && error.message.includes("Already registered")) msg = "Wallet already registered.";
      else if (error.message && error.message.includes("Username taken")) msg = "Username already taken.";
      else if (error.message && error.message.includes("NotAuthorizedManager")) msg = "Contract authorization error. Please contact admin.";
      else if (error.code === "CALL_EXCEPTION") msg = "Transaction reverted. This usually means you are already registered or the username is taken.";
      
      setErrorMessage(msg);
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
