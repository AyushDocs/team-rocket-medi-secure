"use client"

import { Button } from "@/components/ui/button"
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function PolicyManagementModal({ editingPolicy, policyForm, setPolicyForm, handleCreateUpdatePolicy }) {
    return (
        <DialogContent className="bg-white border-slate-100 text-slate-900 sm:max-w-[550px] rounded-[2.5rem] p-10 overflow-hidden shadow-3xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900">{editingPolicy ? 'Update Strategy' : 'Mint New Policy'}</DialogTitle>
                <p className="text-slate-500 text-sm font-medium">Configure risk parameters and premium logic for the blockchain.</p>
            </DialogHeader>
            <div className="space-y-6 py-6">
                <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Policy Name</Label>
                    <Input 
                        value={policyForm.name} 
                        onChange={(e) => setPolicyForm({...policyForm, name: e.target.value})}
                        placeholder="e.g. Platinum Health Guard" 
                        className="bg-slate-50 border-slate-100 rounded-2xl h-14 text-slate-900 focus:ring-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</Label>
                    <Textarea 
                        value={policyForm.description} 
                        onChange={(e) => setPolicyForm({...policyForm, description: e.target.value})}
                        placeholder="Specify coverage scope..." 
                        className="bg-slate-50 border-slate-100 rounded-2xl min-h-[100px] text-slate-900 focus:ring-blue-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Premium (ETH)</Label>
                        <Input 
                            type="number"
                            value={policyForm.premium} 
                            onChange={(e) => setPolicyForm({...policyForm, premium: e.target.value})}
                            placeholder="0.05" 
                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Min Age</Label>
                        <Input 
                            type="number"
                            value={policyForm.minAge} 
                            onChange={(e) => setPolicyForm({...policyForm, minAge: e.target.value})}
                            className="bg-slate-50 border-slate-100 rounded-2xl h-14 text-slate-900"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-red-500 uppercase tracking-widest">Max Systolic</Label>
                        <Input 
                            type="number"
                            value={policyForm.maxSystolic} 
                            onChange={(e) => setPolicyForm({...policyForm, maxSystolic: e.target.value})}
                            className="bg-white border-slate-100 rounded-2xl h-14 text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-red-500 uppercase tracking-widest">Max Diastolic</Label>
                        <Input 
                            type="number"
                            value={policyForm.maxDiastolic} 
                            onChange={(e) => setPolicyForm({...policyForm, maxDiastolic: e.target.value})}
                            className="bg-white border-slate-100 rounded-2xl h-14 text-slate-900"
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleCreateUpdatePolicy} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-16 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95">
                    {editingPolicy ? 'EXECUTE UPDATE' : 'DEPLOY POLICY'}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}
