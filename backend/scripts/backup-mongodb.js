#!/usr/bin/env node

/**
 * MongoDB Backup Script for Trade AI Platform
 * 
 * Features:
 * - Full database backup with mongodump
 * - Compression with gzip
 * - Local storage with retention policy
 * - Optional S3 upload for offsite backup
 * - Restore functionality
 * - Scheduled backup support via cron
 * 
 * Usage:
 *   node scripts/backup-mongodb.js backup     # Create backup
 *   node scripts/backup-mongodb.js restore <backup-file>  # Restore from backup
 *   node scripts/backup-mongodb.js list       # List available backups
 *   node scripts/backup-mongodb.js cleanup    # Remove old backups
 */

require('dotenv').config();
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai',
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  awsRegion: process.env.AWS_REGION || 'eu-west-1',
  enabled: process.env.BACKUP_ENABLED !== 'false'
};

// Ensure backup directory exists
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

// Logger
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`),
  success: (msg) => console.log(`[${new Date().toISOString()}] SUCCESS: ${msg}`)
};

/**
 * Create a backup of the MongoDB database
 */
async function createBackup() {
  if (!config.enabled) {
    log.info('Backup is disabled. Set BACKUP_ENABLED=true to enable.');
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `tradeai-backup-${timestamp}`;
  const backupPath = path.join(config.backupDir, backupName);
  const archivePath = `${backupPath}.gz`;

  log.info(`Starting backup to ${backupPath}...`);

  try {
    // Parse MongoDB URI to get database name
    const dbName = config.mongoUri.split('/').pop().split('?')[0];
    
    // Create backup using mongodump
    const mongodumpCmd = `mongodump --uri="${config.mongoUri}" --out="${backupPath}" --gzip`;
    
    log.info('Running mongodump...');
    execSync(mongodumpCmd, { stdio: 'inherit' });

    // Create tar archive
    log.info('Creating compressed archive...');
    execSync(`tar -czf "${archivePath}" -C "${config.backupDir}" "${backupName}"`, { stdio: 'inherit' });

    // Remove uncompressed backup directory
    execSync(`rm -rf "${backupPath}"`, { stdio: 'inherit' });

    // Get backup size
    const stats = fs.statSync(archivePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    log.success(`Backup created: ${archivePath} (${sizeMB} MB)`);

    // Upload to S3 if configured
    if (config.s3Bucket) {
      await uploadToS3(archivePath, backupName);
    }

    // Write backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      filename: `${backupName}.gz`,
      size: stats.size,
      database: dbName,
      mongoUri: config.mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Redact credentials
    };
    
    fs.writeFileSync(
      path.join(config.backupDir, `${backupName}.json`),
      JSON.stringify(metadata, null, 2)
    );

    return archivePath;

  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    // Cleanup partial backup
    if (fs.existsSync(backupPath)) {
      execSync(`rm -rf "${backupPath}"`, { stdio: 'inherit' });
    }
    throw error;
  }
}

/**
 * Restore database from a backup file
 */
async function restoreBackup(backupFile) {
  if (!backupFile) {
    log.error('Please specify a backup file to restore');
    listBackups();
    return;
  }

  const backupPath = path.isAbsolute(backupFile) 
    ? backupFile 
    : path.join(config.backupDir, backupFile);

  if (!fs.existsSync(backupPath)) {
    log.error(`Backup file not found: ${backupPath}`);
    return;
  }

  log.info(`Starting restore from ${backupPath}...`);
  log.info('WARNING: This will overwrite existing data!');

  try {
    // Extract backup
    const tempDir = path.join(config.backupDir, 'temp-restore');
    if (fs.existsSync(tempDir)) {
      execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    log.info('Extracting backup archive...');
    execSync(`tar -xzf "${backupPath}" -C "${tempDir}"`, { stdio: 'inherit' });

    // Find the extracted backup directory
    const extractedDirs = fs.readdirSync(tempDir);
    if (extractedDirs.length === 0) {
      throw new Error('No backup data found in archive');
    }

    const backupDataDir = path.join(tempDir, extractedDirs[0]);

    // Restore using mongorestore
    log.info('Running mongorestore...');
    const mongorestoreCmd = `mongorestore --uri="${config.mongoUri}" --drop --gzip "${backupDataDir}"`;
    execSync(mongorestoreCmd, { stdio: 'inherit' });

    // Cleanup temp directory
    execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' });

    log.success('Database restored successfully!');

  } catch (error) {
    log.error(`Restore failed: ${error.message}`);
    throw error;
  }
}

/**
 * List available backups
 */
function listBackups() {
  log.info('Available backups:');
  
  const files = fs.readdirSync(config.backupDir)
    .filter(f => f.endsWith('.gz'))
    .sort()
    .reverse();

  if (files.length === 0) {
    log.info('No backups found.');
    return [];
  }

  files.forEach((file, index) => {
    const filePath = path.join(config.backupDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toISOString();
    console.log(`  ${index + 1}. ${file} (${sizeMB} MB) - ${date}`);
  });

  return files;
}

/**
 * Cleanup old backups based on retention policy
 */
function cleanupBackups() {
  log.info(`Cleaning up backups older than ${config.retentionDays} days...`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  const files = fs.readdirSync(config.backupDir);
  let deletedCount = 0;

  files.forEach(file => {
    const filePath = path.join(config.backupDir, file);
    const stats = fs.statSync(filePath);

    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      log.info(`Deleted: ${file}`);
      deletedCount++;
    }
  });

  log.success(`Cleanup complete. Deleted ${deletedCount} old backup(s).`);
}

/**
 * Upload backup to S3
 */
async function uploadToS3(filePath, backupName) {
  if (!config.s3Bucket) {
    log.info('S3 bucket not configured, skipping upload.');
    return;
  }

  log.info(`Uploading to S3 bucket: ${config.s3Bucket}...`);

  try {
    const s3Key = `backups/${backupName}.gz`;
    const awsCmd = `aws s3 cp "${filePath}" "s3://${config.s3Bucket}/${s3Key}" --region ${config.awsRegion}`;
    execSync(awsCmd, { stdio: 'inherit' });
    log.success(`Uploaded to S3: s3://${config.s3Bucket}/${s3Key}`);
  } catch (error) {
    log.error(`S3 upload failed: ${error.message}`);
    log.info('Backup is still available locally.');
  }
}

/**
 * Verify backup integrity
 */
function verifyBackup(backupFile) {
  const backupPath = path.isAbsolute(backupFile) 
    ? backupFile 
    : path.join(config.backupDir, backupFile);

  if (!fs.existsSync(backupPath)) {
    log.error(`Backup file not found: ${backupPath}`);
    return false;
  }

  log.info(`Verifying backup: ${backupPath}...`);

  try {
    // Test archive integrity
    execSync(`gzip -t "${backupPath}"`, { stdio: 'inherit' });
    log.success('Backup archive is valid.');
    return true;
  } catch (error) {
    log.error(`Backup verification failed: ${error.message}`);
    return false;
  }
}

// Main execution
const command = process.argv[2] || 'backup';
const arg = process.argv[3];

(async () => {
  try {
    switch (command) {
      case 'backup':
        await createBackup();
        break;
      case 'restore':
        await restoreBackup(arg);
        break;
      case 'list':
        listBackups();
        break;
      case 'cleanup':
        cleanupBackups();
        break;
      case 'verify':
        verifyBackup(arg);
        break;
      default:
        console.log(`
MongoDB Backup Script for Trade AI Platform

Usage:
  node scripts/backup-mongodb.js backup              Create a new backup
  node scripts/backup-mongodb.js restore <file>      Restore from backup
  node scripts/backup-mongodb.js list                List available backups
  node scripts/backup-mongodb.js cleanup             Remove old backups
  node scripts/backup-mongodb.js verify <file>       Verify backup integrity

Environment Variables:
  MONGODB_URI              MongoDB connection string
  BACKUP_DIR               Directory to store backups (default: ./backups)
  BACKUP_RETENTION_DAYS    Days to keep backups (default: 30)
  BACKUP_S3_BUCKET         S3 bucket for offsite backup (optional)
  AWS_REGION               AWS region (default: eu-west-1)
  BACKUP_ENABLED           Enable/disable backups (default: true)
        `);
    }
  } catch (error) {
    process.exit(1);
  }
})();
