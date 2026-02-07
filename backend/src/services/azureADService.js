/**
 * Azure AD Integration Service
 * Provides real connection to Microsoft Graph API for user and group sync
 */

const axios = require('axios');
const logger = require('../utils/logger');

class AzureADService {
  constructor(config) {
    this.tenantId = config.tenantId;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth2 access token from Azure AD
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      this.accessToken = response.data.access_token;
      // Token expires in seconds, convert to ms and subtract 5 min buffer
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000;

      return this.accessToken;
    } catch (error) {
      logger.error('Azure AD token acquisition failed', {
        error: error.message,
        tenantId: this.tenantId,
        status: error.response?.status
      });
      throw new Error(`Azure AD authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Test connection to Azure AD
   */
  async testConnection() {
    try {
      const token = await this.getAccessToken();

      // Try to get organization info to verify connection
      const response = await axios.get('https://graph.microsoft.com/v1.0/organization', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000
      });

      return {
        success: true,
        status: 'connected',
        organization: response.data.value?.[0]?.displayName || 'Unknown',
        tenantId: response.data.value?.[0]?.id
      };
    } catch (error) {
      logger.error('Azure AD connection test failed', {
        error: error.message,
        status: error.response?.status
      });

      return {
        success: false,
        status: 'error',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Fetch all users from Azure AD
   * @param {Object} options - Pagination and filter options
   */
  async getUsers(options = {}) {
    const { pageSize = 100, filter = null, select = null } = options;

    try {
      const token = await this.getAccessToken();

      let url = `https://graph.microsoft.com/v1.0/users?$top=${pageSize}`;

      // Default fields to retrieve
      const defaultSelect = 'id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones,employeeId,accountEnabled';
      url += `&$select=${select || defaultSelect}`;

      if (filter) {
        url += `&$filter=${encodeURIComponent(filter)}`;
      }

      const allUsers = [];
      let nextLink = url;

      while (nextLink) {
        const response = await axios.get(nextLink, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ConsistencyLevel': 'eventual'
          },
          timeout: 60000
        });

        allUsers.push(...response.data.value);
        nextLink = response.data['@odata.nextLink'] || null;

        // Safety limit to prevent infinite loops
        if (allUsers.length > 10000) {
          logger.warn('Azure AD user fetch hit safety limit of 10000 users');
          break;
        }
      }

      return {
        success: true,
        users: allUsers,
        count: allUsers.length
      };
    } catch (error) {
      logger.error('Azure AD user fetch failed', {
        error: error.message,
        status: error.response?.status
      });

      throw new Error(`Failed to fetch users: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Fetch all groups/departments from Azure AD
   * @param {Object} options - Pagination and filter options
   */
  async getGroups(options = {}) {
    const { pageSize = 100, filter = null } = options;

    try {
      const token = await this.getAccessToken();

      let url = `https://graph.microsoft.com/v1.0/groups?$top=${pageSize}`;
      url += '&$select=id,displayName,description,mail,mailEnabled,securityEnabled,groupTypes';

      if (filter) {
        url += `&$filter=${encodeURIComponent(filter)}`;
      }

      const allGroups = [];
      let nextLink = url;

      while (nextLink) {
        const response = await axios.get(nextLink, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ConsistencyLevel': 'eventual'
          },
          timeout: 60000
        });

        allGroups.push(...response.data.value);
        nextLink = response.data['@odata.nextLink'] || null;

        if (allGroups.length > 5000) {
          logger.warn('Azure AD group fetch hit safety limit of 5000 groups');
          break;
        }
      }

      return {
        success: true,
        groups: allGroups,
        count: allGroups.length
      };
    } catch (error) {
      logger.error('Azure AD group fetch failed', {
        error: error.message,
        status: error.response?.status
      });

      throw new Error(`Failed to fetch groups: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get members of a specific group
   * @param {string} groupId - Azure AD group ID
   */
  async getGroupMembers(groupId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,mail,userPrincipalName`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        members: response.data.value,
        count: response.data.value.length
      };
    } catch (error) {
      logger.error('Azure AD group members fetch failed', {
        error: error.message,
        groupId
      });

      throw new Error(`Failed to fetch group members: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get user's manager
   * @param {string} userId - Azure AD user ID
   */
  async getUserManager(userId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/users/${userId}/manager?$select=id,displayName,mail,userPrincipalName`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        manager: response.data
      };
    } catch (error) {
      // 404 means no manager assigned, which is valid
      if (error.response?.status === 404) {
        return { success: true, manager: null };
      }

      logger.error('Azure AD manager fetch failed', {
        error: error.message,
        userId
      });

      return { success: false, manager: null, error: error.message };
    }
  }

  /**
   * Get user's direct reports
   * @param {string} userId - Azure AD user ID
   */
  async getUserDirectReports(userId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/users/${userId}/directReports?$select=id,displayName,mail,userPrincipalName,jobTitle`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        directReports: response.data.value,
        count: response.data.value.length
      };
    } catch (error) {
      logger.error('Azure AD direct reports fetch failed', {
        error: error.message,
        userId
      });

      return { success: false, directReports: [], error: error.message };
    }
  }

  /**
   * Transform Azure AD user to Employee format
   * @param {Object} azureUser - Azure AD user object
   */
  transformUserToEmployee(azureUser) {
    return {
      azureAdId: azureUser.id,
      email: azureUser.mail || azureUser.userPrincipalName,
      firstName: azureUser.givenName || azureUser.displayName?.split(' ')[0] || '',
      lastName: azureUser.surname || azureUser.displayName?.split(' ').slice(1).join(' ') || '',
      displayName: azureUser.displayName,
      jobTitle: azureUser.jobTitle || '',
      departmentName: azureUser.department || '',
      officeLocation: azureUser.officeLocation || '',
      phone: azureUser.mobilePhone || azureUser.businessPhones?.[0] || '',
      employeeId: azureUser.employeeId || `AAD-${azureUser.id.substring(0, 8)}`,
      status: azureUser.accountEnabled ? 'active' : 'inactive',
      source: 'azure_ad',
      lastSyncedAt: new Date(),
      syncStatus: 'synced'
    };
  }

  /**
   * Transform Azure AD group to Department format
   * @param {Object} azureGroup - Azure AD group object
   */
  transformGroupToDepartment(azureGroup) {
    return {
      azureAdId: azureGroup.id,
      name: azureGroup.displayName,
      code: azureGroup.displayName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10),
      description: azureGroup.description || '',
      email: azureGroup.mail || '',
      source: 'azure_ad',
      lastSyncedAt: new Date(),
      status: 'active'
    };
  }
}

module.exports = AzureADService;
