import os from "os";
import { CONFIG } from "../config/constants.js";

class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();
  }

  incrementCounter(name, labels = {}) {
    const key = JSON.stringify({ name, labels });
    const current = this.counters.get(key) || { value: 0, labels };
    current.value += 1;
    this.counters.set(key, current);
  }

  setGauge(name, value, labels = {}) {
    const key = JSON.stringify({ name, labels });
    this.gauges.set(key, { value, labels, timestamp: Date.now() });
  }

  recordHistogram(name, value, labels = {}) {
    const key = JSON.stringify({ name, labels });
    const current = this.histograms.get(key) || { values: [], labels };
    current.values.push(value);
    if (current.values.length > 1000) current.values.shift();
    this.histograms.set(key, current);
  }

  getHistogramStats(values) {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAll() {
    const counters = {};
    for (const [key, data] of this.counters) {
      const parsed = JSON.parse(key);
      counters[parsed.name] = data.value;
    }

    const gauges = {};
    for (const [key, data] of this.gauges) {
      const parsed = JSON.parse(key);
      if (!gauges[parsed.name]) gauges[parsed.name] = {};
      gauges[parsed.name] = data.value;
    }

    const histograms = {};
    for (const [key, data] of this.histograms) {
      const parsed = JSON.parse(key);
      histograms[parsed.name] = this.getHistogramStats(data.values);
    }

    return { counters, gauges, histograms };
  }

  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      process: {
        uptime: Math.floor(process.uptime()),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        eventLoopLag: Math.floor(process.eventLoopDelay || 0)
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: {
          total: Math.round(os.totalmem() / 1024 / 1024),
          free: Math.round(os.freemem() / 1024 / 1024),
          used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
        },
        loadAvg: os.loadavg()
      },
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.counters.clear();
    this.histograms.clear();
  }
}

export const metrics = new MetricsCollector();

export const trackRequest = (req, res, durationMs) => {
  metrics.incrementCounter("http_requests_total", { 
    method: req.method, 
    path: req.route?.path || req.path,
    status: res.statusCode 
  });
  
  metrics.recordHistogram("http_request_duration_ms", durationMs, { 
    method: req.method,
    path: req.route?.path || req.path
  });
};

export const trackBlockchainCall = (method, success, durationMs) => {
  metrics.incrementCounter("blockchain_calls_total", { method, success });
  metrics.recordHistogram("blockchain_call_duration_ms", durationMs, { method });
};

export const trackDatabaseQuery = (operation, durationMs) => {
  metrics.incrementCounter("database_queries_total", { operation });
  metrics.recordHistogram("database_query_duration_ms", durationMs, { operation });
};

export const trackCacheOperation = (operation, hit) => {
  metrics.incrementCounter("cache_operations_total", { operation, hit: hit ? "true" : "false" });
};

export const getMetrics = () => {
  const all = metrics.getAll();
  const system = metrics.getSystemMetrics();
  
  return {
    application: all,
    system,
    service: {
      name: CONFIG.SERVICE_NAME,
      id: CONFIG.SERVICE_ID,
      version: CONFIG.VERSION,
      startTime: new Date(metrics.startTime).toISOString()
    }
  };
};

export default metrics;