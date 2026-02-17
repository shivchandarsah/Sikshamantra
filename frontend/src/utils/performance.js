// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
    this.metrics = new Map();
    this.debounceTimers = new Map(); // ✅ Add debounce timers
  }

  // Start timing an operation
  startTimer(name) {
    this.timers.set(name, performance.now());
    // console.log(`⏱️ Started timer: ${name}`); // Removed for production
  }

  // End timing and log result
  endTimer(name) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      // Silently return 0 instead of warning for missing timers
      // This prevents noise from component unmounting or conditional renders
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);
    this.metrics.set(name, duration);
    
    // console.log(`✅ ${name}: ${duration.toFixed(2)}ms`); // Removed for production
    return duration;
  }

  // Safe end timer - only ends if timer was started
  safeEndTimer(name) {
    if (this.timers.has(name)) {
      return this.endTimer(name);
    }
    return 0;
  }

  // ✅ Debounce function to prevent rapid API calls
  debounce(key, func, delay = 300) {
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      func();
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  // ✅ Cancel debounced function
  cancelDebounce(key) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.delete(key);
    }
  }

  // Get all metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clear() {
    this.timers.clear();
    this.metrics.clear();
    // ✅ Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  // Log performance summary (only in development)
  logSummary() {
    // Performance summary disabled in production
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Helper functions
export const startTimer = (name) => performanceMonitor.startTimer(name);
export const endTimer = (name) => performanceMonitor.endTimer(name);
export const safeEndTimer = (name) => performanceMonitor.safeEndTimer(name);
export const getMetrics = () => performanceMonitor.getMetrics();
export const logSummary = () => performanceMonitor.logSummary();
export const clearMetrics = () => performanceMonitor.clear();

// ✅ Export debounce utilities
export const debounce = (key, func, delay) => performanceMonitor.debounce(key, func, delay);
export const cancelDebounce = (key) => performanceMonitor.cancelDebounce(key);

export default performanceMonitor;