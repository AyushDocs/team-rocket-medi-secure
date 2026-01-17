"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function AccessRequestsPatient() {
  const { doctorContract, account } = useWeb3()
  const [accessRequests, setAccessRequests] = useState([])
  const [modifiedDurations, setModifiedDurations] = useState({}) // Key: "doc-hash", Value: seconds

  useEffect(() => {
    if(!doctorContract || !account) {
        console.warn("Contracts or Account missing. Skipping request fetch.", { doctorContract: !!doctorContract, account });
        return;
    }

    // Fetch past access requests
    const fetchRequests = async () => {
      try {
        const filter = doctorContract.filters.AccessRequested(account);
        const events = await doctorContract.queryFilter(filter);
        
        const pastRequests = events.map(event => ({
          doctor: event.args[1], 
          ipfsHash: event.args[2], 
          fileName: event.args[3] || "Unnamed Document",
          duration: event.args[4] ? event.args[4].toString() : "300" // Arg 4 is duration
        }));
        
        setAccessRequests(pastRequests);
      } catch (error) {
        console.error("Error fetching access requests:", error);
      }
    };

    fetchRequests();

    // Listen for new requests
    const handleAccessRequested = (patient, doctor, ipfsHash, fileName, duration) => {
         if (patient.toLowerCase() === account.toLowerCase()) {
              setAccessRequests((prevRequests) => [
                ...prevRequests,
                { doctor, ipfsHash, fileName, duration: duration.toString() },
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
        const key = `${doctor}-${ipfsHash}`;
        // Use modified duration if exists, else generic default logic? 
        // We iterate requests to find default?
        const req = accessRequests.find(r => r.doctor === doctor && r.ipfsHash === ipfsHash);
        const finalDuration = modifiedDurations[key] || req.duration || "300";
        
        const tx = await doctorContract.grantAccess(doctor, ipfsHash, finalDuration);
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
  
  const formatDuration = (sec) => {
      const s = parseInt(sec);
      if(s < 3600) return `${Math.floor(s/60)} Mins`;
      if(s < 86400) return `${(s/3600).toFixed(1)} Hours`;
      return `${(s/86400).toFixed(1)} Days`;
  }

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
            {accessRequests.map((request, index) => {
               const key = `${request.doctor}-${request.ipfsHash}`;
               const currentDuration = modifiedDurations[key] || request.duration;
               
               return (
              <li key={index} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{request.fileName}</h3>
                    <p className="text-sm text-gray-600">Requested by: <span className="font-mono bg-gray-100 px-1 rounded">{request.doctor.slice(0,8)}...</span></p>
                    <div className="mt-2 flex items-center gap-2">
                         <span className="text-xs font-medium text-gray-500">Access Duration:</span>
                         <select 
                            className="text-sm border rounded bg-gray-50 p-1"
                            value={currentDuration}
                            onChange={(e) => setModifiedDurations({...modifiedDurations, [key]: e.target.value})}
                         >
                            <option value="300">5 Mins</option>
                            <option value="900">15 Mins</option>
                            <option value="3600">1 Hour</option>
                            <option value="86400">24 Hours</option>
                            <option value="604800">7 Days</option>
                         </select>
                         <span className="text-xs text-blue-600">({formatDuration(currentDuration)})</span>
                    </div>
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
            )})}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
