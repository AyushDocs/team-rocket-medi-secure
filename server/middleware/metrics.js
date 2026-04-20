import { metrics, trackRequest } from "../services/metrics.js";

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    
    trackRequest(req, res, durationMs);
    
    if (durationMs > 2000) {
      metrics.incrementCounter("slow_requests_total", { 
        method: req.method, 
        path: req.path 
      });
    }
  });
  
  next();
};

export const metricsEndpoint = (req, res) => {
  const allMetrics = metrics.getAll();
  const systemMetrics = metrics.getSystemMetrics();
  
  res.json({
    counters: allMetrics.counters,
    gauges: allMetrics.gauges,
    histograms: allMetrics.histograms,
    system: {
      memory: systemMetrics.process.memory,
      cpu: systemMetrics.process.cpu,
      uptime: systemMetrics.process.uptime,
      systemLoad: systemMetrics.system.loadAvg
    }
  });
};

export const prometheusMetrics = (req, res) => {
  const allMetrics = metrics.getAll();
  let output = "";
  
  for (const [name, value] of Object.entries(allMetrics.counters)) {
    output += `# TYPE ${name} counter\n`;
    output += `${name} ${value}\n`;
  }
  
  for (const [name, value] of Object.entries(allMetrics.gauges)) {
    output += `# TYPE ${name} gauge\n`;
    output += `${name} ${value}\n`;
  }
  
  for (const [name, stats] of Object.entries(allMetrics.histograms)) {
    output += `# TYPE ${name} histogram\n`;
    output += `${name}_sum ${stats.avg}\n`;
    output += `${name}_count ${stats.max}\n`;
  }
  
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(output);
};

export default metricsMiddleware;