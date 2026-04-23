"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const patientFunctions = [
  { name: "getPatientDashboard(address)", returns: "dashboard data + status", desc: "Main dashboard - shows if registered" },
  { name: "getPatientSummary(uint256)", returns: "summary fields", desc: "Patient info without full struct" },
  { name: "getMedicalRecordsPaginated(id, offset, limit)", returns: "MedicalRecord[]", desc: "Paginated records for lists" },
  { name: "getRecentRecords(id, count)", returns: "MedicalRecord[]", desc: "Latest N records" },
  { name: "getNominees(uint256)", returns: "Nominee[]", desc: "Emergency contacts" },
  { name: "getEmergencyLogs(uint256)", returns: "AccessLog[]", desc: "Audit trail" },
  { name: "getEmergencyAccessDetails(uint256)", returns: "full details", desc: "Emergency hash + logs" },
  { name: "getRecordByIndex(id, index)", returns: "MedicalRecord", desc: "Single record" },
];

const doctorFunctions = [
  { name: "getDoctorDashboard(address)", returns: "dashboard data + status", desc: "Main dashboard" },
  { name: "getDoctorSummary(address)", returns: "summary fields", desc: "Doctor info" },
  { name: "getAccessRequestsPaginated(id, offset, limit)", returns: "DocumentAccess[]", desc: "Paginated requests" },
  { name: "getPendingAccessRequests(uint256)", returns: "DocumentAccess[]", desc: "Awaiting approval" },
  { name: "getActiveAccess(uint256)", returns: "DocumentAccess[]", desc: "Currently valid" },
  { name: "getAccessStatus(id, patient)", returns: "ACTIVE/EXPIRED/NONE", desc: "Check specific access" },
  { name: "getDoctorsPaginated(offset, limit)", returns: "DoctorDetails[]", desc: "Paginated list" },
];

const insuranceFunctions = [
  { name: "getClaimStatusString(uint256)", returns: "PENDING/APPROVED/REJECTED", desc: "Raw status" },
  { name: "getClaimDetails(uint256)", returns: "full + statusLabel", desc: "With human-readable label" },
  { name: "getRequestStatusString(uint256)", returns: "PENDING/CALCULATED/VERIFIED/ACTIVE", desc: "Request state" },
  { name: "getPolicyStatusString(uint256)", returns: "ACTIVE/INACTIVE", desc: "Policy status" },
  { name: "getAllActivePoliciesOptimized()", returns: "Policy[]", desc: "Gas-optimized iteration" },
];

const statusLabels = [
  { contract: "PENDING", display: "Pending Review" },
  { contract: "APPROVED", display: "Approved" },
  { contract: "REJECTED", display: "Rejected" },
  { contract: "NONE", display: "No Access" },
  { contract: "ACTIVE", display: "Active" },
  { contract: "EXPIRED", display: "Expired" },
];

function FunctionCard({ name, returns, desc }) {
  return (
    <div className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <code className="text-sm text-[#703FA1] font-mono">{name}</code>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
      <Badge variant="outline" className="mt-2 text-[10px]">{returns}</Badge>
    </div>
  );
}

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Contract API</h1>
          <p className="text-gray-600 mt-2">Frontend helper functions for Sanjeevni</p>
        </div>

        <Tabs defaultValue="patient" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="patient">Patient.sol</TabsTrigger>
            <TabsTrigger value="doctor">Doctor.sol</TabsTrigger>
            <TabsTrigger value="insurance">Insurance.sol</TabsTrigger>
            <TabsTrigger value="status">Status Labels</TabsTrigger>
          </TabsList>

          <TabsContent value="patient">
            <Card>
              <CardHeader>
                <CardTitle>Patient Contract</CardTitle>
                <CardDescription>Functions for patient dashboard and records</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patientFunctions.map((fn, i) => (
                  <FunctionCard key={i} {...fn} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctor">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Contract</CardTitle>
                <CardDescription>Functions for doctor dashboard and access management</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doctorFunctions.map((fn, i) => (
                  <FunctionCard key={i} {...fn} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Contract (UUPS)</CardTitle>
                <CardDescription>Functions for policies, claims, and status</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insuranceFunctions.map((fn, i) => (
                  <FunctionCard key={i} {...fn} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Status Labels</CardTitle>
                <CardDescription>Human-readable status mappings</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium">Contract Value</th>
                      <th className="text-left py-2 text-sm font-medium">Display Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLabels.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2"><code className="text-sm text-[#703FA1]">{item.contract}</code></td>
                        <td className="py-2 text-gray-600">{item.display}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Usage Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Get patient dashboard
const dashboard = await patientContract.getPatientDashboard(walletAddress);
const [patientId, name, recordCount, nomineeCount, isRegistered, status] = dashboard;
// status: "ACTIVE" or "NOT_REGISTERED"

// Get claim with label
const details = await insuranceContract.getClaimDetails(claimId);
const { statusLabel } = details; // "Pending Review", "Approved", "Rejected"`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}