import { userService, vitalService, appointmentService, prescriptionService, invoiceService } from "../services/database.js";

export const exportToJSON = async (patientId) => {
    const user = await userService.findById(patientId);
    if (!user) return null;

    const vitals = await vitalService.findByPatient(user.patientData?.id, 1000);
    const appointments = await appointmentService.findByPatient(user.patientData?.id);
    const prescriptions = await prescriptionService.findByPatient(user.patientData?.id);
    const invoices = await invoiceService.findByPatient(user.patientData?.id);

    return {
        exportedAt: new Date().toISOString(),
        patient: {
            id: user.id,
            name: user.profile?.name,
            email: user.profile?.email,
            wallet: user.walletAddress,
            bloodGroup: user.patientData?.bloodGroup,
            allergies: user.patientData?.allergies,
            chronicConditions: user.patientData?.chronicConditions
        },
        vitals: vitals.map(v => ({
            date: v.recordedAt,
            bloodPressure: v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : null,
            heartRate: v.heartRate,
            temperature: v.temperature,
            weight: v.weight,
            source: v.source
        })),
        appointments: appointments.map(a => ({
            date: a.dateTime,
            status: a.status,
            type: a.type,
            notes: a.notes
        })),
        prescriptions: prescriptions.map(p => ({
            date: p.date,
            diagnosis: p.diagnosis,
            medications: JSON.parse(p.medications || '[]'),
            notes: p.notes
        })),
        invoices: invoices.map(i => ({
            amount: i.amount,
            currency: i.currency,
            status: i.status,
            dueDate: i.dueDate,
            paidAt: i.paidAt
        }))
    };
};

export const exportToCSV = async (patientId, dataType = 'vitals') => {
    const user = await userService.findById(patientId);
    if (!user) return null;

    let rows = [];
    let headers = [];

    switch (dataType) {
        case 'vitals':
            headers = ['Date', 'Systolic BP', 'Diastolic BP', 'Heart Rate', 'Temperature', 'Weight', 'Source'];
            const vitals = await vitalService.findByPatient(user.patientData?.id, 1000);
            rows = vitals.map(v => [
                v.recordedAt?.toISOString() || '',
                v.systolicBP || '',
                v.diastolicBP || '',
                v.heartRate || '',
                v.temperature || '',
                v.weight || '',
                v.source || ''
            ]);
            break;

        case 'appointments':
            headers = ['Date', 'Status', 'Type', 'Duration (min)', 'Notes'];
            const appointments = await appointmentService.findByPatient(user.patientData?.id);
            rows = appointments.map(a => [
                a.dateTime?.toISOString() || '',
                a.status || '',
                a.type || '',
                a.duration || '',
                a.notes || ''
            ]);
            break;

        case 'prescriptions':
            headers = ['Date', 'Diagnosis', 'Medications', 'Notes'];
            const prescriptions = await prescriptionService.findByPatient(user.patientData?.id);
            rows = prescriptions.map(p => [
                p.date?.toISOString() || '',
                p.diagnosis || '',
                p.medications || '',
                p.notes || ''
            ]);
            break;

        case 'invoices':
            headers = ['Amount', 'Currency', 'Status', 'Due Date', 'Paid At'];
            const invoices = await invoiceService.findByPatient(user.patientData?.id);
            rows = invoices.map(i => [
                i.amount || '',
                i.currency || '',
                i.status || '',
                i.dueDate?.toISOString() || '',
                i.paidAt?.toISOString() || ''
            ]);
            break;

        default:
            return null;
    }

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
};

export const generatePatientSummary = async (patientId) => {
    const user = await userService.findById(patientId);
    if (!user) return null;

    const vitals = await vitalService.findByPatient(user.patientData?.id, 30);
    const appointments = await appointmentService.findByPatient(user.patientData?.id);
    const prescriptions = await prescriptionService.findByPatient(user.patientData?.id);

    const latestVitals = vitals[0];
    const upcomingAppointments = appointments.filter(a => 
        a.status === 'scheduled' && new Date(a.dateTime) > new Date()
    );

    return {
        generatedAt: new Date().toISOString(),
        patient: {
            name: user.profile?.name,
            email: user.profile?.email,
            phone: user.profile?.phone,
            bloodGroup: user.patientData?.bloodGroup
        },
        latestVitals: latestVitals ? {
            date: latestVitals.recordedAt,
            bloodPressure: latestVitals.systolicBP && latestVitals.diastolicBP 
                ? `${latestVitals.systolicBP}/${latestVitals.diastolicBP}` 
                : null,
            heartRate: latestVitals.heartRate,
            temperature: latestVitals.temperature
        } : null,
        summary: {
            totalVitals: vitals.length,
            totalAppointments: appointments.length,
            upcomingAppointments: upcomingAppointments.length,
            activePrescriptions: prescriptions.length
        }
    };
};

export default {
    exportToJSON,
    exportToCSV,
    generatePatientSummary
};
