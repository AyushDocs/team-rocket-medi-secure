const MESSAGING_PROVIDERS = {
    TELEGRAM: "telegram",
    WHATSAPP: "whatsapp"
};

class MessagingService {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.startProcessor();
    }

    async sendTelegram(chatId, message, options = {}) {
        const payload = {
            chat_id: chatId,
            text: message,
            parse_mode: options.parseMode || "HTML",
            ...options
        };

        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.log(`[TELEGRAM MOCK] Chat ${chatId}: ${message}`);
            return { success: true, mock: true };
        }

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();
            return { success: result.ok, messageId: result.message_id };
        } catch (error) {
            console.error("[TELEGRAM] Error:", error.message);
            return { success: false, error: error.message };
        }
    }

    async sendWhatsApp(to, message, template = null) {
        const payload = {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message }
        };

        if (template) {
            payload.type = "template";
            payload.template = template;
        }

        if (!process.env.WHATSAPP_FROM || !process.env.WHATAPP_ACCESS_TOKEN) {
            console.log(`[WHATSAPP MOCK] To ${to}: ${message}`);
            return { success: true, mock: true };
        }

        try {
            const response = await fetch(
                `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.WHATAPP_ACCESS_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();
            return { success: result.id ? true : false, messageId: result.messages?.[0]?.id };
        } catch (error) {
            console.error("[WHATSAPP] Error:", error.message);
            return { success: false, error: error.message };
        }
    }

    async sendEmergencyAlert(contact, patientName, alertMessage) {
        const results = [];

        if (contact.telegram) {
            const result = await this.sendTelegram(
                contact.telegram,
                `🚨 EMERGENCY ALERT for ${patientName}\n\n${alertMessage}\n\nThis is an automated alert from Sanjeevni Medical System.`
            );
            results.push({ provider: "telegram", ...result });
        }

        if (contact.whatsapp) {
            const result = await this.sendWhatsApp(
                contact.whatsapp,
                `🚨 EMERGENCY ALERT for ${patientName}\n\n${alertMessage}\n\nSanjeevni Medical System`
            );
            results.push({ provider: "whatsapp", ...result });
        }

        if (contact.sms) {
            results.push({ provider: "sms", ...await this.sendSMS(contact.sms, `EMERGENCY: ${patientName} - ${alertMessage}`) });
        }

        return results;
    }

    async sendAppointmentReminder(contact, patientName, dateTime, doctorName) {
        const message = `📅 Appointment Reminder\n\n${patientName}, your appointment is scheduled for:\n${new Date(dateTime).toLocaleString()}\n\nDoctor: ${doctorName}\n\nReply CONFIRM to confirm or CANCEL to cancel.`;

        if (contact.telegram) {
            await this.sendTelegram(contact.telegram, message);
        }
        if (contact.whatsapp) {
            await this.sendWhatsApp(contact.whatsapp, message);
        }
    }

    async sendVitalAlert(contact, patientName, vitalType, value) {
        const message = `⚠️ Vital Alert for ${patientName}\n\n${vitalType}: ${value}\n\nPlease check on the patient.`;

        if (contact.telegram) {
            await this.sendTelegram(contact.telegram, message);
        }
        if (contact.whatsapp) {
            await this.sendWhatsApp(contact.whatsapp, message);
        }
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        try {
            const item = this.queue.shift();
            if (item.provider === MESSAGING_PROVIDERS.TELEGRAM) {
                await this.sendTelegram(item.chatId, item.message, item.options);
            } else if (item.provider === MESSAGING_PROVIDERS.WHATSAPP) {
                await this.sendWhatsApp(item.to, item.message, item.template);
            }
        } finally {
            this.processing = false;
        }
    }

    startProcessor() {
        setInterval(() => this.processQueue(), 5000);
    }
}

export const messagingService = new MessagingService();

export default messagingService;
