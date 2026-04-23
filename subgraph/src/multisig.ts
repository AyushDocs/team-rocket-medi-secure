import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  MultiSigWallet as MultiSigWalletContract,
  OwnerAdded,
  OwnerRemoved,
  TransactionSubmitted,
  TransactionConfirmed,
  TransactionExecuted,
  ThresholdChanged
} from "../generated/MultiSigWallet/MultiSigWallet";
import { Transaction } from "../generated/schema";

export function handleOwnerAdded(event: OwnerAdded): void {
  log.info("Owner added: {}", [event.params.owner.toHexString()]);
}

export function handleOwnerRemoved(event: OwnerRemoved): void {
  log.info("Owner removed: {}", [event.params.owner.toHexString()]);
}

export function handleTransactionSubmitted(event: TransactionSubmitted): void {
  let tx = new Transaction(event.params.txHash.toHexString());
  tx.hash = event.params.txHash;
  tx.from = event.transaction.from;
  tx.to = event.params.to;
  tx.value = event.params.value;
  tx.blockNumber = event.block.number;
  tx.timestamp = event.block.timestamp;
  tx.status = "SUBMITTED";
  tx.save();
}

export function handleTransactionConfirmed(event: TransactionConfirmed): void {
  let tx = Transaction.load(event.params.txHash.toHexString());
  if (tx) {
    tx.status = "CONFIRMED";
    tx.save();
  }
}

export function handleTransactionExecuted(event: TransactionExecuted): void {
  let tx = Transaction.load(event.params.txHash.toHexString());
  if (tx) {
    tx.status = "EXECUTED";
    tx.save();
  }
}

export function handleThresholdChanged(event: ThresholdChanged): void {
  log.info("Threshold changed to {}", [event.params.threshold.toString()]);
}