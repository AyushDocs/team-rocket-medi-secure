import { CONFIG } from "../config/constants.js";
import logger from "./logger.js";

class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || "default";
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.resetTimeout = options.resetTimeout || 30000;
    
    this.failures = 0;
    this.state = "closed";
    this.nextAttempt = Date.now();
    this.lastFailure = null;
  }

  async execute(fn) {
    if (this.state === "open") {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
      this.state = "half-open";
      logger.info(`[${CONFIG.SERVICE_ID}] Circuit breaker ${this.name} entering half-open state`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === "half-open") {
      this.state = "closed";
      logger.info(`[${CONFIG.SERVICE_ID}] Circuit breaker ${this.name} closed`);
    }
  }

  onFailure(error) {
    this.failures++;
    this.lastFailure = error;
    
    if (this.failures >= this.threshold) {
      this.state = "open";
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.warn(`[${CONFIG.SERVICE_ID}] Circuit breaker ${this.name} opened after ${this.failures} failures`);
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      nextAttempt: this.state === "open" ? new Date(this.nextAttempt).toISOString() : null,
      lastFailure: this.lastFailure?.message
    };
  }

  reset() {
    this.failures = 0;
    this.state = "closed";
    this.nextAttempt = Date.now();
    logger.info(`[${CONFIG.SERVICE_ID}] Circuit breaker ${this.name} manually reset`);
  }
}

const breakers = {
  patient: new CircuitBreaker({ name: "patient", threshold: 3, resetTimeout: 30000 }),
  doctor: new CircuitBreaker({ name: "doctor", threshold: 3, resetTimeout: 30000 }),
  hospital: new CircuitBreaker({ name: "hospital", threshold: 3, resetTimeout: 30000 }),
  insurance: new CircuitBreaker({ name: "insurance", threshold: 3, resetTimeout: 30000 }),
  general: new CircuitBreaker({ name: "general", threshold: 5, resetTimeout: 60000 })
};

export const getBreaker = (name) => {
  return breakers[name] || breakers.general;
};

export const withCircuitBreaker = async (breakerName, fn, fallback = null) => {
  const breaker = getBreaker(breakerName);
  
  try {
    return await breaker.execute(fn);
  } catch (error) {
    logger.error(`[${CONFIG.SERVICE_ID}] Circuit breaker ${breakerName} error: ${error.message}`);
    
    if (fallback && typeof fallback === "function") {
      return fallback(error);
    }
    throw error;
  }
};

export const getAllBreakerStatus = () => {
  return Object.keys(breakers).map(name => breakers[name].getStatus());
};

export const resetAllBreakers = () => {
  Object.values(breakers).forEach(b => b.reset());
};

export default CircuitBreaker;