import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const familyService = {
    async addMember(patientId, data) {
        return prisma.familyMember.create({
            data: {
                patientId,
                memberWallet: data.memberWallet.toLowerCase(),
                name: data.name,
                relationship: data.relationship,
                accessLevel: data.accessLevel || "view",
                canViewRecords: data.canViewRecords ?? true,
                canAddVitals: data.canAddVitals ?? false,
                canBookAppointments: data.canBookAppointments ?? false,
                canViewBilling: data.canViewBilling ?? false,
                canManage: data.canManage ?? false,
                isEmergency: data.isEmergency ?? false
            }
        });
    },

    async removeMember(id) {
        return prisma.familyMember.delete({ where: { id } });
    },

    async updateMember(id, data) {
        return prisma.familyMember.update({
            where: { id },
            data
        });
    },

    async getMembers(patientId) {
        return prisma.familyMember.findMany({
            where: { patientId }
        });
    },

    async getMemberByWallet(patientId, walletAddress) {
        return prisma.familyMember.findFirst({
            where: { 
                patientId,
                memberWallet: walletAddress.toLowerCase()
            }
        });
    },

    async isAuthorized(walletAddress, patientId, requiredAccess) {
        const member = await this.getMemberByWallet(patientId, walletAddress);
        
        if (!member) return false;

        switch (requiredAccess) {
            case "view":
                return member.canViewRecords;
            case "vitals":
                return member.canAddVitals;
            case "appointments":
                return member.canBookAppointments;
            case "billing":
                return member.canViewBilling;
            case "manage":
                return member.canManage;
            default:
                return false;
        }
    },

    async getEmergencyContacts(patientId) {
        return prisma.familyMember.findMany({
            where: { 
                patientId,
                isEmergency: true
            }
        });
    },

    async getAccessibleData(walletAddress, dataType) {
        const members = await prisma.familyMember.findMany({
            where: { memberWallet: walletAddress.toLowerCase() }
        });

        const accessible = [];
        for (const member of members) {
            switch (dataType) {
                case "records":
                    if (member.canViewRecords) accessible.push(member.patientId);
                    break;
                case "vitals":
                    if (member.canAddVitals) accessible.push(member.patientId);
                    break;
                case "appointments":
                    if (member.canBookAppointments) accessible.push(member.patientId);
                    break;
                case "billing":
                    if (member.canViewBilling) accessible.push(member.patientId);
                    break;
            }
        }

        return accessible;
    }
};

export default familyService;
