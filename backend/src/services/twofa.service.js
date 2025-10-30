const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFAService {
  /**
   * Generate a new 2FA secret for a user
   * @param {string} userEmail - User's email
   * @returns {Object} Secret and QR code data URL
   */
  async generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `TRADEAI (${userEmail})`,
      issuer: 'TRADEAI',
      length: 32
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Verify a TOTP token
   * @param {string} secret - User's 2FA secret
   * @param {string} token - Token to verify
   * @returns {boolean} Verification result
   */
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before and after
    });
  }

  /**
   * Generate backup codes for recovery
   * @returns {Array<string>} Array of backup codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify a backup code
   * @param {Array<string>} backupCodes - User's backup codes
   * @param {string} code - Code to verify
   * @returns {Object} Verification result and updated codes
   */
  verifyBackupCode(backupCodes, code) {
    const index = backupCodes.indexOf(code.toUpperCase());
    if (index === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }

    // Remove used code
    const updatedCodes = [...backupCodes];
    updatedCodes.splice(index, 1);

    return { valid: true, remainingCodes: updatedCodes };
  }
}

module.exports = new TwoFAService();
