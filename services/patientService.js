const CryptoJS = require("crypto-js");
const { AES_SECRET } = require("../config");
const { logAccess } = require("./auditService");

let patients = []; // in-memory storage

function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), AES_SECRET).toString();
}

function decryptData(cipher) {
  const bytes = CryptoJS.AES.decrypt(cipher, AES_SECRET);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

function addPatient(patient, providerId) {
  const id = patients.length + 1;
  const encryptedData = encryptData(patient);
  const record = { id, providerIds: [providerId], data: encryptedData };
  patients.push(record);
  logAccess(providerId, id, "create");
  return { id };
}

function getPatient(id, providerId) {
  const record = patients.find(r => r.id === Number(id));
  if (!record || !record.providerIds.includes(providerId)) return null;
  logAccess(providerId, id, "read");
  return decryptData(record.data);
}

function updatePatient(id, providerId, updatedPatient) {
  const record = patients.find(r => r.id === Number(id));
  if (!record || !record.providerIds.includes(providerId)) return null;
  record.data = encryptData(updatedPatient);
  logAccess(providerId, id, "update");
  return decryptData(record.data);
}

module.exports = { addPatient, getPatient, updatePatient };
