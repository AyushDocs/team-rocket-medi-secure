import { mqtt, iot } from "aws-iot-device-sdk-v2";
import { getSocketHelpers } from "./socketService.js";
import { CONFIG } from "../config/constants.js";
import { saveVitals } from "./dynamoService.js";
import logger from "./logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AWS IoT Configuration from Environment
const { ENDPOINT, CLIENT_ID_PREFIX, TOPIC, CERT_PATH, KEY_PATH, CA_PATH } = CONFIG.AWS_IOT;
const CLIENT_ID = `${CLIENT_ID_PREFIX}_${Math.random().toString(16).substring(2, 10)}`;

let connection = null;

export const initializeIoT = async () => {
    try {
        logger.info("Initializing AWS IoT Connection...");

        const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(CERT_PATH, KEY_PATH);
        config_builder.with_certificate_authority_from_path(undefined, CA_PATH);
        config_builder.with_clean_session(false);
        config_builder.with_client_id(CLIENT_ID);
        config_builder.with_endpoint(ENDPOINT);

        const config = config_builder.build();
        const client = new mqtt.MqttClient();
        connection = client.new_connection(config);

        connection.on("connect", (session_present) => {
            logger.info("Connected to AWS IoT Core");
            
            // Subscribe to health topic
            connection.subscribe(TOPIC, mqtt.QoS.AtLeastOnce, (topic, payload, dup, qos, retain) => {
                const decoder = new TextDecoder("utf-8");
                const message = decoder.decode(payload);
                handleIoTMessage(topic, message);
            });
            logger.info(`Subscribed to topic: ${TOPIC}`);
        });

        connection.on("interrupt", (error) => {
            logger.error(`IoT Connection interrupted: ${error}`);
        });

        connection.on("resume", (return_code, session_present) => {
            logger.info(`IoT Connection resumed: ${return_code}`);
        });

        connection.on("disconnect", () => {
            logger.info("Disconnected from AWS IoT Core");
        });

        connection.on("error", (error) => {
            logger.error(`IoT Connection error: ${error}`);
        });

        await connection.connect();
    } catch (err) {
        logger.error(`Failed to initialize AWS IoT: ${err.message}`);
    }
};

const handleIoTMessage = (topic, message) => {
    try {
        const data = JSON.parse(message);
        logger.info(`IoT Message received on ${topic}:`, data);

        // Extract patientId from topic (health/patient1/data -> patient1)
        const parts = topic.split("/");
        const patientId = parts[1];

        const helpers = getSocketHelpers();
        if (helpers) {
            // Include humidity if present
            const vitalsData = {
                ...data,
                humidity: data.humidity || data.hum || 0
            };
            helpers.emitVitalsUpdate(patientId, vitalsData);
            logger.info(`Broadcasted vitals for ${patientId} via Socket.io`, vitalsData);

            // Persist to DynamoDB for historical tracking
            saveVitals(patientId, vitalsData).catch(err => 
                logger.error(`Async DynamoDB save failed: ${err.message}`)
            );
        } else {
            logger.warn("Socket helpers not available yet");
        }
    } catch (err) {
        logger.error(`Error handling IoT message: ${err.message}`);
    }
};

export default { initializeIoT };
