const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AzureADConfig = require('../models/AzureADConfig');
const User = require('../models/User');
const Company = require('../models/Company');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const stateStore = new Map();

router.get('/azure/login', async (req, res) => {
  try {
    // eslint-disable-next-line camelcase
    const { company_code: companyCode } = req.query;

    if (!companyCode) {
      return res.status(400).json({
        success: false,
        error: 'Company code is required'
      });
    }

    const company = await Company.findOne({ code: companyCode.toUpperCase() });
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const config = await AzureADConfig.findOne({ companyId: company._id });
    if (!config || !config.sso?.enabled) {
      return res.status(400).json({
        success: false,
        error: 'SSO is not enabled for this company'
      });
    }

    if (!config.tenantId || !config.clientId) {
      return res.status(400).json({
        success: false,
        error: 'Azure AD is not properly configured'
      });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    stateStore.set(state, {
      companyId: company._id.toString(),
      tenantId: config.tenantId,
      nonce,
      createdAt: Date.now()
    });

    setTimeout(() => stateStore.delete(state), 10 * 60 * 1000);

    const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/sso/azure/callback`;

    const authUrl = new URL(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('response_mode', 'query');

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('SSO login error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=sso_error&message=${encodeURIComponent(error.message)}`);
  }
});

router.get('/azure/callback', async (req, res) => {
  try {
    // eslint-disable-next-line camelcase
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      console.error('Azure AD error:', error, errorDescription);
      return res.redirect(
        `${FRONTEND_URL}/login?error=azure_error&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_response&message=Missing code or state`);
    }

    const stateData = stateStore.get(state);
    if (!stateData) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_state&message=Invalid or expired state`);
    }

    stateStore.delete(state);

    const company = await Company.findById(stateData.companyId);
    if (!company) {
      return res.redirect(`${FRONTEND_URL}/login?error=company_not_found`);
    }

    const config = await AzureADConfig.findOne({ companyId: company._id });
    if (!config) {
      return res.redirect(`${FRONTEND_URL}/login?error=config_not_found`);
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/sso/azure/callback`;

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid profile email'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      const errorMsg = errorData.error_description || 'Token exchange failed';
      return res.redirect(
        `${FRONTEND_URL}/login?error=token_error&message=${encodeURIComponent(errorMsg)}`
      );
    }

    const tokens = await tokenResponse.json();

    const idTokenParts = tokens.id_token.split('.');
    const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString());

    const email = payload.email || payload.preferred_username || payload.upn;
    const firstName = payload.given_name || payload.name?.split(' ')[0] || '';
    const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_email&message=No email found in Azure AD response`);
    }

    let user = await User.findOne({
      email: email.toLowerCase(),
      companyId: company._id
    });

    if (!user && config.autoProvisioning?.enabled) {
      user = new User({
        email: email.toLowerCase(),
        firstName,
        lastName,
        companyId: company._id,
        tenantId: company.tenantId || company._id,
        role: config.autoProvisioning.defaultRole || 'user',
        department: config.autoProvisioning.defaultDepartment || 'sales',
        isActive: true,
        ssoProvider: 'azure_ad',
        ssoId: payload.oid || payload.sub,
        password: crypto.randomBytes(32).toString('hex')
      });
      await user.save();
    }

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=user_not_found&message=User not found and auto-provisioning is disabled`);
    }

    if (!user.isActive) {
      return res.redirect(`${FRONTEND_URL}/login?error=user_inactive&message=User account is inactive`);
    }

    if (!user.ssoId) {
      user.ssoProvider = 'azure_ad';
      user.ssoId = payload.oid || payload.sub;
      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        tenantId: user.tenantId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.redirect(`${FRONTEND_URL}/sso-callback?token=${token}`);
  } catch (error) {
    console.error('SSO callback error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=callback_error&message=${encodeURIComponent(error.message)}`);
  }
});

router.get('/config/:companyCode', async (req, res) => {
  try {
    const company = await Company.findOne({ code: req.params.companyCode.toUpperCase() });
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const config = await AzureADConfig.findOne({ companyId: company._id });

    res.json({
      success: true,
      data: {
        ssoEnabled: config?.sso?.enabled || false,
        allowPasswordLogin: config?.sso?.allowPasswordLogin !== false,
        forceSSO: config?.sso?.forceSSO || false,
        provider: config?.sso?.enabled ? 'azure_ad' : null
      }
    });
  } catch (error) {
    console.error('Error fetching SSO config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    // eslint-disable-next-line camelcase
    const { company_code: companyCode } = req.body;

    if (!companyCode) {
      return res.json({
        success: true,
        logoutUrl: `${FRONTEND_URL}/login`
      });
    }

    const company = await Company.findOne({ code: companyCode.toUpperCase() });
    if (!company) {
      return res.json({
        success: true,
        logoutUrl: `${FRONTEND_URL}/login`
      });
    }

    const config = await AzureADConfig.findOne({ companyId: company._id });
    if (!config || !config.sso?.enabled) {
      return res.json({
        success: true,
        logoutUrl: `${FRONTEND_URL}/login`
      });
    }

    const logoutUrl = new URL(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/logout`);
    logoutUrl.searchParams.set('post_logout_redirect_uri', `${FRONTEND_URL}/login`);

    res.json({
      success: true,
      logoutUrl: logoutUrl.toString()
    });
  } catch (error) {
    console.error('SSO logout error:', error);
    res.json({
      success: true,
      logoutUrl: `${FRONTEND_URL}/login`
    });
  }
});

module.exports = router;
