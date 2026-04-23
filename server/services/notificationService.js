const NOTIFICATION_PROVIDERS = {
    EMAIL: "email",
    SMS: "sms",
    PUSH: "push"
};

class NotificationService {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.startProcessor();
    }

    async sendEmail(to, subject, body, templateId = null) {
        const email = {
            to,
            subject,
            body,
            templateId,
            type: NOTIFICATION_PROVIDERS.EMAIL,
            sentAt: null
        };

        if (process.env.EMAIL_ENABLED !== "true") {
            console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
            email.sentAt = new Date();
            return { success: true, mock: true, email };
        }

        try {
            // SendGrid integration placeholder
            // const sgMail = require('@sendgrid/mail');
            // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            // await sgMail.send({ to, subject, html: body });
            
            email.sentAt = new Date();
            return { success: true, email };
        } catch (error) {
            console.error("[EMAIL] Failed:", error.message);
            this.queue.push(email);
            return { success: false, error: error.message };
        }
    }

    async sendSMS(to, message) {
        const sms = {
            to,
            message,
            type: NOTIFICATION_PROVIDERS.SMS,
            sentAt: null
        };

        if (process.env.SMS_ENABLED !== "true") {
            console.log(`[SMS MOCK] To: ${to}, Message: ${message}`);
            sms.sentAt = new Date();
            return { success: true, mock: true, sms };
        }

        try {
            // Twilio integration placeholder
            // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            // await twilio.messages.create({ body: message, from: process.env.TWILIO_FROM, to });
            
            sms.sentAt = new Date();
            return { success: true, sms };
        } catch (error) {
            console.error("[SMS] Failed:", error.message);
            this.queue.push(sms);
            return { success: false, error: error.message };
        }
    }

    async sendPush(userId, title, body, data = {}) {
        console.log(`[PUSH] User: ${userId}, Title: ${title}`);
        return { success: true, mock: true };
    }

    async appointmentReminder(appointment, patient, doctor) {
        const patientEmail = patient.profile?.email;
        const patientPhone = patient.profile?.phone;
        const doctorEmail = doctor.profile?.email;

        const dateStr = new Date(appointment.dateTime).toLocaleString();

        if (patientEmail) {
            await this.sendEmail(
                patientEmail,
                "Appointment Reminder",
                `<p>Your appointment is scheduled for ${dateStr}.</p>
                 <p>Type: ${appointment.type}</p>
                 <p>Doctor: ${doctor.profile?.name}</p>`,
                "appointment-reminder"
            );
        }

        if (patientPhone && process.env.SMS_ENABLED === "true") {
            await this.sendSMS(
                patientPhone,
                `Reminder: Your appointment is on ${dateStr}. Type: ${appointment.type}`
            );
        }
    }

    async appointmentConfirmation(appointment, patient, doctor) {
        const patientEmail = patient.profile?.email;
        
        if (patientEmail) {
            await this.sendEmail(
                patientEmail,
                "Appointment Confirmed",
                `<p>Your appointment has been confirmed for ${new Date(appointment.dateTime).toLocaleString()}.</p>
                 <p>Doctor: ${doctor.profile?.name}</p>
                 <p>Duration: ${appointment.duration} minutes</p>`,
                "appointment-confirmed"
            );
        }
    }

    async appointmentCancellation(appointment, patient, doctor) {
        const patientEmail = patient.profile?.email;
        
        if (patientEmail) {
            await this.sendEmail(
                patientEmail,
                "Appointment Cancelled",
                `<p>Your appointment scheduled for ${new Date(appointment.dateTime).toLocaleString()} has been cancelled.</p>
                 <p>Please reschedule if needed.</p>`,
                "appointment-cancelled"
            );
        }
    }

    async emergencyAlert(patient, alert) {
        const emergencyContact = patient.patientData?.emergencyContact;
        
        if (emergencyContact && process.env.SMS_ENABLED === "true") {
            await this.sendSMS(
                emergencyContact,
                `URGENT: Emergency alert for ${patient.profile?.name}. Issue: ${alert.issue}`
            );
        }
    }

    async vitalsAlert(patient, vitals) {
        const emergencyContact = patient.patientData?.emergencyContact;
        
        if (vitals.heartRate > 120 || vitals.heartRate < 50) {
            if (emergencyContact && process.env.SMS_ENABLED === "true") {
                await this.sendSMS(
                    emergencyContact,
                    `Alert: Abnormal heart rate detected for ${patient.profile?.name}: ${vitals.heartRate} bpm`
                );
            }
        }

        if (vitals.systolicBP > 180 || vitals.systolicBP < 90) {
            if (emergencyContact && process.env.SMS_ENABLED === "true") {
                await this.sendSMS(
                    emergencyContact,
                    `Alert: Abnormal blood pressure for ${patient.profile?.name}: ${vitals.systolicBP}/${vitals.diastolicBP}`
                );
            }
        }
    }

    async invoiceReminder(invoice, patient) {
        const patientEmail = patient.profile?.email;
        
        if (patientEmail && invoice.status === "pending") {
            await this.sendEmail(
                patientEmail,
                "Invoice Payment Reminder",
                `<p>Your invoice of ${invoice.amount} ${invoice.currency} is due.</p>
                 <p>Due Date: ${invoice.dueDate?.toLocaleDateString()}</p>
                 <p>Please pay at your earliest convenience.</p>`,
                "invoice-reminder"
            );
        }
    }

    async prescriptionAlert(patient, prescription) {
        const patientEmail = patient.profile?.email;
        
        if (patientEmail) {
            await this.sendEmail(
                patientEmail,
                "New Prescription",
                `<p>You have a new prescription from ${prescription.doctor?.user?.profile?.name}.</p>
                 <p>Diagnosis: ${prescription.diagnosis}</p>
                 <p>Please collect your medications.</p>`,
                "prescription-new"
            );
        }
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        
        try {
            const item = this.queue.shift();
            if (item.type === NOTIFICATION_PROVIDERS.EMAIL) {
                await this.sendEmail(item.to, item.subject, item.body);
            } else if (item.type === NOTIFICATION_PROVIDERS.SMS) {
                await this.sendSMS(item.to, item.message);
            }
        } finally {
            this.processing = false;
        }
    }

    startProcessor() {
        setInterval(() => this.processQueue(), 10000);
    }
}

export const notificationService = new NotificationService();

export const sendEmail = (to, subject, body) => notificationService.sendEmail(to, subject, body);
export const sendSMS = (to, message) => notificationService.sendSMS(to, message);
export const sendPush = (userId, title, body, data) => notificationService.sendPush(userId, title, body, data);

export default notificationService;
