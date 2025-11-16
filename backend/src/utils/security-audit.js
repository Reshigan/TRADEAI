/**
 * Security audit utilities for Trade AI platform
 * Provides tools for security scanning, vulnerability detection, and audit logging
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);
const mkdir = promisify(fs.mkdir);

/**
 * Security audit logger
 */
class SecurityAuditLogger {
  /**
   * Create a new security audit logger
   * @param {Object} options - Logger options
   */
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), 'logs', 'security');
    this.logFile = options.logFile || 'security-audit.log';
    this.logLevel = options.logLevel || 'info';
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = options.maxLogFiles || 10;
    this.enableConsole = options.enableConsole !== false;

    // Log levels
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4
    };

    // Initialize logger
    this.initialize();
  }

  /**
   * Initialize logger
   */
  async initialize() {
    try {
      // Create log directory if it doesn't exist
      if (!fs.existsSync(this.logDir)) {
        await mkdir(this.logDir, { recursive: true });
      }

      // Check if log file exists and rotate if needed
      const logPath = path.join(this.logDir, this.logFile);
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size >= this.maxLogSize) {
          await this.rotateLogFiles();
        }
      }
    } catch (error) {
      console.error('Error initializing security audit logger:', error);
    }
  }

  /**
   * Rotate log files
   */
  async rotateLogFiles() {
    try {
      // Rotate existing log files
      for (let i = this.maxLogFiles - 1; i > 0; i--) {
        const oldFile = path.join(this.logDir, `${this.logFile}.${i}`);
        const newFile = path.join(this.logDir, `${this.logFile}.${i + 1}`);

        if (fs.existsSync(oldFile)) {
          if (i === this.maxLogFiles - 1) {
            // Delete oldest log file
            fs.unlinkSync(oldFile);
          } else {
            // Rename log file
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rename current log file
      const currentFile = path.join(this.logDir, this.logFile);
      const newFile = path.join(this.logDir, `${this.logFile}.1`);

      if (fs.existsSync(currentFile)) {
        fs.renameSync(currentFile, newFile);
      }
    } catch (error) {
      console.error('Error rotating log files:', error);
    }
  }

  /**
   * Log security event
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  async log(level, message, data = {}) {
    if (this.levels[level] < this.levels[this.logLevel]) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        ...data
      };

      // Add log entry to file
      const logPath = path.join(this.logDir, this.logFile);
      await appendFile(logPath, `${JSON.stringify(logEntry)}\n`);

      // Log to console if enabled
      if (this.enableConsole) {
        const consoleMethod = level === 'debug' ? 'debug' :
          level === 'info' ? 'info' :
            level === 'warn' ? 'warn' :
              'error';

        console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Log debug event
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data = {}) {
    return this.log('debug', message, data);
  }

  /**
   * Log info event
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data = {}) {
    return this.log('info', message, data);
  }

  /**
   * Log warning event
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data = {}) {
    return this.log('warn', message, data);
  }

  /**
   * Log error event
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  error(message, data = {}) {
    return this.log('error', message, data);
  }

  /**
   * Log critical event
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  critical(message, data = {}) {
    return this.log('critical', message, data);
  }

  /**
   * Log authentication event
   * @param {Object} user - User information
   * @param {string} action - Authentication action
   * @param {boolean} success - Whether authentication was successful
   * @param {Object} context - Additional context
   */
  logAuth(user, action, success, context = {}) {
    const level = success ? 'info' : 'warn';
    const message = `Authentication ${action} ${success ? 'succeeded' : 'failed'} for user ${user.email || user.username || 'unknown'}`;

    return this.log(level, message, {
      event_type: 'authentication',
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action,
      success,
      ip_address: context.ip,
      user_agent: context.userAgent,
      ...context
    });
  }

  /**
   * Log access event
   * @param {Object} user - User information
   * @param {string} resource - Resource being accessed
   * @param {string} action - Access action
   * @param {boolean} authorized - Whether access was authorized
   * @param {Object} context - Additional context
   */
  logAccess(user, resource, action, authorized, context = {}) {
    const level = authorized ? 'info' : 'warn';
    const message = `Access ${authorized ? 'granted' : 'denied'} for ${action} on ${resource} by user ${user.email || user.username || 'unknown'}`;

    return this.log(level, message, {
      event_type: 'access_control',
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      resource,
      action,
      authorized,
      ip_address: context.ip,
      user_agent: context.userAgent,
      ...context
    });
  }

  /**
   * Log data modification event
   * @param {Object} user - User information
   * @param {string} resource - Resource being modified
   * @param {string} action - Modification action
   * @param {Object} changes - Changes made
   * @param {Object} context - Additional context
   */
  logDataModification(user, resource, action, changes, context = {}) {
    const message = `Data ${action} on ${resource} by user ${user.email || user.username || 'unknown'}`;

    return this.log('info', message, {
      event_type: 'data_modification',
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      resource,
      action,
      changes,
      ip_address: context.ip,
      user_agent: context.userAgent,
      ...context
    });
  }

  /**
   * Log security violation event
   * @param {string} type - Violation type
   * @param {string} description - Violation description
   * @param {Object} context - Additional context
   */
  logSecurityViolation(type, description, context = {}) {
    const message = `Security violation detected: ${type}`;

    return this.log('critical', message, {
      event_type: 'security_violation',
      violation_type: type,
      description,
      ip_address: context.ip,
      user_agent: context.userAgent,
      user_id: context.userId,
      ...context
    });
  }
}

/**
 * Security vulnerability scanner
 */
class SecurityVulnerabilityScanner {
  /**
   * Create a new security vulnerability scanner
   * @param {Object} options - Scanner options
   */
  constructor(options = {}) {
    this.logger = options.logger || new SecurityAuditLogger();
    this.scanInterval = options.scanInterval || 24 * 60 * 60 * 1000; // 24 hours
    this.scanTimeout = options.scanTimeout || 30 * 60 * 1000; // 30 minutes
    this.scanningEnabled = options.scanningEnabled !== false;

    // Initialize scanner
    if (this.scanningEnabled) {
      this.scheduleScan();
    }
  }

  /**
   * Schedule vulnerability scan
   */
  scheduleScan() {
    setTimeout(() => {
      this.performScan()
        .then(() => {
          this.scheduleScan();
        })
        .catch((error) => {
          this.logger.error('Error performing vulnerability scan:', { error: error.message });
          this.scheduleScan();
        });
    }, this.scanInterval);
  }

  /**
   * Perform vulnerability scan
   */
  async performScan() {
    this.logger.info('Starting security vulnerability scan');

    try {
      // Set scan timeout
      const scanTimeout = setTimeout(() => {
        this.logger.error('Security vulnerability scan timed out');
      }, this.scanTimeout);

      // Perform scans
      await Promise.all([
        this.scanDependencies(),
        this.scanConfiguration(),
        this.scanFilePermissions(),
        this.scanSecrets()
      ]);

      // Clear timeout
      clearTimeout(scanTimeout);

      this.logger.info('Security vulnerability scan completed');
    } catch (error) {
      this.logger.error('Error during security vulnerability scan:', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies() {
    this.logger.info('Scanning dependencies for vulnerabilities');

    try {
      // In a real implementation, this would use a vulnerability database
      // or a service like npm audit, Snyk, or Dependabot

      // Simulate dependency scan
      const vulnerabilities = [
        // Example vulnerability (in a real implementation, this would be actual findings)
        {
          package: 'example-package',
          version: '1.0.0',
          vulnerability: 'CVE-2023-12345',
          severity: 'high',
          description: 'Example vulnerability description',
          recommendation: 'Update to version 1.0.1 or later'
        }
      ];

      // Log vulnerabilities
      if (vulnerabilities.length > 0) {
        this.logger.warn(`Found ${vulnerabilities.length} vulnerable dependencies`, { vulnerabilities });
      } else {
        this.logger.info('No vulnerable dependencies found');
      }

      return vulnerabilities;
    } catch (error) {
      this.logger.error('Error scanning dependencies:', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan configuration for security issues
   */
  async scanConfiguration() {
    this.logger.info('Scanning configuration for security issues');

    try {
      // In a real implementation, this would check configuration files
      // for security issues like weak TLS settings, missing security headers, etc.

      // Simulate configuration scan
      const issues = [
        // Example issue (in a real implementation, this would be actual findings)
        {
          file: 'example-config.json',
          issue: 'Weak TLS configuration',
          severity: 'medium',
          description: 'TLS version 1.0 is enabled, which is vulnerable to various attacks',
          recommendation: 'Disable TLS 1.0 and 1.1, and enable only TLS 1.2 and 1.3'
        }
      ];

      // Log issues
      if (issues.length > 0) {
        this.logger.warn(`Found ${issues.length} configuration security issues`, { issues });
      } else {
        this.logger.info('No configuration security issues found');
      }

      return issues;
    } catch (error) {
      this.logger.error('Error scanning configuration:', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan file permissions for security issues
   */
  async scanFilePermissions() {
    this.logger.info('Scanning file permissions for security issues');

    try {
      // In a real implementation, this would check file permissions
      // for security issues like world-writable files, etc.

      // Simulate file permissions scan
      const issues = [
        // Example issue (in a real implementation, this would be actual findings)
        {
          file: 'example-file.txt',
          permission: '0777',
          severity: 'high',
          description: 'File is world-writable, which allows any user to modify it',
          recommendation: 'Change permissions to 0644 or more restrictive'
        }
      ];

      // Log issues
      if (issues.length > 0) {
        this.logger.warn(`Found ${issues.length} file permission security issues`, { issues });
      } else {
        this.logger.info('No file permission security issues found');
      }

      return issues;
    } catch (error) {
      this.logger.error('Error scanning file permissions:', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan for hardcoded secrets
   */
  async scanSecrets() {
    this.logger.info('Scanning for hardcoded secrets');

    try {
      // In a real implementation, this would use a tool like git-secrets,
      // trufflehog, or a custom regex-based scanner

      // Simulate secrets scan
      const secrets = [
        // Example secret (in a real implementation, this would be actual findings)
        {
          file: 'example-file.js',
          line: 42,
          type: 'API Key',
          severity: 'critical',
          description: 'Hardcoded API key found in source code',
          recommendation: 'Move the API key to an environment variable or secure vault'
        }
      ];

      // Log secrets
      if (secrets.length > 0) {
        this.logger.critical(`Found ${secrets.length} hardcoded secrets`, { secrets });
      } else {
        this.logger.info('No hardcoded secrets found');
      }

      return secrets;
    } catch (error) {
      this.logger.error('Error scanning for secrets:', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan for common security vulnerabilities
   * @param {Object} req - Express request object
   */
  scanRequest(req) {
    try {
      const issues = [];

      // Check for common attack patterns
      const attackPatterns = this.detectAttackPatterns(req);
      if (attackPatterns.length > 0) {
        issues.push(...attackPatterns);
      }

      // Check for suspicious headers
      const suspiciousHeaders = this.detectSuspiciousHeaders(req);
      if (suspiciousHeaders.length > 0) {
        issues.push(...suspiciousHeaders);
      }

      // Check for suspicious IP
      const suspiciousIP = this.detectSuspiciousIP(req);
      if (suspiciousIP) {
        issues.push(suspiciousIP);
      }

      // Log issues
      if (issues.length > 0) {
        this.logger.warn(`Detected ${issues.length} security issues in request`, {
          issues,
          ip: req.ip,
          path: req.path,
          method: req.method,
          user_agent: req.headers['user-agent']
        });
      }

      return issues;
    } catch (error) {
      this.logger.error('Error scanning request:', { error: error.message });
      return [];
    }
  }

  /**
   * Detect attack patterns in request
   * @param {Object} req - Express request object
   * @returns {Array} - Detected attack patterns
   */
  detectAttackPatterns(req) {
    const issues = [];

    // SQL injection patterns
    const sqlPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/i,
      /src[\r\n]*=[\r\n]*\\?['"]?[^'"]*script/i,
      /on\w+[\s\r\n]*=[\s\r\n]*['"]/i,
      /javascript:[^\s]*/i
    ];

    // Path traversal patterns
    const pathTraversalPatterns = [
      /(\.\.\/)/i,
      /(\.\.\\)/i,
      /(%2e%2e%2f)/i,
      /(%252e%252e%252f)/i,
      /(%c0%ae%c0%ae%c0%af)/i
    ];

    // Check query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          // Check SQL injection
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              issues.push({
                type: 'SQL Injection',
                severity: 'high',
                location: `query.${key}`,
                value
              });
              break;
            }
          }

          // Check XSS
          for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
              issues.push({
                type: 'XSS',
                severity: 'high',
                location: `query.${key}`,
                value
              });
              break;
            }
          }

          // Check path traversal
          for (const pattern of pathTraversalPatterns) {
            if (pattern.test(value)) {
              issues.push({
                type: 'Path Traversal',
                severity: 'high',
                location: `query.${key}`,
                value
              });
              break;
            }
          }
        }
      }
    }

    // Check body parameters
    if (req.body) {
      const checkBody = (obj, prefix = 'body') => {
        for (const [key, value] of Object.entries(obj)) {
          const location = `${prefix}.${key}`;

          if (typeof value === 'string') {
            // Check SQL injection
            for (const pattern of sqlPatterns) {
              if (pattern.test(value)) {
                issues.push({
                  type: 'SQL Injection',
                  severity: 'high',
                  location,
                  value
                });
                break;
              }
            }

            // Check XSS
            for (const pattern of xssPatterns) {
              if (pattern.test(value)) {
                issues.push({
                  type: 'XSS',
                  severity: 'high',
                  location,
                  value
                });
                break;
              }
            }

            // Check path traversal
            for (const pattern of pathTraversalPatterns) {
              if (pattern.test(value)) {
                issues.push({
                  type: 'Path Traversal',
                  severity: 'high',
                  location,
                  value
                });
                break;
              }
            }
          } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively check nested objects
            checkBody(value, location);
          }
        }
      };

      checkBody(req.body);
    }

    return issues;
  }

  /**
   * Detect suspicious headers in request
   * @param {Object} req - Express request object
   * @returns {Array} - Detected suspicious headers
   */
  detectSuspiciousHeaders(req) {
    const issues = [];

    // Check for suspicious user agent
    const userAgent = req.headers['user-agent'];
    if (userAgent) {
      // Check for common penetration testing tools
      const suspiciousUserAgents = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /burp/i,
        /w3af/i,
        /acunetix/i,
        /nmap/i
      ];

      for (const pattern of suspiciousUserAgents) {
        if (pattern.test(userAgent)) {
          issues.push({
            type: 'Suspicious User Agent',
            severity: 'medium',
            location: 'headers.user-agent',
            value: userAgent
          });
          break;
        }
      }
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-originating-ip',
      'x-remote-addr',
      'x-remote-ip'
    ];

    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        issues.push({
          type: 'Suspicious Header',
          severity: 'low',
          location: `headers.${header}`,
          value: req.headers[header]
        });
      }
    }

    return issues;
  }

  /**
   * Detect suspicious IP in request
   * @param {Object} req - Express request object
   * @returns {Object|null} - Detected suspicious IP
   */
  detectSuspiciousIP(req) {
    // In a real implementation, this would check against a database of known
    // malicious IPs, Tor exit nodes, etc.

    // Simulate IP check
    const ip = req.ip || req.connection.remoteAddress;

    // Example check (in a real implementation, this would be actual checks)
    if (ip === '1.2.3.4') {
      return {
        type: 'Suspicious IP',
        severity: 'medium',
        location: 'ip',
        value: ip
      };
    }

    return null;
  }
}

/**
 * File integrity monitor
 */
class FileIntegrityMonitor {
  /**
   * Create a new file integrity monitor
   * @param {Object} options - Monitor options
   */
  constructor(options = {}) {
    this.logger = options.logger || new SecurityAuditLogger();
    this.monitorInterval = options.monitorInterval || 60 * 60 * 1000; // 1 hour
    this.monitorTimeout = options.monitorTimeout || 10 * 60 * 1000; // 10 minutes
    this.monitoringEnabled = options.monitoringEnabled !== false;
    this.baselineFile = options.baselineFile || path.join(process.cwd(), 'security', 'file-integrity-baseline.json');
    this.monitoredPaths = options.monitoredPaths || [
      path.join(process.cwd(), 'src'),
      path.join(process.cwd(), 'config')
    ];
    this.excludedPaths = options.excludedPaths || [
      'node_modules',
      '.git',
      'logs',
      'tmp'
    ];

    // Initialize monitor
    if (this.monitoringEnabled) {
      this.initialize();
    }
  }

  /**
   * Initialize file integrity monitor
   */
  async initialize() {
    try {
      // Create baseline file directory if it doesn't exist
      const baselineDir = path.dirname(this.baselineFile);
      if (!fs.existsSync(baselineDir)) {
        await mkdir(baselineDir, { recursive: true });
      }

      // Check if baseline file exists
      if (!fs.existsSync(this.baselineFile)) {
        // Create baseline
        await this.createBaseline();
      }

      // Schedule monitoring
      this.scheduleMonitoring();
    } catch (error) {
      this.logger.error('Error initializing file integrity monitor:', { error: error.message });
    }
  }

  /**
   * Schedule file integrity monitoring
   */
  scheduleMonitoring() {
    setTimeout(() => {
      this.checkIntegrity()
        .then(() => {
          this.scheduleMonitoring();
        })
        .catch((error) => {
          this.logger.error('Error checking file integrity:', { error: error.message });
          this.scheduleMonitoring();
        });
    }, this.monitorInterval);
  }

  /**
   * Create file integrity baseline
   */
  async createBaseline() {
    this.logger.info('Creating file integrity baseline');

    try {
      // Set baseline timeout
      const baselineTimeout = setTimeout(() => {
        this.logger.error('File integrity baseline creation timed out');
      }, this.monitorTimeout);

      // Calculate file hashes
      const baseline = await this.calculateFileHashes();

      // Save baseline
      await writeFile(this.baselineFile, JSON.stringify(baseline, null, 2));

      // Clear timeout
      clearTimeout(baselineTimeout);

      this.logger.info('File integrity baseline created', { files: Object.keys(baseline).length });

      return baseline;
    } catch (error) {
      this.logger.error('Error creating file integrity baseline:', { error: error.message });
      throw error;
    }
  }

  /**
   * Check file integrity against baseline
   */
  async checkIntegrity() {
    this.logger.info('Checking file integrity');

    try {
      // Set check timeout
      const checkTimeout = setTimeout(() => {
        this.logger.error('File integrity check timed out');
      }, this.monitorTimeout);

      // Load baseline
      const baseline = JSON.parse(await readFile(this.baselineFile, 'utf8'));

      // Calculate current file hashes
      const current = await this.calculateFileHashes();

      // Compare baseline with current
      const changes = this.compareHashes(baseline, current);

      // Clear timeout
      clearTimeout(checkTimeout);

      // Log changes
      if (changes.added.length > 0 || changes.modified.length > 0 || changes.deleted.length > 0) {
        this.logger.warn('File integrity changes detected', {
          added: changes.added.length,
          modified: changes.modified.length,
          deleted: changes.deleted.length,
          changes
        });
      } else {
        this.logger.info('No file integrity changes detected');
      }

      return changes;
    } catch (error) {
      this.logger.error('Error checking file integrity:', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate file hashes for monitored paths
   * @returns {Object} - File hashes
   */
  async calculateFileHashes() {
    const hashes = {};

    // Process each monitored path
    for (const monitoredPath of this.monitoredPaths) {
      await this.processDirectory(monitoredPath, hashes);
    }

    return hashes;
  }

  /**
   * Process directory recursively
   * @param {string} dirPath - Directory path
   * @param {Object} hashes - File hashes
   */
  async processDirectory(dirPath, hashes) {
    try {
      // Check if directory exists
      if (!fs.existsSync(dirPath)) {
        return;
      }

      // Get directory contents
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      // Process each entry
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        // Skip excluded paths
        if (this.isExcluded(entryPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Process subdirectory
          await this.processDirectory(entryPath, hashes);
        } else if (entry.isFile()) {
          // Calculate file hash
          const hash = await this.calculateFileHash(entryPath);
          hashes[entryPath] = hash;
        }
      }
    } catch (error) {
      this.logger.error('Error processing directory:', { dirPath, error: error.message });
    }
  }

  /**
   * Calculate file hash
   * @param {string} filePath - File path
   * @returns {string} - File hash
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => {
          hash.update(data);
        });

        stream.on('end', () => {
          resolve(hash.digest('hex'));
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if path is excluded
   * @param {string} filePath - File path
   * @returns {boolean} - Whether path is excluded
   */
  isExcluded(filePath) {
    return this.excludedPaths.some((excludedPath) => {
      return filePath.includes(path.sep + excludedPath + path.sep) ||
             filePath.endsWith(path.sep + excludedPath);
    });
  }

  /**
   * Compare file hashes
   * @param {Object} baseline - Baseline hashes
   * @param {Object} current - Current hashes
   * @returns {Object} - Changes
   */
  compareHashes(baseline, current) {
    const changes = {
      added: [],
      modified: [],
      deleted: []
    };

    // Check for added and modified files
    for (const [filePath, hash] of Object.entries(current)) {
      if (!baseline[filePath]) {
        changes.added.push(filePath);
      } else if (baseline[filePath] !== hash) {
        changes.modified.push(filePath);
      }
    }

    // Check for deleted files
    for (const filePath of Object.keys(baseline)) {
      if (!current[filePath]) {
        changes.deleted.push(filePath);
      }
    }

    return changes;
  }

  /**
   * Update baseline with current file hashes
   */
  async updateBaseline() {
    this.logger.info('Updating file integrity baseline');

    try {
      // Calculate current file hashes
      const current = await this.calculateFileHashes();

      // Save baseline
      await writeFile(this.baselineFile, JSON.stringify(current, null, 2));

      this.logger.info('File integrity baseline updated', { files: Object.keys(current).length });

      return current;
    } catch (error) {
      this.logger.error('Error updating file integrity baseline:', { error: error.message });
      throw error;
    }
  }
}

module.exports = {
  SecurityAuditLogger,
  SecurityVulnerabilityScanner,
  FileIntegrityMonitor
};
