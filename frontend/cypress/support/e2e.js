// Cypress E2E Support File

// Import commands
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// Before each test
beforeEach(() => {
  // Set viewport
  cy.viewport(1280, 720);
  
  // Intercept API calls
  cy.intercept('POST', '**/api/auth-enhanced/register').as('register');
  cy.intercept('POST', '**/api/auth-enhanced/login').as('login');
  cy.intercept('POST', '**/api/auth-enhanced/logout').as('logout');
  cy.intercept('GET', '**/api/promotions*').as('getPromotions');
  cy.intercept('GET', '**/api/campaigns*').as('getCampaigns');
  cy.intercept('GET', '**/api/customers*').as('getCustomers');
  cy.intercept('GET', '**/api/products*').as('getProducts');
  cy.intercept('GET', '**/api/vendors*').as('getVendors');
});
