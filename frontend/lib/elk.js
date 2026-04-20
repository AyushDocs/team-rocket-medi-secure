"use client";

const ELK_CONFIG = {
  enabled: !!process.env.NEXT_PUBLIC_ELASTICSEARCH_URL,
  elasticUrl: process.env.NEXT_PUBLIC_ELASTICSEARCH_URL || '',
  apiKey: process.env.NEXT_PUBLIC_ELASTICSEARCH_API_KEY || '',
  indexPrefix: process.env.NEXT_PUBLIC_ELASTICSEARCH_INDEX_PREFIX || 'sanjeevni',
};

const logQueue = [];
let isProcessing = false;

const sendToElastic = async (event) => {
  if (!ELK_CONFIG.enabled) return;

  const indexName = `${ELK_CONFIG.indexPrefix}-${new Date().toISOString().split('T')[0]}`;
  const payload = {
    '@timestamp': new Date().toISOString(),
    service: {
      name: 'sanjeevni-frontend',
      version: '0.1.0',
    },
    ...event,
    metadata: {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      viewport: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : null,
    },
  };

  try {
    await fetch(`${ELK_CONFIG.elasticUrl}/${indexName}/_doc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ELK_CONFIG.apiKey}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.warn('ELK logging failed:', error);
  }
};

const processQueue = async () => {
  if (isProcessing || logQueue.length === 0) return;
  isProcessing = true;

  while (logQueue.length > 0) {
    const event = logQueue.shift();
    await sendToElastic(event);
  }

  isProcessing = false;
};

export const logEvent = (category, action, details = {}) => {
  const event = {
    log: { level: 'info' },
    event: { category, action },
    ...details,
  };

  logQueue.push(event);
  processQueue();
};

export const logError = (error, context = {}) => {
  const event = {
    log: { level: 'error' },
    event: { category: 'error', action: error?.message || 'unknown_error' },
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    },
    ...context,
  };

  logQueue.push(event);
  processQueue();
};

export const logContractEvent = (eventName, data = {}) => {
  logEvent('smart_contract', eventName, { contract: { event: eventName, ...data } });
};

export const logUserAction = (action, details = {}) => {
  logEvent('user_action', action, details);
};

export const logTransaction = (txHash, action, details = {}) => {
  logEvent('transaction', action, { transaction: { hash: txHash, ...details } });
};

export const logPageView = (pageName, details = {}) => {
  logEvent('page_view', pageName, { page: { name: pageName, ...details } });
};

export const logFormSubmission = (formName, status, details = {}) => {
  logEvent('form_submission', formName, { form: { name: formName, status, ...details } });
};

export const logWeb3Action = (action, details = {}) => {
  logEvent('web3', action, { web3: details });
};

export const logPerformance = (metric, value, details = {}) => {
  logEvent('performance', metric, { metric: { name: metric, value, unit: 'ms', ...details } });
};

export default ELK_CONFIG;