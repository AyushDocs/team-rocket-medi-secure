let auditLogs = []; // in-memory for MVP

function logAccess(providerId, patientId, action) {
  auditLogs.push({
    timestamp: new Date().toISOString(),
    providerId,
    patientId,
    action
  });
}

function getAuditLogs(patientId) {
  return auditLogs.filter(log => log.patientId === Number(patientId));
}

module.exports = { logAccess, getAuditLogs };
