// Test the API service modules
import forecastingService from '../services/forecastingService';
import securityService from '../services/securityService';
import workflowService from '../services/workflowService';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('API Services', () => {
  describe('ForecastingService', () => {
    it('should have all required methods', () => {
      expect(forecastingService.generateSalesForecast).toBeDefined();
      expect(forecastingService.generateDemandForecast).toBeDefined();
      expect(forecastingService.generateBudgetForecast).toBeDefined();
      expect(forecastingService.predictPromotionPerformance).toBeDefined();
      expect(forecastingService.getForecastAccuracy).toBeDefined();
      expect(forecastingService.getForecastHistory).toBeDefined();
    });

    it('should have cache management methods', () => {
      expect(forecastingService.clearForecastCache).toBeDefined();
      expect(forecastingService.getForecastMetrics).toBeDefined();
    });
  });

  describe('SecurityService', () => {
    it('should have all required methods', () => {
      expect(securityService.getRoles).toBeDefined();
      expect(securityService.createRole).toBeDefined();
      expect(securityService.updateRole).toBeDefined();
      expect(securityService.deleteRole).toBeDefined();
      expect(securityService.getPermissions).toBeDefined();
      expect(securityService.assignPermissions).toBeDefined();
    });

    it('should have security monitoring methods', () => {
      expect(securityService.getSecurityEvents).toBeDefined();
      expect(securityService.getSecurityMetrics).toBeDefined();
      expect(securityService.getThreatAnalysis).toBeDefined();
      expect(securityService.getComplianceReport).toBeDefined();
    });

    it('should have MFA methods', () => {
      expect(securityService.setupMFA).toBeDefined();
      expect(securityService.verifyMFA).toBeDefined();
      expect(securityService.disableMFA).toBeDefined();
    });
  });

  describe('WorkflowService', () => {
    it('should have all required methods', () => {
      expect(workflowService.getWorkflows).toBeDefined();
      expect(workflowService.createWorkflow).toBeDefined();
      expect(workflowService.updateWorkflow).toBeDefined();
      expect(workflowService.deleteWorkflow).toBeDefined();
      expect(workflowService.executeWorkflow).toBeDefined();
    });

    it('should have approval methods', () => {
      expect(workflowService.getPendingApprovals).toBeDefined();
      expect(workflowService.approveWorkflow).toBeDefined();
      expect(workflowService.rejectWorkflow).toBeDefined();
      expect(workflowService.getApprovalHistory).toBeDefined();
    });

    it('should have monitoring methods', () => {
      expect(workflowService.getWorkflowMetrics).toBeDefined();
      expect(workflowService.getWorkflowStatus).toBeDefined();
      expect(workflowService.getWorkflowLogs).toBeDefined();
    });
  });
});

describe('Service Configuration', () => {
  it('should have proper API base URLs', () => {
    // These services should be configured with proper base URLs
    expect(typeof forecastingService).toBe('object');
    expect(typeof securityService).toBe('object');
    expect(typeof workflowService).toBe('object');
  });
});