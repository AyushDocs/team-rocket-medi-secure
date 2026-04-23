import { vitalService, userService, appointmentService } from "./database.js";

const HEALTH_RANGES = {
    systolicBP: { min: 90, max: 120, dangerHigh: 140, dangerLow: 80 },
    diastolicBP: { min: 60, max: 80, dangerHigh: 90, dangerLow: 50 },
    heartRate: { min: 60, max: 100, dangerHigh: 120, dangerLow: 40 },
    temperature: { min: 97, max: 99, dangerHigh: 103, dangerLow: 95 },
    oxygenSat: { min: 95, max: 100, dangerLow: 90 }
};

const analyzeVital = (name, value, ranges) => {
    if (value === null || value === undefined) return null;

    const status = {
        value,
        name,
        status: "normal",
        risk: "low"
    };

    if (ranges.dangerHigh && value >= ranges.dangerHigh) {
        status.status = "critical";
        status.risk = "high";
        status.message = `${name} is critically high`;
    } else if (ranges.dangerLow && value <= ranges.dangerLow) {
        status.status = "critical";
        status.risk = "high";
        status.message = `${name} is critically low`;
    } else if (ranges.max && value > ranges.max) {
        status.status = "elevated";
        status.risk = "medium";
        status.message = `${name} is slightly elevated`;
    } else if (ranges.min && value < ranges.min) {
        status.status = "low";
        status.risk = "medium";
        status.message = `${name} is slightly low`;
    }

    return status;
};

export const generateHealthInsights = async (patientId) => {
    const user = await userService.findById(patientId);
    if (!user?.patientData) return null;

    const vitals = await vitalService.findByPatient(user.patientData.id, 30);
    const appointments = await appointmentService.findByPatient(user.patientData.id);

    if (vitals.length === 0) {
        return {
            summary: "No vitals data available",
            recommendations: ["Start tracking your vitals to get personalized insights"]
        };
    }

    const latest = vitals[0];
    const vitalAnalysis = {
        bloodPressure: analyzeVital("Blood Pressure", latest.systolicBP, HEALTH_RANGES.systolicBP),
        heartRate: analyzeVital("Heart Rate", latest.heartRate, HEALTH_RANGES.heartRate),
        temperature: analyzeVital("Temperature", latest.temperature, HEALTH_RANGES.temperature),
        oxygenSat: analyzeVital("Oxygen Saturation", latest.oxygenSat, HEALTH_RANGES.oxygenSat)
    };

    const trends = analyzeTrends(vitals);
    const recommendations = generateRecommendations(vitalAnalysis, trends, user);
    const riskScore = calculateRiskScore(vitalAnalysis, trends);

    return {
        generatedAt: new Date().toISOString(),
        patientId,
        patientName: user.profile?.name,
        latestVitals: latest,
        vitalStatus: vitalAnalysis,
        trends,
        riskScore,
        recommendations,
        upcomingAppointments: appointments.filter(a => 
            a.status === "scheduled" && new Date(a.dateTime) > new Date()
        ).length
    };
};

const analyzeTrends = (vitals) => {
    if (vitals.length < 7) return { message: "Not enough data for trend analysis", stable: true };

    const recent = vitals.slice(0, 7);
    const older = vitals.slice(7, 14);

    if (older.length === 0) return { message: "Building trend data", stable: true };

    const avg = (arr, key) => arr.reduce((sum, v) => sum + (v[key] || 0), 0) / arr.length;

    const bpTrend = avg(recent, 'systolicBP') - avg(older, 'systolicBP');
    const hrTrend = avg(recent, 'heartRate') - avg(older, 'heartRate');

    return {
        bloodPressure: bpTrend > 5 ? "increasing" : bpTrend < -5 ? "decreasing" : "stable",
        heartRate: hrTrend > 5 ? "increasing" : hrTrend < -5 ? "decreasing" : "stable",
        message: bpTrend > 0 ? "Blood pressure trending up" : "Blood pressure stable"
    };
};

const generateRecommendations = (vitals, trends, user) => {
    const recommendations = [];

    if (vitals.bloodPressure?.status === "critical") {
        recommendations.push({
            priority: "high",
            title: "Critical Blood Pressure Alert",
            message: "Your blood pressure is in a dangerous range. Contact your doctor immediately."
        });
    }

    if (vitals.heartRate?.status === "critical") {
        recommendations.push({
            priority: "high",
            title: "Heart Rate Alert",
            message: "Your heart rate is abnormal. Seek medical attention if persistent."
        });
    }

    if (trends.bloodPressure === "increasing") {
        recommendations.push({
            priority: "medium",
            title: "Blood Pressure Monitoring",
            message: "Your blood pressure has been trending upward. Consider lifestyle changes and monitoring."
        });
    }

    if (user.patientData?.chronicConditions?.toLowerCase().includes("diabetes")) {
        recommendations.push({
            priority: "medium",
            title: "Diabetes Management",
            message: "Regular monitoring is important for diabetes management."
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            priority: "low",
            title: "Keep It Up",
            message: "Your vitals are looking good! Continue maintaining healthy habits."
        });
    }

    return recommendations;
};

const calculateRiskScore = (vitals, trends) => {
    let score = 0;
    let maxScore = 0;

    Object.values(vitals).forEach(v => {
        if (!v) return;
        maxScore += 10;
        if (v.status === "critical") score += 10;
        else if (v.status === "elevated") score += 5;
        else if (v.status === "low") score += 3;
    });

    if (trends.bloodPressure === "increasing") {
        maxScore += 5;
        score += 3;
    }

    const riskPercentage = Math.round((score / maxScore) * 100);
    
    return {
        score: riskPercentage,
        level: riskPercentage < 20 ? "low" : riskPercentage < 50 ? "medium" : riskPercentage < 75 ? "high" : "critical",
        description: riskPercentage < 20 ? "Low risk - Maintain healthy habits" :
                     riskPercentage < 50 ? "Medium risk - Monitor and consult doctor" :
                     riskPercentage < 75 ? "High risk - Medical attention recommended" :
                     "Critical - Immediate medical attention required"
    };
};

export const getVitalsForecast = async (patientId, days = 7) => {
    const user = await userService.findById(patientId);
    if (!user?.patientData) return null;

    const vitals = await vitalService.getTrends(user.patientData.id, 30);
    
    if (vitals.length < 7) {
        return { forecast: null, message: "Not enough historical data for forecasting" };
    }

    const forecast = [];
    const recent = vitals.slice(0, 14);

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);

        const predicted = {
            date: date.toISOString().split('T')[0],
            systolicBP: Math.round(average(recent.map(v => v.systolicBP).filter(Boolean))),
            heartRate: Math.round(average(recent.map(v => v.heartRate).filter(Boolean)))
        };

        forecast.push(predicted);
    }

    return { forecast, model: "simple_average" };
};

const average = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export default {
    generateHealthInsights,
    getVitalsForecast
};
