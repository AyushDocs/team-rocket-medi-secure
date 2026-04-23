import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Patient as PatientContract,
  PatientRegistered,
  RecordAdded,
  EmergencyAccessLogged
} from "../generated/Patient/Patient";
import { Patient, MedicalRecord, EmergencyAccessLog } from "../generated/schema";

export function handlePatientRegistered(event: PatientRegistered): void {
  let patient = new Patient(event.params.patientId.toString());
  patient.patientId = event.params.patientId;
  patient.wallet = event.params.wallet;
  patient.username = "";
  patient.name = event.params.name;
  patient.email = "";
  patient.age = BigInt.fromI32(0);
  patient.bloodGroup = "";
  patient.recordCount = BigInt.fromI32(0);
  patient.createdAt = event.block.timestamp;
  patient.updatedAt = event.block.timestamp;
  patient.save();
}

export function handleRecordAdded(event: RecordAdded): void {
  let record = new MedicalRecord(event.params.tokenId.toString());
  record.tokenId = event.params.tokenId;
  record.patient = event.params.patientId.toString();
  record.ipfsHash = event.params.ipfsHash;
  record.fileName = "";
  record.recordDate = "";
  record.hospital = "";
  record.isEmergencyViewable = true;
  record.createdAt = event.block.timestamp;
  record.save();

  let patient = Patient.load(event.params.patientId.toString());
  if (patient) {
    patient.recordCount = patient.recordCount.plus(BigInt.fromI32(1));
    patient.updatedAt = event.block.timestamp;
    patient.save();
  }
}

export function handleEmergencyAccessLogged(event: EmergencyAccessLogged): void {
  let logEntry = new EmergencyAccessLog(
    event.params.patientId.toString().concat("-").concat(event.block.timestamp.toString())
  );
  logEntry.patientId = event.params.patientId;
  logEntry.accessor = event.params.accessor;
  logEntry.reason = event.params.reason;
  logEntry.timestamp = event.params.timestamp;
  logEntry.save();
}