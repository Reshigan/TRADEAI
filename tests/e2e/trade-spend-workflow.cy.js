// TRADEAI v2.0 - Trade Spend Workflow E2E Tests for 100% Coverage

describe('Trade Spend Workflow', () => {
  beforeEach(() => {
    // Clean and seed database
    cy.task('cleanDatabase');
    cy.task('seedDatabase');
    
    // Login as admin user
    cy.login('admin');
    
    // Visit dashboard
    cy.visit('/dashboard');
    cy.wait(2000);
  });

  describe('Trade Spend Creation', () => {
    it('should create a new trade spend successfully', () => {
      // Navigate to trade spends
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.url().should('include', '/trade-spends');
      
      // Click create button
      cy.get('[data-testid="create-trade-spend-btn"]').click();
      cy.url().should('include', '/trade-spends/create');
      
      // Fill form
      cy.get('[data-testid="customer-select"]').click();
      cy.get('[data-testid="customer-option-0"]').click();
      
      cy.get('[data-testid="product-select"]').click();
      cy.get('[data-testid="product-option-0"]').click();
      
      cy.get('[data-testid="amount-input"]').type('50000');
      
      cy.get('[data-testid="currency-select"]').should('have.value', 'USD');
      
      cy.get('[data-testid="type-select"]').click();
      cy.get('[data-testid="type-option-promotion"]').click();
      
      cy.get('[data-testid="description-input"]').type('Summer promotion campaign for Product A');
      
      cy.get('[data-testid="start-date-input"]').type('2024-06-01');
      cy.get('[data-testid="end-date-input"]').type('2024-08-31');
      
      cy.get('[data-testid="category-select"]').click();
      cy.get('[data-testid="category-option-trade-marketing"]').click();
      
      // Submit form
      cy.get('[data-testid="submit-trade-spend-btn"]').click();
      
      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Trade spend created successfully');
      cy.url().should('include', '/trade-spends');
      
      // Verify in list
      cy.get('[data-testid="trade-spend-list"]').should('contain', 'Summer promotion campaign');
      cy.get('[data-testid="trade-spend-amount"]').should('contain', '$50,000');
      cy.get('[data-testid="trade-spend-status"]').should('contain', 'Draft');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="create-trade-spend-btn"]').click();
      
      // Try to submit without filling required fields
      cy.get('[data-testid="submit-trade-spend-btn"]').click();
      
      // Verify validation errors
      cy.get('[data-testid="customer-error"]').should('contain', 'Customer is required');
      cy.get('[data-testid="product-error"]').should('contain', 'Product is required');
      cy.get('[data-testid="amount-error"]').should('contain', 'Amount is required');
      cy.get('[data-testid="description-error"]').should('contain', 'Description is required');
    });

    it('should validate amount is positive', () => {
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="create-trade-spend-btn"]').click();
      
      // Enter negative amount
      cy.get('[data-testid="amount-input"]').type('-1000');
      cy.get('[data-testid="submit-trade-spend-btn"]').click();
      
      cy.get('[data-testid="amount-error"]').should('contain', 'Amount must be positive');
    });

    it('should validate date range', () => {
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="create-trade-spend-btn"]').click();
      
      // Set end date before start date
      cy.get('[data-testid="start-date-input"]').type('2024-08-31');
      cy.get('[data-testid="end-date-input"]').type('2024-06-01');
      cy.get('[data-testid="submit-trade-spend-btn"]').click();
      
      cy.get('[data-testid="date-range-error"]').should('contain', 'End date must be after start date');
    });

    it('should auto-save draft', () => {
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="create-trade-spend-btn"]').click();
      
      // Fill partial form
      cy.get('[data-testid="description-input"]').type('Auto-save test');
      
      // Wait for auto-save
      cy.wait(3000);
      
      // Verify auto-save indicator
      cy.get('[data-testid="auto-save-indicator"]').should('contain', 'Draft saved');
      
      // Navigate away and back
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="drafts-tab"]').click();
      
      // Verify draft exists
      cy.get('[data-testid="draft-list"]').should('contain', 'Auto-save test');
    });
  });

  describe('Trade Spend Editing', () => {
    it('should edit existing trade spend', () => {
      // Create a trade spend first
      cy.createTradeSpend({
        amount: 30000,
        description: 'Original description',
        status: 'draft'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Click edit on first trade spend
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="edit-btn"]').click();
      });
      
      // Update fields
      cy.get('[data-testid="amount-input"]').clear().type('35000');
      cy.get('[data-testid="description-input"]').clear().type('Updated description');
      
      // Save changes
      cy.get('[data-testid="save-trade-spend-btn"]').click();
      
      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Trade spend updated successfully');
      
      // Verify changes in list
      cy.get('[data-testid="trade-spend-amount"]').should('contain', '$35,000');
      cy.get('[data-testid="trade-spend-description"]').should('contain', 'Updated description');
    });

    it('should not allow editing approved trade spend', () => {
      cy.createTradeSpend({
        amount: 30000,
        description: 'Approved trade spend',
        status: 'approved'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Edit button should be disabled for approved trade spend
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="edit-btn"]').should('be.disabled');
      });
    });

    it('should track edit history', () => {
      cy.createTradeSpend({
        amount: 30000,
        description: 'Original description',
        status: 'draft'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Edit trade spend
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="edit-btn"]').click();
      });
      
      cy.get('[data-testid="amount-input"]').clear().type('35000');
      cy.get('[data-testid="save-trade-spend-btn"]').click();
      
      // View history
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="history-btn"]').click();
      });
      
      // Verify history modal
      cy.get('[data-testid="history-modal"]').should('be.visible');
      cy.get('[data-testid="history-entry-0"]').should('contain', 'Amount changed from $30,000 to $35,000');
    });
  });

  describe('Trade Spend Approval Workflow', () => {
    it('should submit trade spend for approval', () => {
      cy.createTradeSpend({
        amount: 40000,
        description: 'Ready for approval',
        status: 'draft'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Submit for approval
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="submit-approval-btn"]').click();
      });
      
      // Confirm submission
      cy.get('[data-testid="confirm-submit-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-submit-btn"]').click();
      
      // Verify status change
      cy.get('[data-testid="success-message"]').should('contain', 'Submitted for approval');
      cy.get('[data-testid="trade-spend-status"]').should('contain', 'Pending');
    });

    it('should approve trade spend', () => {
      cy.createTradeSpend({
        amount: 40000,
        description: 'Pending approval',
        status: 'pending'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Approve trade spend
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="approve-btn"]').click();
      });
      
      // Add approval comments
      cy.get('[data-testid="approval-modal"]').should('be.visible');
      cy.get('[data-testid="approval-comments"]').type('Approved for Q2 campaign');
      cy.get('[data-testid="confirm-approve-btn"]').click();
      
      // Verify approval
      cy.get('[data-testid="success-message"]').should('contain', 'Trade spend approved');
      cy.get('[data-testid="trade-spend-status"]').should('contain', 'Approved');
      cy.get('[data-testid="approved-by"]').should('contain', 'Admin User');
    });

    it('should reject trade spend', () => {
      cy.createTradeSpend({
        amount: 40000,
        description: 'Pending approval',
        status: 'pending'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Reject trade spend
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="reject-btn"]').click();
      });
      
      // Add rejection reason
      cy.get('[data-testid="rejection-modal"]').should('be.visible');
      cy.get('[data-testid="rejection-reason"]').type('Budget exceeded for this quarter');
      cy.get('[data-testid="confirm-reject-btn"]').click();
      
      // Verify rejection
      cy.get('[data-testid="success-message"]').should('contain', 'Trade spend rejected');
      cy.get('[data-testid="trade-spend-status"]').should('contain', 'Rejected');
      cy.get('[data-testid="rejection-reason"]').should('contain', 'Budget exceeded');
    });

    it('should require approval comments for high-value trade spends', () => {
      cy.createTradeSpend({
        amount: 100000, // High value
        description: 'High value trade spend',
        status: 'pending'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Try to approve without comments
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="approve-btn"]').click();
      });
      
      cy.get('[data-testid="approval-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-approve-btn"]').click();
      
      // Should show validation error
      cy.get('[data-testid="comments-error"]').should('contain', 'Comments required for high-value approvals');
    });
  });

  describe('Trade Spend Filtering and Search', () => {
    beforeEach(() => {
      // Create multiple trade spends with different attributes
      cy.createTradeSpend({
        amount: 25000,
        description: 'Summer promotion',
        status: 'approved',
        type: 'promotion',
        customer: 'Customer A'
      });
      
      cy.createTradeSpend({
        amount: 15000,
        description: 'Winter discount',
        status: 'pending',
        type: 'discount',
        customer: 'Customer B'
      });
      
      cy.createTradeSpend({
        amount: 35000,
        description: 'Spring rebate',
        status: 'draft',
        type: 'rebate',
        customer: 'Customer A'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
    });

    it('should filter by status', () => {
      // Filter by approved status
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="status-approved"]').click();
      
      // Should show only approved trade spends
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 1);
      cy.get('[data-testid="trade-spend-status"]').should('contain', 'Approved');
    });

    it('should filter by type', () => {
      // Filter by promotion type
      cy.get('[data-testid="type-filter"]').click();
      cy.get('[data-testid="type-promotion"]').click();
      
      // Should show only promotion trade spends
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 1);
      cy.get('[data-testid="trade-spend-description"]').should('contain', 'Summer promotion');
    });

    it('should filter by customer', () => {
      // Filter by Customer A
      cy.get('[data-testid="customer-filter"]').click();
      cy.get('[data-testid="customer-a"]').click();
      
      // Should show only Customer A trade spends
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 2);
    });

    it('should search by description', () => {
      // Search for "summer"
      cy.get('[data-testid="search-input"]').type('summer');
      cy.get('[data-testid="search-btn"]').click();
      
      // Should show only matching trade spends
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 1);
      cy.get('[data-testid="trade-spend-description"]').should('contain', 'Summer promotion');
    });

    it('should combine multiple filters', () => {
      // Filter by Customer A and status approved
      cy.get('[data-testid="customer-filter"]').click();
      cy.get('[data-testid="customer-a"]').click();
      
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="status-approved"]').click();
      
      // Should show only approved trade spends for Customer A
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 1);
      cy.get('[data-testid="trade-spend-description"]').should('contain', 'Summer promotion');
    });

    it('should clear filters', () => {
      // Apply filters
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="status-approved"]').click();
      
      // Clear filters
      cy.get('[data-testid="clear-filters-btn"]').click();
      
      // Should show all trade spends
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 3);
    });
  });

  describe('Trade Spend Sorting', () => {
    beforeEach(() => {
      // Create trade spends with different amounts and dates
      cy.createTradeSpend({
        amount: 25000,
        description: 'Trade spend A',
        createdAt: '2024-01-15'
      });
      
      cy.createTradeSpend({
        amount: 15000,
        description: 'Trade spend B',
        createdAt: '2024-02-15'
      });
      
      cy.createTradeSpend({
        amount: 35000,
        description: 'Trade spend C',
        createdAt: '2024-01-30'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
    });

    it('should sort by amount ascending', () => {
      cy.get('[data-testid="sort-amount"]').click();
      
      // Verify ascending order
      cy.get('[data-testid="trade-spend-amount"]').first().should('contain', '$15,000');
      cy.get('[data-testid="trade-spend-amount"]').last().should('contain', '$35,000');
    });

    it('should sort by amount descending', () => {
      cy.get('[data-testid="sort-amount"]').click(); // First click for ascending
      cy.get('[data-testid="sort-amount"]').click(); // Second click for descending
      
      // Verify descending order
      cy.get('[data-testid="trade-spend-amount"]').first().should('contain', '$35,000');
      cy.get('[data-testid="trade-spend-amount"]').last().should('contain', '$15,000');
    });

    it('should sort by date', () => {
      cy.get('[data-testid="sort-date"]').click();
      
      // Verify date order (newest first by default)
      cy.get('[data-testid="trade-spend-row"]').first().should('contain', 'Trade spend B');
      cy.get('[data-testid="trade-spend-row"]').last().should('contain', 'Trade spend A');
    });
  });

  describe('Trade Spend Pagination', () => {
    beforeEach(() => {
      // Create 25 trade spends for pagination testing
      for (let i = 1; i <= 25; i++) {
        cy.createTradeSpend({
          amount: i * 1000,
          description: `Trade spend ${i}`,
          status: 'approved'
        });
      }
      
      cy.get('[data-testid="nav-trade-spends"]').click();
    });

    it('should paginate results', () => {
      // Should show first 10 items by default
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 10);
      
      // Verify pagination info
      cy.get('[data-testid="pagination-info"]').should('contain', 'Showing 1-10 of 25');
      
      // Go to next page
      cy.get('[data-testid="next-page-btn"]').click();
      
      // Should show next 10 items
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 10);
      cy.get('[data-testid="pagination-info"]').should('contain', 'Showing 11-20 of 25');
      
      // Go to last page
      cy.get('[data-testid="last-page-btn"]').click();
      
      // Should show remaining 5 items
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 5);
      cy.get('[data-testid="pagination-info"]').should('contain', 'Showing 21-25 of 25');
    });

    it('should change page size', () => {
      // Change to 20 items per page
      cy.get('[data-testid="page-size-select"]').click();
      cy.get('[data-testid="page-size-20"]').click();
      
      // Should show 20 items
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 20);
      cy.get('[data-testid="pagination-info"]').should('contain', 'Showing 1-20 of 25');
    });

    it('should jump to specific page', () => {
      // Go to page 3
      cy.get('[data-testid="page-input"]').clear().type('3');
      cy.get('[data-testid="go-to-page-btn"]').click();
      
      // Should show page 3
      cy.get('[data-testid="pagination-info"]').should('contain', 'Showing 21-25 of 25');
    });
  });

  describe('Trade Spend Bulk Operations', () => {
    beforeEach(() => {
      // Create multiple trade spends for bulk operations
      cy.createTradeSpend({
        amount: 25000,
        description: 'Trade spend 1',
        status: 'draft'
      });
      
      cy.createTradeSpend({
        amount: 15000,
        description: 'Trade spend 2',
        status: 'draft'
      });
      
      cy.createTradeSpend({
        amount: 35000,
        description: 'Trade spend 3',
        status: 'draft'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
    });

    it('should select multiple trade spends', () => {
      // Select first two trade spends
      cy.get('[data-testid="select-trade-spend-0"]').check();
      cy.get('[data-testid="select-trade-spend-1"]').check();
      
      // Verify selection count
      cy.get('[data-testid="selected-count"]').should('contain', '2 selected');
      
      // Bulk actions should be enabled
      cy.get('[data-testid="bulk-actions-btn"]').should('not.be.disabled');
    });

    it('should bulk submit for approval', () => {
      // Select all trade spends
      cy.get('[data-testid="select-all-checkbox"]').check();
      
      // Bulk submit for approval
      cy.get('[data-testid="bulk-actions-btn"]').click();
      cy.get('[data-testid="bulk-submit-approval"]').click();
      
      // Confirm bulk action
      cy.get('[data-testid="bulk-confirm-modal"]').should('be.visible');
      cy.get('[data-testid="bulk-confirm-btn"]').click();
      
      // Verify all trade spends are pending
      cy.get('[data-testid="trade-spend-status"]').each(($status) => {
        cy.wrap($status).should('contain', 'Pending');
      });
    });

    it('should bulk delete draft trade spends', () => {
      // Select first two trade spends
      cy.get('[data-testid="select-trade-spend-0"]').check();
      cy.get('[data-testid="select-trade-spend-1"]').check();
      
      // Bulk delete
      cy.get('[data-testid="bulk-actions-btn"]').click();
      cy.get('[data-testid="bulk-delete"]').click();
      
      // Confirm deletion
      cy.get('[data-testid="bulk-delete-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-input"]').type('DELETE');
      cy.get('[data-testid="bulk-delete-confirm-btn"]').click();
      
      // Verify deletion
      cy.get('[data-testid="success-message"]').should('contain', '2 trade spends deleted');
      cy.get('[data-testid="trade-spend-row"]').should('have.length', 1);
    });

    it('should bulk export selected trade spends', () => {
      // Select all trade spends
      cy.get('[data-testid="select-all-checkbox"]').check();
      
      // Bulk export
      cy.get('[data-testid="bulk-actions-btn"]').click();
      cy.get('[data-testid="bulk-export"]').click();
      
      // Choose export format
      cy.get('[data-testid="export-format-modal"]').should('be.visible');
      cy.get('[data-testid="export-excel"]').click();
      
      // Verify download starts
      cy.get('[data-testid="download-progress"]').should('be.visible');
      cy.get('[data-testid="success-message"]').should('contain', 'Export completed');
    });
  });

  describe('Trade Spend Details View', () => {
    it('should view trade spend details', () => {
      cy.createTradeSpend({
        amount: 50000,
        description: 'Detailed trade spend',
        status: 'approved',
        type: 'promotion',
        startDate: '2024-06-01',
        endDate: '2024-08-31'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Click on trade spend to view details
      cy.get('[data-testid="trade-spend-row-0"]').click();
      
      // Verify details page
      cy.url().should('include', '/trade-spends/');
      cy.get('[data-testid="trade-spend-title"]').should('contain', 'Detailed trade spend');
      cy.get('[data-testid="trade-spend-amount"]').should('contain', '$50,000');
      cy.get('[data-testid="trade-spend-status"]').should('contain', 'Approved');
      cy.get('[data-testid="trade-spend-type"]').should('contain', 'Promotion');
      cy.get('[data-testid="trade-spend-dates"]').should('contain', 'Jun 1, 2024 - Aug 31, 2024');
    });

    it('should show approval history', () => {
      cy.createTradeSpend({
        amount: 50000,
        description: 'Trade spend with history',
        status: 'approved',
        approvedBy: 'Admin User',
        approvedAt: '2024-05-15T10:30:00Z'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="trade-spend-row-0"]').click();
      
      // Check approval history section
      cy.get('[data-testid="approval-history"]').should('be.visible');
      cy.get('[data-testid="approved-by"]').should('contain', 'Admin User');
      cy.get('[data-testid="approved-date"]').should('contain', 'May 15, 2024');
    });

    it('should show related documents', () => {
      cy.createTradeSpend({
        amount: 50000,
        description: 'Trade spend with documents',
        status: 'approved'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      cy.get('[data-testid="trade-spend-row-0"]').click();
      
      // Upload document
      cy.get('[data-testid="upload-document-btn"]').click();
      cy.get('[data-testid="file-input"]').selectFile('tests/e2e/fixtures/sample-document.pdf');
      cy.get('[data-testid="document-name"]').type('Campaign Brief');
      cy.get('[data-testid="upload-btn"]').click();
      
      // Verify document appears
      cy.get('[data-testid="document-list"]').should('contain', 'Campaign Brief');
      cy.get('[data-testid="document-type"]').should('contain', 'PDF');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display mobile-friendly trade spend list', () => {
      cy.createTradeSpend({
        amount: 25000,
        description: 'Mobile test trade spend',
        status: 'approved'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Verify mobile layout
      cy.get('[data-testid="mobile-trade-spend-card"]').should('be.visible');
      cy.get('[data-testid="mobile-amount"]').should('contain', '$25,000');
      cy.get('[data-testid="mobile-status"]').should('contain', 'Approved');
    });

    it('should have mobile-friendly filters', () => {
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Mobile filter button
      cy.get('[data-testid="mobile-filter-btn"]').click();
      
      // Filter drawer should open
      cy.get('[data-testid="mobile-filter-drawer"]').should('be.visible');
      
      // Apply filter
      cy.get('[data-testid="mobile-status-filter"]').click();
      cy.get('[data-testid="mobile-status-approved"]').click();
      cy.get('[data-testid="apply-filters-btn"]').click();
      
      // Drawer should close
      cy.get('[data-testid="mobile-filter-drawer"]').should('not.be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.createTradeSpend({
        amount: 25000,
        description: 'Accessibility test',
        status: 'draft'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Navigate using keyboard
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'create-trade-spend-btn');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'search-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'trade-spend-row-0');
      
      // Activate with Enter key
      cy.focused().type('{enter}');
      cy.url().should('include', '/trade-spends/');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Check ARIA labels
      cy.get('[data-testid="trade-spend-list"]').should('have.attr', 'aria-label', 'Trade spend list');
      cy.get('[data-testid="create-trade-spend-btn"]').should('have.attr', 'aria-label', 'Create new trade spend');
      cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label', 'Search trade spends');
    });

    it('should announce status changes to screen readers', () => {
      cy.createTradeSpend({
        amount: 25000,
        description: 'Screen reader test',
        status: 'pending'
      });
      
      cy.get('[data-testid="nav-trade-spends"]').click();
      
      // Approve trade spend
      cy.get('[data-testid="trade-spend-row-0"]').within(() => {
        cy.get('[data-testid="approve-btn"]').click();
      });
      
      cy.get('[data-testid="approval-modal"]').within(() => {
        cy.get('[data-testid="confirm-approve-btn"]').click();
      });
      
      // Check for screen reader announcement
      cy.get('[data-testid="sr-announcement"]').should('contain', 'Trade spend approved successfully');
    });
  });
});