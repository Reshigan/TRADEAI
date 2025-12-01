import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

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

  const steps = ['Download App', 'Scan QR Code', 'Verify Code'];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
      p: 3
    }}>
      <Paper elevation={3} sx={{ 
        maxWidth: 600, 
        width: '100%', 
        p: 4, 
        borderRadius: 3 
      }}>
        {step === 1 && (
          <>
            <Typography variant="h4" fontWeight={700} mb={1} textAlign="center">
              Set Up Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4} textAlign="center">
              Add an extra layer of security to your account
            </Typography>

            <Stepper activeStep={0} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={1}>
                1. Download an authenticator app
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                We recommend Google Authenticator, Authy, or Microsoft Authenticator
              </Typography>

              <Typography variant="h6" fontWeight={600} mb={1}>
                2. Scan this QR code
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress />
                </Box>
              ) : qrCode ? (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box 
                    component="img" 
                    src={qrCode} 
                    alt="2FA QR Code"
                    sx={{ 
                      maxWidth: 200, 
                      height: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      mb: 2
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Can't scan? Manual key:
                  </Typography>
                  <Chip 
                    label={secret} 
                    sx={{ mt: 1, fontFamily: 'monospace' }}
                  />
                </Box>
              ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                  Failed to load QR code
                </Alert>
              )}

              <Typography variant="h6" fontWeight={600} mb={1}>
                3. Enter the 6-digit code
              </Typography>
              <TextField
                fullWidth
                type="text"
                inputProps={{ maxLength: 6 }}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                sx={{ mb: 2 }}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </Box>
          </>
        )}

        {step === 2 && (
          <>
            <Box textAlign="center" mb={3}>
              <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" fontWeight={700} mb={1}>
                Two-Factor Authentication Enabled!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your account is now more secure
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                ⚠️ Save Your Backup Codes
              </Typography>
              <Typography variant="body2">
                These codes can be used to access your account if you lose your authenticator device.
                Each code can only be used once.
              </Typography>
            </Alert>

            <Paper elevation={0} sx={{ 
              p: 3, 
              mb: 3, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                {backupCodes.map((code, index) => (
                  <Chip 
                    key={index} 
                    label={code}
                    sx={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      height: 'auto',
                      py: 1
                    }}
                  />
                ))}
              </Box>
            </Paper>

            <Box display="flex" gap={2} justifyContent="center" mb={3}>
              <Button 
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadBackupCodes}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Download Backup Codes
              </Button>
            </Box>

            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                onClick={complete}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Done
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TwoFASetup;
