describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Registration', () => {
    it('should register a new user successfully', () => {
      cy.visit('/register');
      
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(`test${Date.now()}@example.com`);
      cy.get('input[name="organization"]').type('Test Org');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
      });
    });

    it('should show error for existing email', () => {
      const email = 'existing@example.com';
      
      cy.visit('/register');
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="organization"]').type('Test Org');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('button[type="submit"]').click();
      
      cy.clearLocalStorage();
      cy.visit('/register');
      
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="organization"]').type('Test Org');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('button[type="submit"]').click();
      
      cy.contains('already registered').should('be.visible');
    });

    it('should validate password requirements', () => {
      cy.visit('/register');
      
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('weak');
      cy.get('input[name="confirmPassword"]').type('weak');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/password/i).should('be.visible');
    });
  });

  describe('Login', () => {
    beforeEach(() => {
      const uniqueEmail = `testuser${Date.now()}@example.com`;
      cy.visit('/register');
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(uniqueEmail);
      cy.get('input[name="organization"]').type('Test Org');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
      
      cy.clearLocalStorage();
      cy.visit('/login');
    });

    it('should login with valid credentials', () => {
      cy.get('input[name="email"]').type(Cypress.env('testEmail') || 'testuser@example.com');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist;
      });
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('WrongPassword!');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/invalid/i).should('be.visible');
      cy.url().should('include', '/login');
    });

    it('should require email and password', () => {
      cy.get('button[type="submit"]').click();
      
      cy.get('input[name="email"]:invalid').should('exist');
      cy.get('input[name="password"]:invalid').should('exist');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      const uniqueEmail = `authuser${Date.now()}@example.com`;
      
      cy.visit('/register');
      cy.get('input[name="firstName"]').type('Auth');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(uniqueEmail);
      cy.get('input[name="organization"]').type('Test Org');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.visit('/promotions');
      cy.url().should('include', '/promotions');
      cy.visit('/campaigns');
      cy.url().should('include', '/campaigns');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      const uniqueEmail = `logoutuser${Date.now()}@example.com`;
      
      cy.visit('/register');
      cy.get('input[name="firstName"]').type('Logout');
      cy.get('input[name="lastName"]').type('Test');
      cy.get('input[name="email"]').type(uniqueEmail);
      cy.get('input[name="organization"]').type('Test Org');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
    });

    it('should logout successfully', () => {
      cy.contains('Logout').click();
      
      cy.url().should('include', '/login');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null;
      });
    });

    it('should not access protected routes after logout', () => {
      cy.contains('Logout').click();
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
});
