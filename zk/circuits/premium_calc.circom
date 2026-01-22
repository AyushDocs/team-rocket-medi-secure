pragma circom 2.1.4;

/*
    Zero-Knowledge Premium Calculator
    This circuit allows a patient to prove they meet specific health criteria 
    (e.g., Age > 18, Vaccinated, Stable Blood Pressure) 
    WITHOUT revealing their actual age, health status, or identity.
    
    The insurance company provides the PUBLIC thresholds.
    The patient providing the PRIVATE vitals.
*/

// Note: Requires circomlib (npm install circomlib)
// If local paths differ, adjust the include path accordingly.
include "comparators.circom";

template PremiumCalculator() {
    // PRIVATE INPUTS: Only the patient knows these
    signal input age;
    signal input vaccinationStatus; // 1 = Yes, 0 = No
    signal input systolicBP;
    signal input diastolicBP;

    // PUBLIC INPUTS: Known by everyone (Insurance Company Thresholds)
    signal input minAge;
    signal input requiredVaccinationStatus;
    signal input maxSystolicBP;
    signal input maxDiastolicBP;

    // OUTPUT: 1 if patient is eligible for premium discount, 0 otherwise
    signal output isEligible;

    // ---------------------------------------------------------
    // 1. AGE CHECK: age >= minAge
    // ---------------------------------------------------------
    component ageCheck = GreaterEqThan(8); // Handles numbers up to 255
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;

    // ---------------------------------------------------------
    // 2. VACCINE CHECK: vaccinationStatus == requiredVaccinationStatus
    // ---------------------------------------------------------
    component vaccineCheck = IsEqual();
    vaccineCheck.in[0] <== vaccinationStatus;
    vaccineCheck.in[1] <== requiredVaccinationStatus;

    // ---------------------------------------------------------
    // 3. BLOOD PRESSURE CHECKS: bp <= maxThreshold
    // ---------------------------------------------------------
    component systolicCheck = LessEqThan(9); // Up to 511
    systolicCheck.in[0] <== systolicBP;
    systolicCheck.in[1] <== maxSystolicBP;

    component diastolicCheck = LessEqThan(8);
    diastolicCheck.in[0] <== diastolicBP;
    diastolicCheck.in[1] <== maxDiastolicBP;

    // ---------------------------------------------------------
    // FINAL ELIGIBILITY CALCULATION
    // MUST BE: (Age OK) AND (Vaccine OK) AND (Systolic OK) AND (Diastolic OK)
    // ---------------------------------------------------------
    
    signal step1;
    step1 <== ageCheck.out * vaccineCheck.out; // 1 if both true

    signal step2;
    step2 <== step1 * systolicCheck.out;

    isEligible <== step2 * diastolicCheck.out;
}

// Global component declaration
// The inputs in brackets [] are the PUBLIC inputs.
// Everything else is kept PRIVATE (Zero-Knowledge).
component main { public [minAge, requiredVaccinationStatus, maxSystolicBP, maxDiastolicBP] } = PremiumCalculator();
