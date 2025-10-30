// Custom Cypress Commands

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.wait('@login');
  cy.url().should('include', '/dashboard');
});

// Register command
Cypress.Commands.add('register', (userData) => {
  cy.visit('/register');
  cy.get('input[name="firstName"]').type(userData.firstName);
  cy.get('input[name="lastName"]').type(userData.lastName);
  cy.get('input[name="email"]').type(userData.email);
  cy.get('input[name="organization"]').type(userData.organization);
  cy.get('input[name="password"]').type(userData.password);
  cy.get('input[name="confirmPassword"]').type(userData.password);
  cy.get('button[type="submit"]').click();
  cy.wait('@register');
  cy.url().should('include', '/dashboard');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.contains('Logout').click();
  cy.wait('@logout');
  cy.url().should('include', '/login');
});

// Create test user and login
Cypress.Commands.add('loginAsTestUser', () => {
  const userData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    organization: 'Test Org',
    password: 'Password123!'
  };
  
  cy.register(userData);
});

// Check if authenticated
Cypress.Commands.add('isAuthenticated', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken');
    expect(token).to.exist;
  });
});

// Clear auth
Cypress.Commands.add('clearAuth', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
