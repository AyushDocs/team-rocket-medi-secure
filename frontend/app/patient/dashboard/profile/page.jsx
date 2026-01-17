"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { HeartPulse, Plus, Save, Share2, User } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientProfile() {
    const { patientContract, account } = useWeb3()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    
    // Profile State
    const [profile, setProfile] = useState({
        username: "",
        name: "",
        email: "",
        age: "",
        bloodGroup: ""
    })

    // Nominees State
    const [nominees, setNominees] = useState([])
    const [newNominee, setNewNominee] = useState({
        name: "",
        walletAddress: "",
        relationship: "",
        contactNumber: ""
    })
    const [addingNominee, setAddingNominee] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!patientContract || !account) return;
            try {
                setLoading(true)
                const patientId = await patientContract.walletToPatientId(account)
                
                if (patientId.toString() === "0") {
                   toast.error("Profile not found. Please register.");
                   setLoading(false);
                   return;
                }

                // Fetch Details
                const details = await patientContract.getPatientDetails(patientId);
                setProfile({
                    username: details.username,
                    name: details.name,
                    email: details.email,
                    age: details.age.toString(),
                    bloodGroup: details.bloodGroup
                });

                // Fetch Nominees
                const fetchedNominees = await patientContract.getNominees(patientId);
                setNominees(fetchedNominees);

            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [patientContract, account]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!process.env.NEXT_PUBLIC_ALLOW_EDIT) {
             // Just a safety check if we wanted to lock it, but for now we allow
        }
        
        try {
            setUpdating(true);
            const tx = await patientContract.updatePatientDetails(
                profile.name,
                profile.email,
                Number(profile.age),
                profile.bloodGroup
            );
            await tx.wait();
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update profile.");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNominee = async (e) => {
        e.preventDefault();
        try {
            setAddingNominee(true);
            const tx = await patientContract.addNominee(
                newNominee.name,
                newNominee.walletAddress,
                newNominee.relationship,
                newNominee.contactNumber
            );
            await tx.wait();
            toast.success("Nominee added successfully!");
            
            // Refresh Nominees
            const patientId = await patientContract.walletToPatientId(account);
            const fetchedNominees = await patientContract.getNominees(patientId);
            setNominees(fetchedNominees);
            
            // Reset Form
            setNewNominee({ name: "", walletAddress: "", relationship: "", contactNumber: "" });

        } catch (error) {
            console.error("Add Nominee error:", error);
            toast.error("Failed to add nominee.");
        } finally {
            setAddingNominee(false);
        }
    };

    if (loading) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                <p className="text-muted-foreground">Manage your personal information and emergency contacts.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600"/> 
                            Personal Details
                        </CardTitle>
                        <CardDescription>Update your medical identity information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Username (Immutable)</Label>
                                <Input value={profile.username} disabled className="bg-gray-50" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input 
                                        value={profile.name} 
                                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input 
                                        type="number" 
                                        value={profile.age}
                                        onChange={(e) => setProfile({...profile, age: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                    type="email" 
                                    value={profile.email}
                                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Blood Group</Label>
                                <Input 
                                    value={profile.bloodGroup}
                                    onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})}
                                    placeholder="e.g. O+"
                                    required 
                                />
                            </div>

                            <Button type="submit" disabled={updating} className="w-full bg-[#703FA1] hover:bg-[#5a2f81]">
                                {updating ? <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> Saving...</span> : <span className="flex items-center gap-2"><Save className="h-4 w-4"/> Update Profile</span>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Nominee Section */}
                <div className="space-y-6">
                    {/* Add Nominee */}
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-red-500"/> 
                                Add Emergency Nominee
                            </CardTitle>
                            <CardDescription>Nominate someone to receive emergency access.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddNominee} className="space-y-3">
                                <Input 
                                    placeholder="Nominee Name" 
                                    value={newNominee.name}
                                    onChange={(e) => setNewNominee({...newNominee, name: e.target.value})}
                                    required
                                />
                                <Input 
                                    placeholder="Wallet Address (0x...)" 
                                    value={newNominee.walletAddress}
                                    onChange={(e) => setNewNominee({...newNominee, walletAddress: e.target.value})}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input 
                                        placeholder="Relationship" 
                                        value={newNominee.relationship}
                                        onChange={(e) => setNewNominee({...newNominee, relationship: e.target.value})}
                                        required
                                    />
                                    <Input 
                                        placeholder="Contact No." 
                                        value={newNominee.contactNumber}
                                        onChange={(e) => setNewNominee({...newNominee, contactNumber: e.target.value})}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="outline" disabled={addingNominee} className="w-full">
                                     {addingNominee ? "Adding..." : <span className="flex items-center gap-2"><Plus className="h-4 w-4"/> Add Nominee</span>}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Nominee List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Nominees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {nominees.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No nominees added yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {nominees.map((nominee, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-sm">{nominee.name}</p>
                                                <p className="text-xs text-gray-500">{nominee.relationship} • {nominee.contactNumber}</p>
                                                <p className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">{nominee.walletAddress}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-gray-400">
                                                <Share2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
