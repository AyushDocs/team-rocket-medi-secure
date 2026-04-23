import { BigInt } from "@graphprotocol/graph-ts";
import {
  InsuranceProviderRegistered,
  PolicyCreated,
  PolicyUpdated,
  InsuranceQuoteRequested,
  InsuranceProofVerified,
  PolicyFinalized,
  ClaimSubmitted,
  ClaimProcessed
} from "../generated/Insurance/Insurance";
import { InsuranceProvider, Policy, InsuranceRequest, Claim } from "../generated/schema";

export function handleProviderRegistered(event: InsuranceProviderRegistered): void {
  let provider = new InsuranceProvider(event.params.wallet.toHexString());
  provider.wallet = event.params.wallet;
  provider.name = event.params.name;
  provider.isActive = true;
  provider.policyCount = BigInt.fromI32(0);
  provider.createdAt = event.block.timestamp;
  provider.save();
}

export function handlePolicyCreated(event: PolicyCreated): void {
  let policy = new Policy(event.params.policyId.toString());
  policy.policyId = event.params.policyId;
  policy.provider = event.params.provider.toHexString();
  policy.name = event.params.name;
  policy.description = "";
  policy.basePremium = BigInt.fromI32(0);
  policy.isActive = true;
  policy.minAge = BigInt.fromI32(0);
  policy.createdAt = event.block.timestamp;
  policy.save();
}

export function handlePolicyUpdated(event: PolicyUpdated): void {
  let policy = Policy.load(event.params.policyId.toString());
  if (policy) {
    policy.name = event.params.name;
    policy.basePremium = event.params.basePremium;
    policy.save();
  }
}

export function handleQuoteRequested(event: InsuranceQuoteRequested): void {
  let request = new InsuranceRequest(event.params.requestId.toString());
  request.requestId = event.params.requestId;
  request.patient = event.params.patient;
  request.provider = event.params.provider.toHexString();
  request.policy = event.params.policyId.toString();
  request.finalPremium = BigInt.fromI32(0);
  request.isVerified = false;
  request.isFinalized = false;
  request.createdAt = event.block.timestamp;
  request.save();
}

export function handleProofVerified(event: InsuranceProofVerified): void {
  let request = InsuranceRequest.load(event.params.requestId.toString());
  if (request) {
    request.isVerified = true;
    request.finalPremium = event.params.discountPremium;
    request.save();
  }
}

export function handlePolicyFinalized(event: PolicyFinalized): void {
  let request = InsuranceRequest.load(event.params.requestId.toString());
  if (request) {
    request.isFinalized = true;
    request.save();
  }
}

export function handleClaimSubmitted(event: ClaimSubmitted): void {
  let claim = new Claim(event.params.claimId.toString());
  claim.claimId = event.params.claimId;
  claim.patient = event.params.patient;
  claim.provider = event.params.patient.toHexString(); // Use patient as placeholder
  claim.procedureName = event.params.procedure;
  claim.cost = BigInt.fromI32(0);
  claim.status = "SUBMITTED";
  claim.timestamp = event.block.timestamp;
  claim.save();
}

export function handleClaimProcessed(event: ClaimProcessed): void {
  let claim = Claim.load(event.params.claimId.toString());
  if (claim) {
    claim.status = event.params.status;
    claim.save();
  }
}