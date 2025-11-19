import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TwoFASetup.css';

const TwoFASetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL || '/api'}/auth/2fa/generate`
      );
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL || '/api'}/auth/2fa/verify`,
        {
          token: verificationCode,
          secret: secret
        }
      );
      
      setBackupCodes(response.data.backupCodes);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `TRADEAI - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes safe and secure.
Each code can be used once if you lose access to your authenticator app.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradeai-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const complete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="twofa-setup-container">
      <div className="twofa-card">
        {step === 1 && (
          <>
            <h1>Set Up Two-Factor Authentication</h1>
            <p className="subtitle">
              Add an extra layer of security to your account
            </p>

            <div className="setup-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Download an authenticator app</h3>
                  <p>We recommend Google Authenticator, Authy, or Microsoft Authenticator</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Scan this QR code</h3>
                  {loading ? (
                    <p>Loading QR code...</p>
                  ) : qrCode ? (
                    <div className="qr-code-wrapper">
                      <img src={qrCode} alt="2FA QR Code" />
                      <p className="manual-entry">
                        Can't scan? Manual key: <code>{secret}</code>
                      </p>
                    </div>
                  ) : (
                    <p className="error">Failed to load QR code</p>
                  )}
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Enter the 6-digit code</h3>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="verification-input"
                  />
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="actions">
              <button onClick={() => navigate(-1)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="btn-primary"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="success-icon">✅</div>
            <h1>Two-Factor Authentication Enabled!</h1>
            <p className="subtitle">
              Your account is now more secure
            </p>

            <div className="backup-codes-section">
              <h3>⚠️ Save Your Backup Codes</h3>
              <p>
                These codes can be used to access your account if you lose your authenticator device.
                Each code can only be used once.
              </p>

              <div className="backup-codes">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    {code}
                  </div>
                ))}
              </div>

              <button onClick={downloadBackupCodes} className="btn-secondary download-btn">
                📥 Download Backup Codes
              </button>
            </div>

            <div className="actions">
              <button onClick={complete} className="btn-primary">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFASetup;
