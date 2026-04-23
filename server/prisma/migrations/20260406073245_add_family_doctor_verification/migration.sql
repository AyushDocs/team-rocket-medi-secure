-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "memberWallet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'view',
    "canViewRecords" BOOLEAN NOT NULL DEFAULT true,
    "canAddVitals" BOOLEAN NOT NULL DEFAULT false,
    "canBookAppointments" BOOLEAN NOT NULL DEFAULT false,
    "canViewBilling" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamilyMember_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientData" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "hospital" TEXT,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "documents" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorVerification_userId_key" ON "DoctorVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorVerification_licenseNumber_key" ON "DoctorVerification"("licenseNumber");
