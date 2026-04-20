"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GRAPH_API = process.env.NEXT_PUBLIC_GRAPH_API || "http://localhost:8000/subgraphs/name/sanjeevni";

const QUERIES = {
  patients: `query { patients(first: 10, orderBy: createdAt, orderDirection: desc) { id patientId wallet name username bloodGroup recordCount createdAt } }`,
  doctors: `query { doctors(first: 10, orderBy: createdAt, orderDirection: desc) { id doctorId wallet name specialization patientCount } }`,
  policies: `query { policies(first: 10, orderBy: createdAt, orderDirection: desc) { id policyId name provider { name } basePremium isActive } }`,
  claims: `query { claims(first: 10, orderBy: timestamp, orderDirection: desc) { id claimId patient provider { name } procedureName cost status timestamp } }`,
  transactions: `query { transactions(first: 10, orderBy: timestamp, orderDirection: desc) { id hash from to value blockNumber timestamp status } }`,
  multiSig: `query { transactions(first: 10, orderBy: timestamp, orderDirection: desc, where: { to: "0x..." }) { id hash from value blockNumber } }`,
};

async function fetchGraph(query) {
  try {
    const res = await fetch(GRAPH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.error("Graph fetch error:", e);
    return null;
  }
}

function formatAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatEth(value) {
  if (!value) return "0";
  return (value / 1e18).toFixed(4);
}

export default function ExplorerPage() {
  const [tab, setTab] = useState("patients");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ patients: 0, doctors: 0, policies: 0, claims: 0 });

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      const query = QUERIES[tab] || QUERIES.patients;
      const result = await fetchGraph(query);
      if (result) {
        const key = tab + (tab === "policies" ? "" : "s");
        setData(result[key] || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const tabs = [
    { id: "patients", label: "Patients" },
    { id: "doctors", label: "Doctors" },
    { id: "policies", label: "Policies" },
    { id: "claims", label: "Claims" },
    { id: "transactions", label: "Transactions" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h1>
          <p className="text-gray-600">Sanjeevni on-chain data & activity</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#703FA1]">{stats.patients}</div>
              <div className="text-sm text-gray-500">Patients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.doctors}</div>
              <div className="text-sm text-gray-500">Doctors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.policies}</div>
              <div className="text-sm text-gray-500">Policies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.claims}</div>
              <div className="text-sm text-gray-500">Claims</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => setTab(t.id)}
              className={tab === t.id ? "bg-[#703FA1]" : ""}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tabs.find((t) => t.id === tab)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No data found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {tab === "patients" && (
                        <>
                          <th className="text-left py-2">ID</th>
                          <th className="text-left py-2">Wallet</th>
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Records</th>
                          <th className="text-left py-2">Created</th>
                        </>
                      )}
                      {tab === "doctors" && (
                        <>
                          <th className="text-left py-2">ID</th>
                          <th className="text-left py-2">Wallet</th>
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Specialization</th>
                          <th className="text-left py-2">Patients</th>
                        </>
                      )}
                      {tab === "policies" && (
                        <>
                          <th className="text-left py-2">ID</th>
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Provider</th>
                          <th className="text-left py-2">Premium</th>
                          <th className="text-left py-2">Status</th>
                        </>
                      )}
                      {tab === "claims" && (
                        <>
                          <th className="text-left py-2">ID</th>
                          <th className="text-left py-2">Patient</th>
                          <th className="text-left py-2">Procedure</th>
                          <th className="text-left py-2">Cost</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Date</th>
                        </>
                      )}
                      {tab === "transactions" && (
                        <>
                          <th className="text-left py-2">Hash</th>
                          <th className="text-left py-2">From</th>
                          <th className="text-left py-2">To</th>
                          <th className="text-left py-2">Value</th>
                          <th className="text-left py-2">Block</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        {tab === "patients" && (
                          <>
                            <td className="py-2">{item.patientId}</td>
                            <td className="py-2 font-mono text-sm">{formatAddress(item.wallet)}</td>
                            <td className="py-2">{item.name}</td>
                            <td className="py-2">{item.recordCount}</td>
                            <td className="py-2 text-sm">{formatTime(item.createdAt)}</td>
                          </>
                        )}
                        {tab === "doctors" && (
                          <>
                            <td className="py-2">{item.doctorId}</td>
                            <td className="py-2 font-mono text-sm">{formatAddress(item.wallet)}</td>
                            <td className="py-2">{item.name}</td>
                            <td className="py-2">{item.specialization}</td>
                            <td className="py-2">{item.patientCount}</td>
                          </>
                        )}
                        {tab === "policies" && (
                          <>
                            <td className="py-2">{item.policyId}</td>
                            <td className="py-2">{item.name}</td>
                            <td className="py-2">{item.provider?.name}</td>
                            <td className="py-2">{formatEth(item.basePremium)} ETH</td>
                            <td className="py-2">
                              <Badge variant={item.isActive ? "default" : "outline"}>
                                {item.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </>
                        )}
                        {tab === "claims" && (
                          <>
                            <td className="py-2">{item.claimId}</td>
                            <td className="py-2 font-mono text-sm">{formatAddress(item.patient)}</td>
                            <td className="py-2">{item.procedureName}</td>
                            <td className="py-2">{formatEth(item.cost)} ETH</td>
                            <td className="py-2">
                              <Badge
                                variant={
                                  item.status === "APPROVED"
                                    ? "default"
                                    : item.status === "REJECTED"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {item.status}
                              </Badge>
                            </td>
                            <td className="py-2 text-sm">{formatTime(item.timestamp)}</td>
                          </>
                        )}
                        {tab === "transactions" && (
                          <>
                            <td className="py-2 font-mono text-sm text-blue-600">{formatAddress(item.hash)}</td>
                            <td className="py-2 font-mono text-sm">{formatAddress(item.from)}</td>
                            <td className="py-2 font-mono text-sm">{formatAddress(item.to)}</td>
                            <td className="py-2">{formatEth(item.value)} ETH</td>
                            <td className="py-2">{item.blockNumber}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by The Graph | GraphQL API: {GRAPH_API}</p>
        </div>
      </div>
    </div>
  );
}