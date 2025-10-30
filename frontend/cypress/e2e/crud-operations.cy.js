describe('CRUD Operations', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    const uniqueEmail = `cruduser${Date.now()}@example.com`;
    cy.visit('/register');
    cy.get('input[name="firstName"]').type('CRUD');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="organization"]').type('Test Org');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Promotions', () => {
    it('should view promotions list', () => {
      cy.visit('/promotions');
      cy.url().should('include', '/promotions');
      cy.contains('Promotions').should('be.visible');
    });

    it('should search promotions', () => {
      cy.visit('/promotions');
      cy.get('input[placeholder*="Search"]').type('test');
      cy.get('input[placeholder*="Search"]').should('have.value', 'test');
    });

    it('should filter promotions by status', () => {
      cy.visit('/promotions');
      cy.get('select').first().select('active');
      cy.get('select').first().should('have.value', 'active');
    });
  });

  describe('Campaigns', () => {
    it('should view campaigns list', () => {
      cy.visit('/campaigns');
      cy.url().should('include', '/campaigns');
      cy.contains('Campaigns').should('be.visible');
    });

    it('should have working search', () => {
      cy.visit('/campaigns');
      cy.get('input[placeholder*="Search"]').should('exist');
    });
  });

  describe('Customers', () => {
    it('should view customers list', () => {
      cy.visit('/customers');
      cy.url().should('include', '/customers');
      cy.contains('Customers').should('be.visible');
    });

    it('should display customer data', () => {
      cy.visit('/customers');
      cy.get('table, .customer-card, .list-item').should('exist');
    });
  });

  describe('Products', () => {
    it('should view products list', () => {
      cy.visit('/products');
      cy.url().should('include', '/products');
      cy.contains('Products').should('be.visible');
    });

    it('should have pagination controls', () => {
      cy.visit('/products');
      cy.contains(/page|showing|of/i).should('exist');
    });
  });

  describe('Vendors', () => {
    it('should view vendors list', () => {
      cy.visit('/vendors');
      cy.url().should('include', '/vendors');
      cy.contains('Vendors').should('be.visible');
    });
  });
});

describe('Navigation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    const uniqueEmail = `navuser${Date.now()}@example.com`;
    cy.visit('/register');
    cy.get('input[name="firstName"]').type('Nav');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="organization"]').type('Test Org');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should navigate using sidebar', () => {
    cy.get('nav, aside, .sidebar').within(() => {
      cy.contains('Promotions').click();
    });
    cy.url().should('include', '/promotions');
    
    cy.get('nav, aside, .sidebar').within(() => {
      cy.contains('Campaigns').click();
    });
    cy.url().should('include', '/campaigns');
  });

  it('should navigate to all main sections', () => {
    const sections = [
      '/dashboard',
      '/activities',
      '/promotions',
      '/campaigns',
      '/customers',
      '/products',
      '/vendors',
      '/reports'
    ];

    sections.forEach((path) => {
      cy.visit(path);
      cy.url().should('include', path);
    });
  });
});
