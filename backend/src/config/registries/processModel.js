/**
 * ProcessModelRegistry
 * 
 * Defines process stages, validations, allowed actions, and exit criteria
 * for each module and company type. This is the single source of truth
 * for process-driven UI and business logic.
 * 
 * Structure: PROCESS_MODELS[module][companyType] = { stages: [...] }
 */

const VALIDATION_RULES = {
  required: (value) => !!value,
  greaterThan: (value, threshold) => value > threshold,
  lessThan: (value, threshold) => value < threshold,
  equals: (value, expected) => value === expected,
  notEquals: (value, expected) => value !== expected,
  beforeField: (value, entity, fieldName) => new Date(value) < new Date(entity[fieldName]),
  afterField: (value, entity, fieldName) => new Date(value) > new Date(entity[fieldName]),
  notEmpty: (value) => Array.isArray(value) ? value.length > 0 : !!value,
  minLength: (value, length) => value && value.length >= length,
  maxLength: (value, length) => value && value.length <= length,
  pattern: (value, regex) => new RegExp(regex).test(value)
};

const COMMON_STAGES = {
  plan: (overrides = {}) => ({
    id: 'plan',
    name: 'Plan',
    description: 'Define planning parameters and details',
    requiredFields: [],
    validations: [],
    allowedActions: ['edit', 'save_draft', 'submit_for_approval'],
    nextStage: 'commit',
    ...overrides
  }),
  commit: (overrides = {}) => ({
    id: 'commit',
    name: 'Commit',
    description: 'Approve and commit for execution',
    requiredFields: ['approver', 'approvalDate'],
    validations: [],
    allowedActions: ['approve', 'reject', 'request_changes'],
    nextStage: 'execute',
    ...overrides
  }),
  execute: (overrides = {}) => ({
    id: 'execute',
    name: 'Execute',
    description: 'Execute and track performance',
    requiredFields: [],
    validations: [],
    allowedActions: ['track_performance', 'adjust'],
    nextStage: 'claim',
    ...overrides
  }),
  claim: (overrides = {}) => ({
    id: 'claim',
    name: 'Claim',
    description: 'Process claims',
    requiredFields: [],
    validations: [],
    allowedActions: ['view_claims', 'approve_claim', 'reject_claim'],
    nextStage: 'reconcile',
    ...overrides
  }),
  reconcile: (overrides = {}) => ({
    id: 'reconcile',
    name: 'Reconcile',
    description: 'Reconcile actual vs planned',
    requiredFields: [],
    validations: [],
    allowedActions: ['reconcile', 'adjust', 'close_period'],
    nextStage: 'review',
    ...overrides
  }),
  review: (overrides = {}) => ({
    id: 'review',
    name: 'Review',
    description: 'Review performance and insights',
    requiredFields: [],
    validations: [],
    allowedActions: ['view_analytics', 'export_report', 'archive'],
    nextStage: null,
    ...overrides
  })
};

const PROCESS_MODELS = {
  budget: {
    manufacturer: {
      stages: [
        COMMON_STAGES.plan({
          requiredFields: ['name', 'code', 'fiscalYear', 'totalAmount', 'currency'],
          validations: [
            { field: 'totalAmount', rule: 'greaterThan', value: 0, message: 'Total amount must be greater than 0' },
            { field: 'fiscalYear', rule: 'required', message: 'Fiscal year is required' }
          ]
        }),
        COMMON_STAGES.commit(),
        COMMON_STAGES.execute({
          allowedActions: ['allocate', 'transfer', 'view_spending']
        }),
        COMMON_STAGES.claim(),
        COMMON_STAGES.reconcile(),
        COMMON_STAGES.review()
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive_funding',
          name: 'Receive Funding',
          description: 'Receive funding from vendors/manufacturers',
          requiredFields: ['name', 'code', 'fiscalYear', 'vendorId', 'fundingAmount'],
          validations: [
            { field: 'fundingAmount', rule: 'greaterThan', value: 0, message: 'Funding amount must be greater than 0' },
            { field: 'vendorId', rule: 'required', message: 'Vendor is required' }
          ],
          allowedActions: ['record_funding', 'save_draft'],
          nextStage: 'allocate'
        },
        {
          id: 'allocate',
          name: 'Allocate',
          description: 'Allocate funding to retailers and programs',
          requiredFields: [],
          validations: [],
          allowedActions: ['allocate_to_retailer', 'create_program'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute(),
        COMMON_STAGES.claim(),
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        COMMON_STAGES.review()
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive_offers',
          name: 'Receive Offers',
          description: 'Receive funding offers from distributors/manufacturers',
          requiredFields: ['name', 'offerId', 'offerAmount'],
          validations: [
            { field: 'offerAmount', rule: 'greaterThan', value: 0, message: 'Offer amount must be greater than 0' }
          ],
          allowedActions: ['view_offer', 'save_draft'],
          nextStage: 'accept'
        },
        {
          id: 'accept',
          name: 'Accept',
          description: 'Accept or negotiate offers',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept_offer', 'negotiate', 'reject_offer'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          allowedActions: ['allocate_to_store', 'track_execution']
        }),
        {
          id: 'submit_claims',
          name: 'Submit Claims',
          description: 'Submit claims for executed programs',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_claim', 'submit_claim'],
          nextStage: 'track_settlement'
        },
        {
          id: 'track_settlement',
          name: 'Track Settlement',
          description: 'Track claim settlement status',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_settlement', 'follow_up'],
          nextStage: 'review'
        },
        COMMON_STAGES.review()
      ]
    }
  },

  promotion: {
    manufacturer: {
      stages: [
        COMMON_STAGES.plan({
          requiredFields: ['name', 'promoCode', 'startDate', 'endDate', 'promoType', 'customers', 'products'],
          validations: [
            { field: 'startDate', rule: 'beforeField', value: 'endDate', message: 'Start date must be before end date' },
            { field: 'customers', rule: 'notEmpty', message: 'At least one customer is required' },
            { field: 'products', rule: 'notEmpty', message: 'At least one product is required' }
          ],
          allowedActions: ['edit', 'save_draft', 'check_conflicts', 'simulate']
        }),
        COMMON_STAGES.commit({
          requiredFields: ['committedAmount', 'budgetId', 'approver'],
          validations: [
            { field: 'committedAmount', rule: 'greaterThan', value: 0, message: 'Committed amount must be greater than 0' },
            { field: 'budgetId', rule: 'required', message: 'Budget allocation is required' }
          ]
        }),
        COMMON_STAGES.execute({
          allowedActions: ['activate', 'pause', 'track_performance', 'adjust']
        }),
        COMMON_STAGES.claim({
          allowedActions: ['view_claims', 'approve_claim', 'reject_claim', 'calculate_accruals']
        }),
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile', 'adjust_accruals', 'close_promotion']
        }),
        COMMON_STAGES.review()
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive_funding',
          name: 'Receive Funding',
          description: 'Receive promotional funding from vendors',
          requiredFields: ['name', 'promoCode', 'vendorId', 'fundingAmount'],
          validations: [
            { field: 'fundingAmount', rule: 'greaterThan', value: 0, message: 'Funding amount must be greater than 0' }
          ],
          allowedActions: ['record_funding', 'save_draft'],
          nextStage: 'allocate'
        },
        {
          id: 'allocate',
          name: 'Allocate',
          description: 'Allocate funding to retailer programs',
          requiredFields: ['startDate', 'endDate', 'retailers'],
          validations: [
            { field: 'retailers', rule: 'notEmpty', message: 'At least one retailer is required' }
          ],
          allowedActions: ['allocate_to_retailer', 'approve'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          allowedActions: ['track_execution', 'monitor_performance']
        }),
        COMMON_STAGES.claim(),
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        COMMON_STAGES.review()
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive_offers',
          name: 'Receive Offers',
          description: 'Receive promotional offers',
          requiredFields: ['name', 'offerId'],
          validations: [],
          allowedActions: ['view_offer', 'save_draft'],
          nextStage: 'accept'
        },
        {
          id: 'accept',
          name: 'Accept',
          description: 'Accept or negotiate offers',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept_offer', 'negotiate', 'reject_offer'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          requiredFields: ['stores'],
          validations: [
            { field: 'stores', rule: 'notEmpty', message: 'At least one store is required' }
          ],
          allowedActions: ['allocate_to_store', 'track_execution']
        }),
        {
          id: 'submit_claims',
          name: 'Submit Claims',
          description: 'Submit claims for executed programs',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_claim', 'submit_claim'],
          nextStage: 'track_settlement'
        },
        {
          id: 'track_settlement',
          name: 'Track Settlement',
          description: 'Track claim settlement',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_settlement', 'follow_up'],
          nextStage: 'review'
        },
        COMMON_STAGES.review()
      ]
    }
  },

  tradeSpend: {
    manufacturer: {
      stages: [
        COMMON_STAGES.plan({
          requiredFields: ['name', 'type', 'customer', 'startDate', 'endDate', 'amount'],
          validations: [
            { field: 'amount', rule: 'greaterThan', value: 0, message: 'Amount must be greater than 0' },
            { field: 'startDate', rule: 'beforeField', value: 'endDate', message: 'Start date must be before end date' }
          ]
        }),
        COMMON_STAGES.commit({
          requiredFields: ['budgetId', 'approver'],
          validations: [
            { field: 'budgetId', rule: 'required', message: 'Budget allocation is required' }
          ]
        }),
        COMMON_STAGES.execute({
          allowedActions: ['track_accruals', 'adjust_rate']
        }),
        COMMON_STAGES.claim({
          allowedActions: ['view_claims', 'approve_claim', 'reject_claim', 'calculate_accruals']
        }),
        COMMON_STAGES.reconcile(),
        COMMON_STAGES.review()
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive_funding',
          name: 'Receive Funding',
          description: 'Receive trade spend funding from vendors',
          requiredFields: ['name', 'type', 'vendorId', 'fundingAmount'],
          validations: [
            { field: 'fundingAmount', rule: 'greaterThan', value: 0, message: 'Funding amount must be greater than 0' }
          ],
          allowedActions: ['record_funding', 'save_draft'],
          nextStage: 'allocate'
        },
        {
          id: 'allocate',
          name: 'Allocate',
          description: 'Allocate to retailers',
          requiredFields: ['retailers'],
          validations: [
            { field: 'retailers', rule: 'notEmpty', message: 'At least one retailer is required' }
          ],
          allowedActions: ['allocate_to_retailer'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute(),
        COMMON_STAGES.claim(),
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        COMMON_STAGES.review()
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive_offers',
          name: 'Receive Offers',
          description: 'Receive trade spend offers',
          requiredFields: ['name', 'offerId'],
          validations: [],
          allowedActions: ['view_offer'],
          nextStage: 'accept'
        },
        {
          id: 'accept',
          name: 'Accept',
          description: 'Accept or negotiate',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept_offer', 'negotiate', 'reject_offer'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute(),
        {
          id: 'submit_claims',
          name: 'Submit Claims',
          description: 'Submit claims',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_claim', 'submit_claim'],
          nextStage: 'track_settlement'
        },
        {
          id: 'track_settlement',
          name: 'Track Settlement',
          description: 'Track settlement',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_settlement', 'follow_up'],
          nextStage: 'review'
        },
        COMMON_STAGES.review()
      ]
    }
  },

  tradingTerm: {
    manufacturer: {
      stages: [
        COMMON_STAGES.plan({
          requiredFields: ['termCode', 'description', 'customer', 'startDate', 'endDate', 'rate', 'rateType'],
          validations: [
            { field: 'rate', rule: 'greaterThan', value: 0, message: 'Rate must be greater than 0' },
            { field: 'startDate', rule: 'beforeField', value: 'endDate', message: 'Start date must be before end date' }
          ],
          allowedActions: ['edit', 'save_draft', 'simulate', 'submit_for_approval']
        }),
        COMMON_STAGES.commit({
          description: 'Approve trading term agreement'
        }),
        COMMON_STAGES.execute({
          description: 'Track accruals and settlements',
          allowedActions: ['track_accruals', 'calculate_settlement', 'adjust']
        }),
        {
          id: 'settle',
          name: 'Settle',
          description: 'Process settlements',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_settlement', 'approve_settlement', 'pay'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile(),
        COMMON_STAGES.review()
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive_terms',
          name: 'Receive Terms',
          description: 'Receive trading terms from vendors',
          requiredFields: ['termCode', 'vendorId', 'rate'],
          validations: [],
          allowedActions: ['view_terms', 'save_draft'],
          nextStage: 'negotiate'
        },
        {
          id: 'negotiate',
          name: 'Negotiate',
          description: 'Negotiate and accept terms',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept', 'negotiate', 'reject'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          description: 'Track vendor and retailer accruals',
          allowedActions: ['track_vendor_accruals', 'track_retailer_accruals']
        }),
        {
          id: 'settle',
          name: 'Settle',
          description: 'Process settlements',
          requiredFields: [],
          validations: [],
          allowedActions: ['settle_vendor', 'settle_retailer'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        COMMON_STAGES.review()
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive_terms',
          name: 'Receive Terms',
          description: 'Receive trading terms offers',
          requiredFields: ['termCode', 'offerId'],
          validations: [],
          allowedActions: ['view_terms'],
          nextStage: 'accept'
        },
        {
          id: 'accept',
          name: 'Accept',
          description: 'Accept or negotiate terms',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept', 'negotiate', 'reject'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          description: 'Track accruals',
          allowedActions: ['track_accruals', 'view_balance']
        }),
        {
          id: 'claim_settlement',
          name: 'Claim Settlement',
          description: 'Claim settlements',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_claim', 'submit_claim'],
          nextStage: 'track_payment'
        },
        {
          id: 'track_payment',
          name: 'Track Payment',
          description: 'Track payment status',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_payment', 'follow_up'],
          nextStage: 'review'
        },
        COMMON_STAGES.review()
      ]
    }
  },

  activityGrid: {
    manufacturer: {
      stages: [
        COMMON_STAGES.plan({
          requiredFields: ['name', 'activityType', 'channel', 'startDate', 'endDate', 'plannedSpend'],
          validations: [
            { field: 'plannedSpend', rule: 'greaterThan', value: 0, message: 'Planned spend must be greater than 0' },
            { field: 'startDate', rule: 'beforeField', value: 'endDate', message: 'Start date must be before end date' }
          ],
          allowedActions: ['edit', 'save_draft', 'check_conflicts', 'submit_for_approval']
        }),
        COMMON_STAGES.commit({
          requiredFields: ['budgetId', 'approver']
        }),
        COMMON_STAGES.execute({
          description: 'Execute marketing activity',
          allowedActions: ['activate', 'track_execution', 'upload_proof']
        }),
        {
          id: 'measure',
          name: 'Measure',
          description: 'Measure activity performance',
          requiredFields: [],
          validations: [],
          allowedActions: ['record_results', 'calculate_roi'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          description: 'Reconcile actual vs planned spend'
        }),
        COMMON_STAGES.review()
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive_funding',
          name: 'Receive Funding',
          description: 'Receive marketing funding',
          requiredFields: ['name', 'vendorId', 'fundingAmount'],
          validations: [],
          allowedActions: ['record_funding'],
          nextStage: 'plan'
        },
        COMMON_STAGES.plan({
          requiredFields: ['activityType', 'channel', 'startDate', 'endDate'],
          allowedActions: ['edit', 'save_draft', 'submit_for_approval']
        }),
        COMMON_STAGES.commit(),
        COMMON_STAGES.execute({
          allowedActions: ['activate', 'track_execution']
        }),
        {
          id: 'measure',
          name: 'Measure',
          description: 'Measure performance',
          requiredFields: [],
          validations: [],
          allowedActions: ['record_results'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_internal']
        }),
        COMMON_STAGES.review()
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive_offers',
          name: 'Receive Offers',
          description: 'Receive marketing activity offers',
          requiredFields: ['name', 'offerId'],
          validations: [],
          allowedActions: ['view_offer'],
          nextStage: 'accept'
        },
        {
          id: 'accept',
          name: 'Accept',
          description: 'Accept activity participation',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept', 'reject'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          description: 'Execute at store level',
          allowedActions: ['allocate_to_store', 'track_execution', 'upload_proof']
        }),
        {
          id: 'submit_claims',
          name: 'Submit Claims',
          description: 'Submit execution claims',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_claim', 'submit_claim'],
          nextStage: 'track_settlement'
        },
        {
          id: 'track_settlement',
          name: 'Track Settlement',
          description: 'Track settlement',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_settlement', 'follow_up'],
          nextStage: 'review'
        },
        COMMON_STAGES.review()
      ]
    }
  },

  claim: {
    manufacturer: {
      stages: [
        {
          id: 'receive',
          name: 'Receive',
          description: 'Receive claim from customer',
          requiredFields: ['claimNumber', 'customer', 'claimType', 'amount', 'claimDate'],
          validations: [
            { field: 'amount', rule: 'greaterThan', value: 0, message: 'Claim amount must be greater than 0' }
          ],
          allowedActions: ['view_claim', 'assign'],
          nextStage: 'validate'
        },
        {
          id: 'validate',
          name: 'Validate',
          description: 'Validate claim against agreements',
          requiredFields: [],
          validations: [],
          allowedActions: ['validate', 'request_documents', 'flag_issue'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve or reject claim',
          requiredFields: ['approver', 'approvalDate'],
          validations: [],
          allowedActions: ['approve', 'reject', 'request_changes'],
          nextStage: 'settle'
        },
        {
          id: 'settle',
          name: 'Settle',
          description: 'Process settlement payment',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_payment', 'process_payment'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          description: 'Reconcile claim against budget'
        }),
        {
          id: 'close',
          name: 'Close',
          description: 'Close claim',
          requiredFields: [],
          validations: [],
          allowedActions: ['close', 'archive'],
          nextStage: null
        }
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive',
          name: 'Receive',
          description: 'Receive claim from retailer',
          requiredFields: ['claimNumber', 'retailer', 'amount'],
          validations: [],
          allowedActions: ['view_claim', 'assign'],
          nextStage: 'validate'
        },
        {
          id: 'validate',
          name: 'Validate',
          description: 'Validate against agreements and vendor funding',
          requiredFields: [],
          validations: [],
          allowedActions: ['validate', 'check_vendor_funding', 'request_documents'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve claim',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject', 'request_changes'],
          nextStage: 'settle'
        },
        {
          id: 'settle',
          name: 'Settle',
          description: 'Process settlement',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_payment', 'process_payment'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          description: 'Reconcile with vendor and retailer',
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        {
          id: 'close',
          name: 'Close',
          description: 'Close claim',
          requiredFields: [],
          validations: [],
          allowedActions: ['close', 'archive'],
          nextStage: null
        }
      ]
    },
    retailer: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create claim for executed programs',
          requiredFields: ['claimNumber', 'programId', 'amount', 'supportingDocs'],
          validations: [
            { field: 'amount', rule: 'greaterThan', value: 0, message: 'Claim amount must be greater than 0' },
            { field: 'supportingDocs', rule: 'notEmpty', message: 'Supporting documents are required' }
          ],
          allowedActions: ['edit', 'save_draft', 'upload_documents'],
          nextStage: 'submit'
        },
        {
          id: 'submit',
          name: 'Submit',
          description: 'Submit claim for approval',
          requiredFields: [],
          validations: [],
          allowedActions: ['submit', 'cancel'],
          nextStage: 'track'
        },
        {
          id: 'track',
          name: 'Track',
          description: 'Track claim status',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_status', 'respond_to_queries', 'upload_additional_docs'],
          nextStage: 'receive_payment'
        },
        {
          id: 'receive_payment',
          name: 'Receive Payment',
          description: 'Receive settlement payment',
          requiredFields: [],
          validations: [],
          allowedActions: ['confirm_payment', 'dispute'],
          nextStage: 'close'
        },
        {
          id: 'close',
          name: 'Close',
          description: 'Close claim',
          requiredFields: [],
          validations: [],
          allowedActions: ['close', 'archive'],
          nextStage: null
        }
      ]
    }
  },

  deduction: {
    manufacturer: {
      stages: [
        {
          id: 'identify',
          name: 'Identify',
          description: 'Identify deduction from AR',
          requiredFields: ['deductionNumber', 'customer', 'amount', 'postingDate'],
          validations: [
            { field: 'amount', rule: 'greaterThan', value: 0, message: 'Deduction amount must be greater than 0' }
          ],
          allowedActions: ['view', 'assign', 'categorize'],
          nextStage: 'research'
        },
        {
          id: 'research',
          name: 'Research',
          description: 'Research deduction root cause',
          requiredFields: [],
          validations: [],
          allowedActions: ['research', 'match_to_promotion', 'match_to_claim', 'request_backup'],
          nextStage: 'resolve'
        },
        {
          id: 'resolve',
          name: 'Resolve',
          description: 'Resolve deduction',
          requiredFields: ['resolution', 'resolutionDate'],
          validations: [],
          allowedActions: ['approve', 'dispute', 'write_off', 'create_credit'],
          nextStage: 'settle'
        },
        {
          id: 'settle',
          name: 'Settle',
          description: 'Settle deduction',
          requiredFields: [],
          validations: [],
          allowedActions: ['clear_ar', 'process_payment'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          description: 'Reconcile against budget'
        }),
        {
          id: 'close',
          name: 'Close',
          description: 'Close deduction',
          requiredFields: [],
          validations: [],
          allowedActions: ['close', 'archive'],
          nextStage: null
        }
      ]
    },
    distributor: {
      stages: [
        {
          id: 'identify',
          name: 'Identify',
          description: 'Identify deduction',
          requiredFields: ['deductionNumber', 'source', 'amount'],
          validations: [],
          allowedActions: ['view', 'assign', 'categorize'],
          nextStage: 'research'
        },
        {
          id: 'research',
          name: 'Research',
          description: 'Research root cause',
          requiredFields: [],
          validations: [],
          allowedActions: ['research', 'match_to_program', 'check_vendor_funding'],
          nextStage: 'resolve'
        },
        {
          id: 'resolve',
          name: 'Resolve',
          description: 'Resolve deduction',
          requiredFields: ['resolution'],
          validations: [],
          allowedActions: ['approve', 'dispute', 'allocate_to_vendor', 'write_off'],
          nextStage: 'settle'
        },
        {
          id: 'settle',
          name: 'Settle',
          description: 'Settle deduction',
          requiredFields: [],
          validations: [],
          allowedActions: ['clear_ar', 'process_payment'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        {
          id: 'close',
          name: 'Close',
          description: 'Close deduction',
          requiredFields: [],
          validations: [],
          allowedActions: ['close', 'archive'],
          nextStage: null
        }
      ]
    },
    retailer: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create deduction for short payment',
          requiredFields: ['deductionNumber', 'invoiceNumber', 'amount', 'reason'],
          validations: [
            { field: 'amount', rule: 'greaterThan', value: 0, message: 'Deduction amount must be greater than 0' }
          ],
          allowedActions: ['edit', 'save_draft', 'upload_backup'],
          nextStage: 'submit'
        },
        {
          id: 'submit',
          name: 'Submit',
          description: 'Submit deduction to supplier',
          requiredFields: ['supportingDocs'],
          validations: [],
          allowedActions: ['submit', 'cancel'],
          nextStage: 'track'
        },
        {
          id: 'track',
          name: 'Track',
          description: 'Track deduction status',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_status', 'respond_to_queries', 'upload_additional_docs'],
          nextStage: 'resolve'
        },
        {
          id: 'resolve',
          name: 'Resolve',
          description: 'Resolve deduction',
          requiredFields: [],
          validations: [],
          allowedActions: ['accept_resolution', 'dispute', 'escalate'],
          nextStage: 'close'
        },
        {
          id: 'close',
          name: 'Close',
          description: 'Close deduction',
          requiredFields: [],
          validations: [],
          allowedActions: ['close', 'archive'],
          nextStage: null
        }
      ]
    }
  },

  kamWallet: {
    manufacturer: {
      stages: [
        {
          id: 'allocate',
          name: 'Allocate',
          description: 'Allocate discretionary spend to KAM',
          requiredFields: ['userId', 'period', 'totalAllocation', 'currency'],
          validations: [
            { field: 'totalAllocation', rule: 'greaterThan', value: 0, message: 'Allocation must be greater than 0' }
          ],
          allowedActions: ['edit', 'save_draft', 'submit_for_approval'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve KAM wallet allocation',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject', 'adjust'],
          nextStage: 'execute'
        },
        {
          id: 'execute',
          name: 'Execute',
          description: 'KAM executes discretionary spend',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_spend', 'track_balance', 'request_topup'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          description: 'Reconcile wallet spend vs allocation'
        }),
        {
          id: 'close',
          name: 'Close',
          description: 'Close wallet period',
          requiredFields: [],
          validations: [],
          allowedActions: ['close_period', 'rollover_balance', 'archive'],
          nextStage: null
        }
      ]
    },
    distributor: {
      stages: [
        {
          id: 'allocate',
          name: 'Allocate',
          description: 'Allocate wallet from vendor funding',
          requiredFields: ['userId', 'period', 'totalAllocation', 'vendorId'],
          validations: [],
          allowedActions: ['edit', 'save_draft', 'submit_for_approval'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve allocation',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject'],
          nextStage: 'execute'
        },
        {
          id: 'execute',
          name: 'Execute',
          description: 'Execute discretionary spend',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_spend', 'track_balance'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_internal']
        }),
        {
          id: 'close',
          name: 'Close',
          description: 'Close period',
          requiredFields: [],
          validations: [],
          allowedActions: ['close_period', 'archive'],
          nextStage: null
        }
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive',
          name: 'Receive',
          description: 'Receive discretionary funding allocation',
          requiredFields: ['userId', 'period', 'allocation'],
          validations: [],
          allowedActions: ['view_allocation', 'accept'],
          nextStage: 'execute'
        },
        {
          id: 'execute',
          name: 'Execute',
          description: 'Execute discretionary spend',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_spend', 'track_balance', 'submit_claim'],
          nextStage: 'track_settlement'
        },
        {
          id: 'track_settlement',
          name: 'Track Settlement',
          description: 'Track settlement of wallet spend',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_settlement', 'follow_up'],
          nextStage: 'close'
        },
        {
          id: 'close',
          name: 'Close',
          description: 'Close period',
          requiredFields: [],
          validations: [],
          allowedActions: ['close_period', 'archive'],
          nextStage: null
        }
      ]
    }
  },

  campaign: {
    manufacturer: {
      stages: [
        COMMON_STAGES.plan({
          requiredFields: ['name', 'campaignType', 'startDate', 'endDate', 'targetAudience', 'plannedBudget'],
          validations: [
            { field: 'plannedBudget', rule: 'greaterThan', value: 0, message: 'Planned budget must be greater than 0' },
            { field: 'startDate', rule: 'beforeField', value: 'endDate', message: 'Start date must be before end date' }
          ],
          allowedActions: ['edit', 'save_draft', 'add_promotions', 'submit_for_approval']
        }),
        COMMON_STAGES.commit({
          requiredFields: ['budgetId', 'approver']
        }),
        COMMON_STAGES.execute({
          description: 'Execute campaign activities',
          allowedActions: ['activate', 'track_performance', 'adjust_tactics']
        }),
        {
          id: 'measure',
          name: 'Measure',
          description: 'Measure campaign performance',
          requiredFields: [],
          validations: [],
          allowedActions: ['record_results', 'calculate_roi', 'analyze_effectiveness'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          description: 'Reconcile campaign spend vs budget'
        }),
        COMMON_STAGES.review()
      ]
    },
    distributor: {
      stages: [
        {
          id: 'receive_funding',
          name: 'Receive Funding',
          description: 'Receive campaign funding from vendors',
          requiredFields: ['name', 'vendorId', 'fundingAmount'],
          validations: [],
          allowedActions: ['record_funding'],
          nextStage: 'plan'
        },
        COMMON_STAGES.plan({
          requiredFields: ['campaignType', 'startDate', 'endDate', 'targetRetailers']
        }),
        COMMON_STAGES.commit(),
        COMMON_STAGES.execute({
          allowedActions: ['activate', 'track_performance']
        }),
        {
          id: 'measure',
          name: 'Measure',
          description: 'Measure performance',
          requiredFields: [],
          validations: [],
          allowedActions: ['record_results', 'calculate_roi'],
          nextStage: 'reconcile'
        },
        COMMON_STAGES.reconcile({
          allowedActions: ['reconcile_vendor', 'reconcile_retailer']
        }),
        COMMON_STAGES.review()
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive_offers',
          name: 'Receive Offers',
          description: 'Receive campaign participation offers',
          requiredFields: ['name', 'offerId'],
          validations: [],
          allowedActions: ['view_offer'],
          nextStage: 'accept'
        },
        {
          id: 'accept',
          name: 'Accept',
          description: 'Accept campaign participation',
          requiredFields: ['acceptanceDate'],
          validations: [],
          allowedActions: ['accept', 'reject'],
          nextStage: 'execute'
        },
        COMMON_STAGES.execute({
          description: 'Execute campaign at store level',
          allowedActions: ['allocate_to_store', 'track_execution']
        }),
        {
          id: 'submit_claims',
          name: 'Submit Claims',
          description: 'Submit execution claims',
          requiredFields: [],
          validations: [],
          allowedActions: ['create_claim', 'submit_claim'],
          nextStage: 'track_settlement'
        },
        {
          id: 'track_settlement',
          name: 'Track Settlement',
          description: 'Track settlement',
          requiredFields: [],
          validations: [],
          allowedActions: ['view_settlement', 'follow_up'],
          nextStage: 'review'
        },
        COMMON_STAGES.review()
      ]
    }
  },

  customer: {
    manufacturer: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create customer master record',
          requiredFields: ['customerCode', 'name', 'country', 'currency', 'salesOrg', 'distChannel'],
          validations: [
            { field: 'customerCode', rule: 'required', message: 'Customer code is required' },
            { field: 'name', rule: 'required', message: 'Customer name is required' }
          ],
          allowedActions: ['edit', 'save_draft', 'validate_sap'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve customer creation',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject', 'request_changes'],
          nextStage: 'active'
        },
        {
          id: 'active',
          name: 'Active',
          description: 'Customer is active',
          requiredFields: [],
          validations: [],
          allowedActions: ['edit', 'update_hierarchy', 'manage_terms', 'deactivate'],
          nextStage: null
        }
      ]
    },
    distributor: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create retailer record',
          requiredFields: ['customerCode', 'name', 'retailerType'],
          validations: [],
          allowedActions: ['edit', 'save_draft'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve retailer',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject'],
          nextStage: 'active'
        },
        {
          id: 'active',
          name: 'Active',
          description: 'Retailer is active',
          requiredFields: [],
          validations: [],
          allowedActions: ['edit', 'manage_stores', 'manage_terms', 'deactivate'],
          nextStage: null
        }
      ]
    },
    retailer: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create store record',
          requiredFields: ['storeCode', 'name', 'location'],
          validations: [],
          allowedActions: ['edit', 'save_draft'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve store',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject'],
          nextStage: 'active'
        },
        {
          id: 'active',
          name: 'Active',
          description: 'Store is active',
          requiredFields: [],
          validations: [],
          allowedActions: ['edit', 'update_details', 'deactivate'],
          nextStage: null
        }
      ]
    }
  },

  product: {
    manufacturer: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create product master record',
          requiredFields: ['materialCode', 'sku', 'description', 'baseUom'],
          validations: [
            { field: 'materialCode', rule: 'required', message: 'Material code is required' },
            { field: 'description', rule: 'required', message: 'Description is required' }
          ],
          allowedActions: ['edit', 'save_draft', 'validate_sap'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve product creation',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject', 'request_changes'],
          nextStage: 'active'
        },
        {
          id: 'active',
          name: 'Active',
          description: 'Product is active',
          requiredFields: [],
          validations: [],
          allowedActions: ['edit', 'update_hierarchy', 'manage_pricing', 'discontinue'],
          nextStage: null
        }
      ]
    },
    distributor: {
      stages: [
        {
          id: 'create',
          name: 'Create',
          description: 'Create product record',
          requiredFields: ['materialCode', 'description', 'vendorId'],
          validations: [],
          allowedActions: ['edit', 'save_draft'],
          nextStage: 'approve'
        },
        {
          id: 'approve',
          name: 'Approve',
          description: 'Approve product',
          requiredFields: ['approver'],
          validations: [],
          allowedActions: ['approve', 'reject'],
          nextStage: 'active'
        },
        {
          id: 'active',
          name: 'Active',
          description: 'Product is active',
          requiredFields: [],
          validations: [],
          allowedActions: ['edit', 'manage_pricing', 'discontinue'],
          nextStage: null
        }
      ]
    },
    retailer: {
      stages: [
        {
          id: 'receive',
          name: 'Receive',
          description: 'Receive product from supplier',
          requiredFields: ['materialCode', 'description'],
          validations: [],
          allowedActions: ['view', 'accept'],
          nextStage: 'active'
        },
        {
          id: 'active',
          name: 'Active',
          description: 'Product is active in stores',
          requiredFields: [],
          validations: [],
          allowedActions: ['view', 'manage_assortment', 'discontinue'],
          nextStage: null
        }
      ]
    }
  }
};

/**
 * Get process model for a specific module and company type
 */
const getProcessModel = (module, companyType = 'manufacturer') => {
  const moduleModel = PROCESS_MODELS[module];
  if (!moduleModel) {
    console.warn(`No process model found for module: ${module}`);
    return null;
  }

  const processModel = moduleModel[companyType];
  if (!processModel) {
    console.warn(`No process model found for company type: ${companyType} in module: ${module}`);
    return moduleModel.manufacturer || null;
  }

  return processModel;
};

/**
 * Get current stage for an entity based on its status
 */
const getCurrentStage = (module, companyType, entity) => {
  const processModel = getProcessModel(module, companyType);
  if (!processModel) return null;

  const statusToStageMap = {
    draft: 'plan',
    pending_approval: 'commit',
    approved: 'execute',
    active: 'execute',
    completed: 'review',
    closed: 'close'
  };

  const stageId = statusToStageMap[entity.status] || processModel.stages[0].id;
  return processModel.stages.find(s => s.id === stageId) || processModel.stages[0];
};

/**
 * Validate entity against stage requirements
 */
const validateStage = (stage, entity) => {
  const errors = [];

  // Check required fields
  stage.requiredFields.forEach(field => {
    if (!entity[field] || (Array.isArray(entity[field]) && entity[field].length === 0)) {
      errors.push(`${field} is required for ${stage.name} stage`);
    }
  });

  stage.validations.forEach(validation => {
    const value = entity[validation.field];
    const rule = VALIDATION_RULES[validation.rule];
    
    if (!rule) {
      console.warn(`Unknown validation rule: ${validation.rule}`);
      return;
    }

    let isValid = false;
    switch (validation.rule) {
      case 'greaterThan':
      case 'lessThan':
        isValid = rule(value, validation.value);
        break;
      case 'equals':
      case 'notEquals':
        isValid = rule(value, validation.value);
        break;
      case 'beforeField':
      case 'afterField':
        isValid = rule(value, entity, validation.value);
        break;
      case 'minLength':
      case 'maxLength':
        isValid = rule(value, validation.value);
        break;
      case 'pattern':
        isValid = rule(value, validation.value);
        break;
      default:
        isValid = rule(value);
    }

    if (!isValid) {
      errors.push(validation.message);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get allowed actions for current stage
 */
const getAllowedActions = (module, companyType, entity) => {
  const stage = getCurrentStage(module, companyType, entity);
  if (!stage) return [];
  
  return stage.allowedActions;
};

/**
 * Get next best action based on stage and validation
 */
const getNextBestAction = (module, companyType, entity) => {
  const stage = getCurrentStage(module, companyType, entity);
  if (!stage) return null;

  const validation = validateStage(stage, entity);
  
  if (!validation.valid) {
    return {
      action: 'complete_required_fields',
      label: 'Complete Required Fields',
      description: `Complete the following to proceed: ${validation.errors.join(', ')}`,
      priority: 'high',
      errors: validation.errors
    };
  }

  const primaryActions = {
    plan: { action: 'submit_for_approval', label: 'Submit for Approval', description: 'Submit for approval to move to next stage' },
    commit: { action: 'approve', label: 'Approve', description: 'Approve to proceed with execution' },
    approve: { action: 'approve', label: 'Approve', description: 'Approve to proceed' },
    execute: { action: 'track_performance', label: 'Track Performance', description: 'Monitor execution and performance' },
    claim: { action: 'view_claims', label: 'View Claims', description: 'Review and process claims' },
    reconcile: { action: 'reconcile', label: 'Reconcile', description: 'Reconcile actual vs planned' },
    review: { action: 'view_analytics', label: 'View Analytics', description: 'Review performance insights' }
  };

  return primaryActions[stage.id] || { action: stage.allowedActions[0], label: stage.allowedActions[0].replace(/_/g, ' '), description: `Perform ${stage.allowedActions[0]}` };
};

/**
 * Get all modules with process models
 */
const getAllModules = () => {
  return Object.keys(PROCESS_MODELS);
};

/**
 * Get stage-to-tabs mapping for ProcessShell
 */
const getStageToTabsMapping = (module, companyType) => {
  const basicMapping = {
    plan: ['overview', 'details'],
    commit: ['overview', 'approvals'],
    execute: ['overview', 'performance', 'tracking'],
    claim: ['overview', 'claims'],
    reconcile: ['overview', 'reconciliation'],
    review: ['overview', 'analytics', 'history']
  };

  return basicMapping;
};

module.exports = {
  PROCESS_MODELS,
  VALIDATION_RULES,
  COMMON_STAGES,
  getProcessModel,
  getCurrentStage,
  validateStage,
  getAllowedActions,
  getNextBestAction,
  getAllModules,
  getStageToTabsMapping
};
