import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CONFIG } from "../config/constants.js";
import logger from "./logger.js";

const client = new DynamoDBClient({ region: CONFIG.DYNAMODB.REGION });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Saves vitals data to DynamoDB
 * @param {string} patientId 
 * @param {object} vitals 
 */
export const saveVitals = async (patientId, vitals) => {
    try {
        const item = {
            patientId: patientId,
            timestamp: new Date().toISOString(),
            heartRate: vitals.heartRate || vitals.hr || vitals.bpm || 0,
            spO2: vitals.spO2 || vitals.spo2 || 0,
            temperature: vitals.temperature || vitals.temp || 0,
            humidity: vitals.humidity || vitals.hum || 0,
            status: vitals.status || "normal"
        };

        const command = new PutCommand({
            TableName: CONFIG.DYNAMODB.TABLE,
            Item: item
        });

        await docClient.send(command);
        logger.info(`Vitals saved to DynamoDB for patient: ${patientId}`);
        return true;
    } catch (err) {
        logger.error(`Error saving vitals to DynamoDB: ${err.message}`);
        return false;
    }
};

/**
 * Fetches historical vitals for a patient
 * @param {string} patientId 
 * @param {number} limit 
 */
export const getVitalsHistory = async (patientId, limit = 50) => {
    try {
        const command = new QueryCommand({
            TableName: CONFIG.DYNAMODB.TABLE,
            KeyConditionExpression: "patientId = :pid",
            ExpressionAttributeValues: {
                ":pid": patientId
            },
            ScanIndexForward: false, // Latest first
            Limit: limit
        });

        const response = await docClient.send(command);
        return response.Items || [];
    } catch (err) {
        logger.error(`Error fetching vitals from DynamoDB: ${err.message}`);
        return [];
    }
};

export default { saveVitals, getVitalsHistory };
