import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Hospital as HospitalContract,
  HospitalRegistered,
  DoctorAdded,
  DoctorRemoved,
  LogPunchIn,
  LogPunchOut
} from "../generated/Hospital/Hospital";

export function handleHospitalRegistered(event: HospitalRegistered): void {
  log.info("Hospital registered: {} at {}", [
    event.params.name,
    event.params.wallet.toHexString()
  ]);
}

export function handleDoctorAdded(event: DoctorAdded): void {
  log.info("Doctor {} added to hospital {}", [
    event.params.doctor.toHexString(),
    event.params.hospitalId.toString()
  ]);
}

export function handleDoctorRemoved(event: DoctorRemoved): void {
  log.info("Doctor {} removed from hospital {}", [
    event.params.doctor.toHexString(),
    event.params.hospitalId.toString()
  ]);
}

export function handleDoctorPunchedIn(event: LogPunchIn): void {
  log.info("Doctor {} punched in at hospital {} at {}", [
    event.params.doctor.toHexString(),
    event.params.hospital.toHexString(),
    event.params.timestamp.toString()
  ]);
}

export function handleDoctorPunchedOut(event: LogPunchOut): void {
  log.info("Doctor {} punched out from hospital {} - duration: {} seconds", [
    event.params.doctor.toHexString(),
    event.params.hospital.toHexString(),
    event.params.duration.toString()
  ]);
}