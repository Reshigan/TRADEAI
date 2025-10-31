#!/usr/bin/env node

/**
 * TRADEAI Health Monitoring Script
 * 
 * Monitors frontend and backend health endpoints
 * Logs results to console and optionally sends alerts
 * 
 * Usage:
 *   node monitor-health.js               # Run once
 *   node monitor-health.js --interval=5  # Run every 5 minutes
 *   node monitor-health.js --daemon      # Run as daemon (background)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  endpoints: [
    {
      name: 'Frontend Health',
      url: 'http://localhost:12000/health',
      protocol: http,
      timeout: 5000,
    },
    {
      name: 'Backend API Health',
      url: 'https://tradeai.gonxt.tech/api/health',
      protocol: https,
      timeout: 5000,
    },
    {
      name: 'Frontend Main Page',
      url: 'https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev',
      protocol: https,
      timeout: 10000,
    },
  ],
  logFile: path.join(__dirname, '../logs/monitor.log'),
  alertThreshold: 3, // Alert after 3 consecutive failures
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDaemon = args.includes('--daemon');
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const intervalMinutes = intervalArg ? parseInt(intervalArg.split('=')[1]) : null;

// Ensure logs directory exists
const logsDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Track consecutive failures
const failureCount = {};

/**
 * Check a single endpoint
 */
function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(endpoint.url);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (endpoint.protocol === https ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: endpoint.timeout,
    };
    
    const req = endpoint.protocol.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsedData = null;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Not JSON, that's okay
        }
        
        resolve({
          name: endpoint.name,
          url: endpoint.url,
          status: res.statusCode,
          duration,
          healthy: res.statusCode >= 200 && res.statusCode < 300,
          data: parsedData,
          timestamp: new Date().toISOString(),
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: 0,
        duration: Date.now() - startTime,
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: 0,
        duration: Date.now() - startTime,
        healthy: false,
        error: 'Request timeout',
        timestamp: new Date().toISOString(),
      });
    });
    
    req.end();
  });
}

/**
 * Log to console with color
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m',
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log to file
 */
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(CONFIG.logFile, logLine);
}

/**
 * Send alert (placeholder - implement your alert mechanism)
 */
function sendAlert(endpoint, failures) {
  const message = `🚨 ALERT: ${endpoint.name} has failed ${failures} times consecutively!`;
  log(message, 'error');
  logToFile(message);
  
  // TODO: Implement your alert mechanism here
  // Examples:
  // - Send email via nodemailer
  // - Send Slack message
  // - Send Discord webhook
  // - Send SMS via Twilio
}

/**
 * Monitor all endpoints
 */
async function monitor() {
  log('\n' + '═'.repeat(80), 'info');
  log(`🔍 Health Check - ${new Date().toLocaleString()}`, 'info');
  log('═'.repeat(80), 'info');
  
  const results = [];
  
  for (const endpoint of CONFIG.endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
    
    const icon = result.healthy ? '✅' : '❌';
    const status = result.healthy ? 'UP' : 'DOWN';
    const details = result.error || `${result.duration}ms`;
    
    if (result.healthy) {
      log(`${icon} ${result.name}: ${status} (${details})`, 'success');
      failureCount[result.name] = 0; // Reset failure count
    } else {
      log(`${icon} ${result.name}: ${status} (${details})`, 'error');
      
      // Track failures
      failureCount[result.name] = (failureCount[result.name] || 0) + 1;
      
      // Send alert if threshold reached
      if (failureCount[result.name] >= CONFIG.alertThreshold) {
        sendAlert(result, failureCount[result.name]);
      }
    }
    
    // Log detailed data if available
    if (result.data) {
      const dataStr = JSON.stringify(result.data, null, 2)
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n');
      log(dataStr, 'info');
    }
  }
  
  log('═'.repeat(80), 'info');
  
  // Write summary to log file
  const summary = results.map(r => 
    `[${r.timestamp}] ${r.name}: ${r.healthy ? 'UP' : 'DOWN'} (${r.duration}ms)`
  ).join('\n');
  logToFile(summary);
  
  // Calculate uptime percentage
  const healthyCount = results.filter(r => r.healthy).length;
  const uptime = ((healthyCount / results.length) * 100).toFixed(2);
  log(`📊 Current Uptime: ${uptime}% (${healthyCount}/${results.length} services healthy)`, 
      uptime === '100.00' ? 'success' : 'warning');
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  log('🚀 TRADEAI Health Monitor Started', 'success');
  log(`📝 Logging to: ${CONFIG.logFile}`, 'info');
  
  if (intervalMinutes) {
    log(`⏰ Monitoring every ${intervalMinutes} minute(s)`, 'info');
    log('Press Ctrl+C to stop', 'warning');
  }
  
  // Run immediately
  await monitor();
  
  // Set up interval if specified
  if (intervalMinutes) {
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }
  
  // If daemon mode, keep process alive
  if (isDaemon) {
    log('🔄 Running in daemon mode', 'info');
    // Keep the process running
    process.stdin.resume();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down monitor...', 'warning');
  logToFile('Monitor stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Shutting down monitor...', 'warning');
  logToFile('Monitor stopped');
  process.exit(0);
});

// Run
main().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, 'error');
  logToFile(`FATAL: ${error.message}`);
  process.exit(1);
});
