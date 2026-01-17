"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function AccessRequestsPatient() {
  const { doctorContract, account } = useWeb3()
  const [accessRequests, setAccessRequests] = useState([])

  useEffect(() => {
    if(!doctorContract || !account) return;

    // Fetch past access requests
    const fetchRequests = async () => {
      try {
        // Create filter: AccessRequested(patient=account, doctor=null, ipfsHash=null)
        const filter = doctorContract.filters.AccessRequested(account);
        const events = await doctorContract.queryFilter(filter);
        
        const pastRequests = events.map(event => ({
          doctor: event.args[1], // 2nd argument is doctor address
          ipfsHash: event.args[2] // 3rd argument is ipfsHash
        }));
        
        setAccessRequests(pastRequests);
      } catch (error) {
        console.error("Error fetching access requests:", error);
      }
    };

    fetchRequests();

    // Listen for new requests
    const handleAccessRequested = (patient, doctor, ipfsHash) => {
         // Arguments are: patient, doctor, ipfsHash (based on Doctor.sol event)
         if (patient.toLowerCase() === account.toLowerCase()) {
              setAccessRequests((prevRequests) => [
                ...prevRequests,
                { doctor, ipfsHash },
              ]);
         }
    };

    doctorContract.on("AccessRequested", handleAccessRequested);

    return () => {
        doctorContract.off("AccessRequested", handleAccessRequested);
    };
  }, [account, doctorContract]);

  const handleAccessResponse = async (doctor, ipfsHash, grant) => {
    if(!doctorContract) return;
    try {
      if (grant) {
        const tx = await doctorContract.grantAccess(doctor, ipfsHash);
        await tx.wait();
      }
      setAccessRequests((prevRequests) =>
        prevRequests.filter(
          (request) => request.doctor !== doctor || request.ipfsHash !== ipfsHash
        )
      );
    } catch (error) {
      console.error("Failed to respond to access request:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {accessRequests.length === 0 ? (
          <p>No access requests.</p>
        ) : (
          <ul>
            {accessRequests.map((request, index) => (
              <li key={index} className="mb-4">
                <p>Doctor: {request.doctor}</p>
                <p>Document ID: {request.ipfsHash}</p>
                <div className="flex space-x-4 mt-2">
                  <Button
                    onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, true)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Grant Access
                  </Button>
                  <Button
                    onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, false)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Reject Access
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
