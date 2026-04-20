import express from "express";
import { 
    generateMedicalReportPDF, 
    generatePrescriptionPDF,
    generateInvoicePDF 
} from "../services/pdfService.js";

const router = express.Router();

router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const pdf = await generateMedicalReportPDF(patientId);
        
        if (!pdf) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=medical-report-${patientId}.pdf`);
        res.send(pdf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/prescription/:prescriptionId", async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        
        const pdf = await generatePrescriptionPDF(prescriptionId);
        
        if (!pdf) {
            return res.status(404).json({ error: "Prescription not found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=prescription-${prescriptionId}.pdf`);
        res.send(pdf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/invoice/:invoiceId", async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        const pdf = await generateInvoicePDF(invoiceId);
        
        if (!pdf) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoiceId}.pdf`);
        res.send(pdf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
