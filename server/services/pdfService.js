import { userService, vitalService, appointmentService, prescriptionService } from "./database.js";
import { generatePatientSummary } from "./exportService.js";

const generateHeader = (doc, title) => {
    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();
};

const generatePatientInfo = (doc, patient) => {
    doc.fontSize(14).text("Patient Information", { underline: true });
    doc.fontSize(10);
    
    const info = [
        `Name: ${patient.profile?.name || "N/A"}`,
        `Email: ${patient.profile?.email || "N/A"}`,
        `Phone: ${patient.profile?.phone || "N/A"}`,
        `Wallet: ${patient.walletAddress}`,
        `Blood Group: ${patient.patientData?.bloodGroup || "N/A"}`,
        `Allergies: ${patient.patientData?.allergies || "None"}`,
        `Chronic Conditions: ${patient.patientData?.chronicConditions || "None"}`
    ];
    
    info.forEach(line => doc.text(line));
    doc.moveDown();
};

const generateVitalsTable = (doc, vitals) => {
    doc.fontSize(14).text("Vital Signs", { underline: true });
    doc.moveDown();
    
    if (vitals.length === 0) {
        doc.fontSize(10).text("No vital records found.");
        doc.moveDown();
        return;
    }

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Date", col1, tableTop);
    doc.text("BP", col2, tableTop);
    doc.text("HR", col3, tableTop);
    doc.text("Temp", col4, tableTop);
    doc.text("Source", col5, tableTop);
    
    doc.moveTo(col1, tableTop + 15).lineTo(col5 + 50, tableTop + 15).stroke();
    
    doc.font("Helvetica").fontSize(8);
    let position = tableTop + 20;
    
    vitals.slice(0, 20).forEach(v => {
        const bp = v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : "N/A";
        const date = v.recordedAt ? new Date(v.recordedAt).toLocaleDateString() : "N/A";
        
        doc.text(date, col1, position);
        doc.text(bp, col2, position);
        doc.text(v.heartRate?.toString() || "N/A", col3, position);
        doc.text(v.temperature?.toString() || "N/A", col4, position);
        doc.text(v.source || "manual", col5, position);
        
        position += 15;
        
        if (position > 700) {
            doc.addPage();
            position = 50;
        }
    });
    
    doc.moveDown();
};

const generateAppointments = (doc, appointments) => {
    doc.fontSize(14).text("Appointments", { underline: true });
    doc.moveDown();
    
    if (appointments.length === 0) {
        doc.fontSize(10).text("No appointments found.");
        doc.moveDown();
        return;
    }

    appointments.slice(0, 10).forEach(a => {
        doc.fontSize(10);
        doc.text(`${new Date(a.dateTime).toLocaleString()} - ${a.status}`);
        doc.fontSize(9).text(`Type: ${a.type || "N/A"}`, { indent: 20 });
        if (a.notes) doc.text(`Notes: ${a.notes}`, { indent: 20 });
        doc.moveDown();
    });
    
    doc.moveDown();
};

const generatePrescriptions = (doc, prescriptions) => {
    doc.fontSize(14).text("Prescriptions", { underline: true });
    doc.moveDown();
    
    if (prescriptions.length === 0) {
        doc.fontSize(10).text("No prescriptions found.");
        doc.moveDown();
        return;
    }

    prescriptions.slice(0, 10).forEach(p => {
        doc.fontSize(10);
        doc.text(`Date: ${new Date(p.date).toLocaleDateString()}`);
        if (p.diagnosis) doc.text(`Diagnosis: ${p.diagnosis}`, { indent: 20 });
        
        try {
            const meds = JSON.parse(p.medications || "[]");
            if (meds.length > 0) {
                doc.text("Medications:", { indent: 20 });
                meds.forEach(m => {
                    doc.text(`- ${m.name}: ${m.dosage}`, { indent: 40 });
                });
            }
        } catch (e) {
            doc.text(`Medications: ${p.medications}`, { indent: 20 });
        }
        
        doc.moveDown();
    });
    
    doc.moveDown();
};

const generateFooter = (doc) => {
    doc.fontSize(8).text(
        `Generated on ${new Date().toLocaleString()} by Sanjeevni Medical Records System`,
        50,
        doc.page.height - 50,
        { align: "center" }
    );
};

export const generateMedicalReportPDF = async (patientId) => {
    const user = await userService.findById(patientId);
    if (!user) return null;

    const vitals = await vitalService.findByPatient(user.patientData?.id, 50);
    const appointments = await appointmentService.findByPatient(user.patientData?.id);
    const prescriptions = await prescriptionService.findByPatient(user.patientData?.id);

    const PDFDocument = (await import("pdfkit")).default;
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: "A4" });
            const chunks = [];
            
            doc.on("data", chunk => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            generateHeader(doc, "Medical Record Report");
            
            doc.text(`Patient ID: ${patientId}`);
            doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown(2);

            generatePatientInfo(doc, user);
            
            doc.addPage();
            generateVitalsTable(doc, vitals);
            
            doc.addPage();
            generateAppointments(doc, appointments);
            
            doc.addPage();
            generatePrescriptions(doc, prescriptions);
            
            generateFooter(doc);
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

export const generatePrescriptionPDF = async (prescriptionId) => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
            patient: { include: { user: { include: { profile: true } } } },
            doctor: { include: { user: { include: { profile: true } } } }
        }
    });

    if (!prescription) return null;

    const PDFDocument = (await import("pdfkit")).default;
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks = [];
        
        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.fontSize(20).text("Medical Prescription", { align: "center" });
        doc.moveDown(2);

        doc.fontSize(12);
        doc.text(`Date: ${new Date(prescription.date).toLocaleDateString()}`);
        doc.moveDown();

        doc.fontSize(14).text("Patient Details:", { underline: true });
        doc.fontSize(10);
        doc.text(`Name: ${prescription.patient?.user?.profile?.name}`);
        doc.moveDown();

        doc.fontSize(14).text("Doctor Details:", { underline: true });
        doc.fontSize(10);
        doc.text(`Name: ${prescription.doctor?.user?.profile?.name}`);
        doc.text(`Specialty: ${prescription.doctor?.specialty}`);
        doc.moveDown();

        if (prescription.diagnosis) {
            doc.fontSize(14).text("Diagnosis:", { underline: true });
            doc.fontSize(10);
            doc.text(prescription.diagnosis);
            doc.moveDown();
        }

        doc.fontSize(14).text("Medications:", { underline: true });
        doc.fontSize(10);
        
        try {
            const meds = JSON.parse(prescription.medications || "[]");
            meds.forEach((m, i) => {
                doc.text(`${i + 1}. ${m.name} - ${m.dosage}`, { indent: 20 });
                if (m.instructions) doc.text(`   Instructions: ${m.instructions}`, { indent: 40 });
            });
        } catch (e) {
            doc.text(prescription.medications);
        }
        
        doc.moveDown(2);

        if (prescription.notes) {
            doc.fontSize(14).text("Notes:", { underline: true });
            doc.fontSize(10);
            doc.text(prescription.notes);
        }

        doc.fontSize(8).text(
            `Prescription ID: ${prescription.id}`,
            50, doc.page.height - 50
        );

        doc.end();
    });
};

export const generateInvoicePDF = async (invoiceId) => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            patient: { include: { user: { include: { profile: true } } } }
        }
    });

    if (!invoice) return null;

    const PDFDocument = (await import("pdfkit")).default;
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks = [];
        
        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.fontSize(20).text("INVOICE", { align: "center" });
        doc.moveDown(2);

        doc.fontSize(12);
        doc.text(`Invoice #: ${invoice.id.slice(0, 8).toUpperCase()}`);
        doc.text(`Date: ${new Date().toISOString().split('T')[0]}`);
        if (invoice.dueDate) doc.text(`Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`);
        doc.moveDown();

        doc.fontSize(14).text("Bill To:", { underline: true });
        doc.fontSize(10);
        doc.text(invoice.patient?.user?.profile?.name || "N/A");
        doc.text(invoice.patient?.user?.profile?.email || "N/A");
        doc.moveDown(2);

        doc.fontSize(14).text("Amount Due:", { underline: true });
        doc.fontSize(16).text(`${invoice.currency} ${invoice.amount.toFixed(2)}`, { indent: 20 });
        doc.moveDown();

        doc.fontSize(10).text(`Status: ${invoice.status.toUpperCase()}`);
        
        if (invoice.description) {
            doc.moveDown();
            doc.fontSize(12).text("Description:");
            doc.fontSize(10).text(invoice.description);
        }

        doc.fontSize(8).text(
            "Sanjeevni Medical Records System",
            50, doc.page.height - 50, { align: "center" }
        );

        doc.end();
    });
};

export default {
    generateMedicalReportPDF,
    generatePrescriptionPDF,
    generateInvoicePDF
};
