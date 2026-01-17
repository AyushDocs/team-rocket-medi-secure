"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function AccessRequestsPatient() {
  const { doctorContract, account } = useWeb3()
  const [accessRequests, setAccessRequests] = useState([])

  useEffect(() => {
    if(!doctorContract || !account) {
        console.warn("Contracts or Account missing. Skipping request fetch.", { doctorContract: !!doctorContract, account });
        return;
    }

    // Fetch past access requests
    const fetchRequests = async () => {
      try {
        // Create filter: AccessRequested(patient=account, doctor=null, ipfsHash=null)
        const filter = doctorContract.filters.AccessRequested(account);
        const events = await doctorContract.queryFilter(filter);
        
        const pastRequests = events.map(event => ({
          doctor: event.args[1], // 2nd argument is doctor address
          ipfsHash: event.args[2], // 3rd argument is ipfsHash
          fileName: event.args[3] || "Unnamed Document" // 4th argument is fileName
        }));
        
        setAccessRequests(pastRequests);
      } catch (error) {
        console.error("Error fetching access requests:", error);
      }
    };

    fetchRequests();

    // Listen for new requests
    const handleAccessRequested = (patient, doctor, ipfsHash, fileName) => {
         // Arguments are: patient, doctor, ipfsHash, fileName (based on Doctor.sol event)
         if (patient.toLowerCase() === account.toLowerCase()) {
              setAccessRequests((prevRequests) => [
                ...prevRequests,
                { doctor, ipfsHash, fileName },
              ]);
         }
    };

    doctorContract.on("AccessRequested", handleAccessRequested);

    return () => {
        doctorContract.off("AccessRequested", handleAccessRequested);
    };
  }, [account, doctorContract]);

  const handleAccessResponse = async (doctor, ipfsHash, grant) => {
    if(!doctorContract) {
        console.warn("Doctor contract missing during response.");
        return;
    }
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
          <p className="text-gray-500">No pending access requests.</p>
        ) : (
          <ul className="space-y-4">
            {accessRequests.map((request, index) => (
              <li key={index} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-semibold text-gray-900">{request.fileName}</h3>
                    <p className="text-sm text-gray-600">Requested by: <span className="font-mono bg-gray-100 px-1 rounded">{request.doctor}</span></p>
                    <p className="text-xs text-gray-400 mt-1">ID: {request.ipfsHash}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Grant Access
                  </Button>
                  <Button
                    onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, false)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    Reject
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
