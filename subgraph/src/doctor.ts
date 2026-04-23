import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Doctor as DoctorContract,
  AccessRequested,
  AccessGranted,
  AccessRevoked,
  PatientAdded,
  EmergencyAccessGranted,
  EmergencyResolved
} from "../generated/Doctor/Doctor";
import { Doctor, AccessGrant } from "../generated/schema";

export function handleAccessRequested(event: AccessRequested): void {
  let id = event.params.patient.toHexString()
    .concat("-")
    .concat(event.params.doctor.toHexString())
    .concat("-")
    .concat(event.params.ipfsHash);
  
  let grant = new AccessGrant(id);
  grant.patient = event.params.patient;
  grant.doctor = event.params.doctor.toHexString();
  grant.ipfsHash = event.params.ipfsHash;
  grant.hasAccess = false;
  grant.grantTime = BigInt.fromI32(0);
  grant.duration = event.params.duration;
  grant.reason = event.params.reason;
  grant.save();
}

export function handleAccessGranted(event: AccessGranted): void {
  let id = event.params.patient.toHexString()
    .concat("-")
    .concat(event.params.doctor.toHexString())
    .concat("-")
    .concat(event.params.ipfsHash);
  
  let grant = AccessGrant.load(id);
  if (grant) {
    grant.hasAccess = true;
    grant.grantTime = event.params.grantTime;
    grant.duration = event.params.duration;
    grant.save();
  }
}

export function handleAccessRevoked(event: AccessRevoked): void {
  let id = event.params.patient.toHexString()
    .concat("-")
    .concat(event.params.doctor.toHexString())
    .concat("-")
    .concat(event.params.ipfsHash);
  
  let grant = AccessGrant.load(id);
  if (grant) {
    grant.hasAccess = false;
    grant.save();
  }
}

export function handlePatientAdded(event: PatientAdded): void {
  log.info("Patient {} added to doctor {}", [
    event.params.patientId.toString(),
    event.params.doctorId.toString()
  ]);
}

export function handleEmergencyAccessGranted(event: EmergencyAccessGranted): void {
  log.info("Emergency access: patient {} by doctor {} for {}", [
    event.params.patient.toHexString(),
    event.params.doctor.toHexString(),
    event.params.reason
  ]);
}

export function handleEmergencyResolved(event: EmergencyResolved): void {
  log.info("Emergency resolved: patient {} by {}", [
    event.params.patient.toHexString(),
    event.params.resolver.toHexString()
  ]);
}