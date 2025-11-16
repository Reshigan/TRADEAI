const EventEmitter = require('events');
const mongoose = require('mongoose');

/**
 * Workflow Engine
 * Provides business process automation, approval workflows, and rule engine
 */

class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.activeInstances = new Map();
    this.rules = new Map();
    this.tasks = new Map();
    this.approvers = new Map();
    this.isInitialized = false;

    this.initializeEngine();
  }

  async initializeEngine() {
    try {
      console.log('Initializing Workflow Engine...');

      // Load default workflows
      await this.loadDefaultWorkflows();

      // Load business rules
      await this.loadBusinessRules();

      // Start task monitoring
      this.startTaskMonitoring();

      this.isInitialized = true;
      console.log('Workflow Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Workflow Engine:', error);
    }
  }

  /**
   * Load default workflows
   */
  async loadDefaultWorkflows() {
    // Promotion Approval Workflow
    this.workflows.set('promotion_approval', {
      id: 'promotion_approval',
      name: 'Promotion Approval Process',
      description: 'Multi-stage approval process for new promotions',
      version: '1.0',
      steps: [
        {
          id: 'submit',
          name: 'Submit Promotion',
          type: 'start',
          assignee: 'requester',
          actions: ['validate_data', 'calculate_budget']
        },
        {
          id: 'manager_review',
          name: 'Manager Review',
          type: 'approval',
          assignee: 'manager',
          conditions: [
            { field: 'budget', operator: '>', value: 1000 }
          ],
          actions: ['review_budget', 'check_compliance'],
          timeout: 48, // hours
          escalation: 'senior_manager'
        },
        {
          id: 'finance_approval',
          name: 'Finance Approval',
          type: 'approval',
          assignee: 'finance_team',
          conditions: [
            { field: 'budget', operator: '>', value: 10000 }
          ],
          actions: ['budget_verification', 'roi_analysis'],
          timeout: 72,
          escalation: 'cfo'
        },
        {
          id: 'legal_review',
          name: 'Legal Review',
          type: 'review',
          assignee: 'legal_team',
          conditions: [
            { field: 'type', operator: 'in', value: ['discount', 'rebate'] },
            { field: 'duration', operator: '>', value: 30 }
          ],
          actions: ['compliance_check', 'terms_review'],
          timeout: 96,
          parallel: true
        },
        {
          id: 'final_approval',
          name: 'Final Approval',
          type: 'approval',
          assignee: 'director',
          conditions: [
            { field: 'budget', operator: '>', value: 50000 }
          ],
          actions: ['final_review', 'sign_off']
        },
        {
          id: 'activate',
          name: 'Activate Promotion',
          type: 'system',
          actions: ['create_promotion', 'notify_stakeholders', 'update_systems']
        },
        {
          id: 'complete',
          name: 'Process Complete',
          type: 'end'
        }
      ],
      rules: [
        {
          condition: 'budget <= 1000',
          action: 'skip_step',
          target: 'manager_review'
        },
        {
          condition: 'budget <= 10000',
          action: 'skip_step',
          target: 'finance_approval'
        },
        {
          condition: 'type not in ["discount", "rebate"] and duration <= 30',
          action: 'skip_step',
          target: 'legal_review'
        }
      ]
    });

    // Budget Allocation Workflow
    this.workflows.set('budget_allocation', {
      id: 'budget_allocation',
      name: 'Budget Allocation Process',
      description: 'Quarterly budget allocation and approval process',
      version: '1.0',
      steps: [
        {
          id: 'request',
          name: 'Budget Request',
          type: 'start',
          assignee: 'department_head',
          actions: ['prepare_request', 'justify_budget']
        },
        {
          id: 'planning_review',
          name: 'Planning Review',
          type: 'review',
          assignee: 'planning_team',
          actions: ['analyze_request', 'compare_historical', 'assess_roi'],
          timeout: 120
        },
        {
          id: 'finance_review',
          name: 'Finance Review',
          type: 'approval',
          assignee: 'finance_director',
          actions: ['budget_analysis', 'cash_flow_check'],
          timeout: 96
        },
        {
          id: 'executive_approval',
          name: 'Executive Approval',
          type: 'approval',
          assignee: 'executive_team',
          conditions: [
            { field: 'amount', operator: '>', value: 100000 }
          ],
          actions: ['strategic_review', 'final_approval']
        },
        {
          id: 'allocate',
          name: 'Allocate Budget',
          type: 'system',
          actions: ['create_budget', 'update_systems', 'notify_teams']
        },
        {
          id: 'complete',
          name: 'Allocation Complete',
          type: 'end'
        }
      ]
    });

    // Customer Onboarding Workflow
    this.workflows.set('customer_onboarding', {
      id: 'customer_onboarding',
      name: 'Customer Onboarding Process',
      description: 'New customer onboarding and setup process',
      version: '1.0',
      steps: [
        {
          id: 'registration',
          name: 'Customer Registration',
          type: 'start',
          assignee: 'sales_team',
          actions: ['collect_information', 'verify_details']
        },
        {
          id: 'credit_check',
          name: 'Credit Assessment',
          type: 'system',
          actions: ['run_credit_check', 'assess_risk'],
          timeout: 24
        },
        {
          id: 'approval',
          name: 'Account Approval',
          type: 'approval',
          assignee: 'account_manager',
          conditions: [
            { field: 'credit_score', operator: '<', value: 600 }
          ],
          actions: ['review_application', 'set_limits']
        },
        {
          id: 'setup',
          name: 'Account Setup',
          type: 'task',
          assignee: 'operations_team',
          actions: ['create_account', 'configure_settings', 'generate_credentials']
        },
        {
          id: 'welcome',
          name: 'Welcome Customer',
          type: 'system',
          actions: ['send_welcome_email', 'schedule_training', 'assign_rep']
        },
        {
          id: 'complete',
          name: 'Onboarding Complete',
          type: 'end'
        }
      ]
    });

    console.log('Default workflows loaded');
  }

  /**
   * Load business rules
   */
  async loadBusinessRules() {
    // Promotion Rules
    this.rules.set('promotion_validation', [
      {
        id: 'budget_limit',
        condition: 'budget > tenant.maxPromotionBudget',
        action: 'reject',
        message: 'Budget exceeds maximum allowed limit'
      },
      {
        id: 'overlap_check',
        condition: 'hasOverlappingPromotions(startDate, endDate, products)',
        action: 'warn',
        message: 'Overlapping promotions detected'
      },
      {
        id: 'margin_protection',
        condition: 'discount > product.maxDiscount',
        action: 'reject',
        message: 'Discount exceeds maximum allowed for product'
      }
    ]);

    // Budget Rules
    this.rules.set('budget_validation', [
      {
        id: 'quarterly_limit',
        condition: 'quarterlySpend + amount > quarterlyBudget',
        action: 'require_approval',
        message: 'Request exceeds quarterly budget'
      },
      {
        id: 'roi_threshold',
        condition: 'expectedROI < tenant.minROI',
        action: 'warn',
        message: 'Expected ROI below minimum threshold'
      }
    ]);

    // Customer Rules
    this.rules.set('customer_validation', [
      {
        id: 'credit_requirement',
        condition: 'creditScore < 600 and requestedLimit > 10000',
        action: 'require_approval',
        message: 'High credit limit requested for low credit score'
      },
      {
        id: 'duplicate_check',
        condition: 'isDuplicateCustomer(email, phone)',
        action: 'reject',
        message: 'Customer already exists in system'
      }
    ]);

    console.log('Business rules loaded');
  }

  /**
   * Start a new workflow instance
   */
  async startWorkflow(tenantId, workflowId, data, initiator) {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const instanceId = this.generateInstanceId();
      const instance = {
        id: instanceId,
        tenantId,
        workflowId,
        workflow: { ...workflow },
        data: { ...data },
        initiator,
        status: 'active',
        currentStep: workflow.steps[0].id,
        completedSteps: [],
        tasks: [],
        history: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Apply business rules
      await this.applyBusinessRules(instance);

      // Store instance
      this.activeInstances.set(instanceId, instance);

      // Start first step
      await this.executeStep(instanceId, workflow.steps[0]);

      // Emit event
      this.emit('workflow_started', {
        instanceId,
        workflowId,
        tenantId,
        initiator
      });

      return {
        instanceId,
        status: 'started',
        currentStep: workflow.steps[0].name,
        message: 'Workflow started successfully'
      };

    } catch (error) {
      throw new Error(`Failed to start workflow: ${error.message}`);
    }
  }

  /**
   * Execute a workflow step
   */
  async executeStep(instanceId, step) {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    try {
      // Log step execution
      this.addToHistory(instance, 'step_started', {
        stepId: step.id,
        stepName: step.name,
        assignee: step.assignee
      });

      // Check conditions
      if (step.conditions && !this.evaluateConditions(step.conditions, instance.data)) {
        // Skip step if conditions not met
        await this.skipStep(instanceId, step);
        return;
      }

      // Execute based on step type
      switch (step.type) {
        case 'start':
          await this.executeStartStep(instance, step);
          break;
        case 'approval':
          await this.executeApprovalStep(instance, step);
          break;
        case 'review':
          await this.executeReviewStep(instance, step);
          break;
        case 'task':
          await this.executeTaskStep(instance, step);
          break;
        case 'system':
          await this.executeSystemStep(instance, step);
          break;
        case 'end':
          await this.executeEndStep(instance, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Update instance
      instance.updatedAt = new Date();
      this.activeInstances.set(instanceId, instance);

    } catch (error) {
      this.addToHistory(instance, 'step_error', {
        stepId: step.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute start step
   */
  async executeStartStep(instance, step) {
    // Execute actions
    await this.executeActions(instance, step.actions);

    // Move to next step
    await this.moveToNextStep(instance, step);
  }

  /**
   * Execute approval step
   */
  async executeApprovalStep(instance, step) {
    // Create approval task
    const taskId = this.generateTaskId();
    const task = {
      id: taskId,
      instanceId: instance.id,
      stepId: step.id,
      type: 'approval',
      title: step.name,
      description: `Approval required for ${instance.workflow.name}`,
      assignee: step.assignee,
      data: instance.data,
      status: 'pending',
      createdAt: new Date(),
      dueDate: step.timeout ? new Date(Date.now() + step.timeout * 60 * 60 * 1000) : null
    };

    // Store task
    this.tasks.set(taskId, task);
    instance.tasks.push(taskId);

    // Set up timeout if specified
    if (step.timeout) {
      setTimeout(() => {
        this.handleTaskTimeout(taskId, step.escalation);
      }, step.timeout * 60 * 60 * 1000);
    }

    // Notify assignee
    await this.notifyAssignee(task);

    this.addToHistory(instance, 'approval_requested', {
      taskId,
      assignee: step.assignee,
      dueDate: task.dueDate
    });
  }

  /**
   * Execute review step
   */
  async executeReviewStep(instance, step) {
    // Similar to approval but for review tasks
    const taskId = this.generateTaskId();
    const task = {
      id: taskId,
      instanceId: instance.id,
      stepId: step.id,
      type: 'review',
      title: step.name,
      description: `Review required for ${instance.workflow.name}`,
      assignee: step.assignee,
      data: instance.data,
      status: 'pending',
      createdAt: new Date(),
      dueDate: step.timeout ? new Date(Date.now() + step.timeout * 60 * 60 * 1000) : null
    };

    this.tasks.set(taskId, task);
    instance.tasks.push(taskId);

    await this.notifyAssignee(task);

    this.addToHistory(instance, 'review_requested', {
      taskId,
      assignee: step.assignee
    });
  }

  /**
   * Execute task step
   */
  async executeTaskStep(instance, step) {
    // Create work task
    const taskId = this.generateTaskId();
    const task = {
      id: taskId,
      instanceId: instance.id,
      stepId: step.id,
      type: 'task',
      title: step.name,
      description: `Task required for ${instance.workflow.name}`,
      assignee: step.assignee,
      data: instance.data,
      status: 'pending',
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);
    instance.tasks.push(taskId);

    await this.notifyAssignee(task);

    this.addToHistory(instance, 'task_created', {
      taskId,
      assignee: step.assignee
    });
  }

  /**
   * Execute system step
   */
  async executeSystemStep(instance, step) {
    // Execute automated actions
    await this.executeActions(instance, step.actions);

    // Move to next step automatically
    await this.moveToNextStep(instance, step);

    this.addToHistory(instance, 'system_step_completed', {
      stepId: step.id,
      actions: step.actions
    });
  }

  /**
   * Execute end step
   */
  async executeEndStep(instance, step) {
    // Mark workflow as complete
    instance.status = 'completed';
    instance.completedAt = new Date();

    // Execute final actions
    if (step.actions) {
      await this.executeActions(instance, step.actions);
    }

    // Remove from active instances
    this.activeInstances.delete(instance.id);

    // Emit completion event
    this.emit('workflow_completed', {
      instanceId: instance.id,
      workflowId: instance.workflowId,
      tenantId: instance.tenantId,
      duration: instance.completedAt - instance.createdAt
    });

    this.addToHistory(instance, 'workflow_completed', {
      duration: instance.completedAt - instance.createdAt
    });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId, result, completedBy) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const instance = this.activeInstances.get(task.instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    // Update task
    task.status = 'completed';
    task.result = result;
    task.completedBy = completedBy;
    task.completedAt = new Date();

    // Find the step
    const step = instance.workflow.steps.find((s) => s.id === task.stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Handle task result
    if (task.type === 'approval') {
      if (result.approved) {
        await this.moveToNextStep(instance, step);
        this.addToHistory(instance, 'approval_granted', {
          taskId,
          approver: completedBy,
          comments: result.comments
        });
      } else {
        await this.rejectWorkflow(instance, result.reason, completedBy);
        this.addToHistory(instance, 'approval_denied', {
          taskId,
          approver: completedBy,
          reason: result.reason
        });
      }
    } else {
      // For review and task types, move to next step
      await this.moveToNextStep(instance, step);
      this.addToHistory(instance, 'task_completed', {
        taskId,
        completedBy,
        result: result.summary
      });
    }

    // Emit event
    this.emit('task_completed', {
      taskId,
      instanceId: instance.id,
      result,
      completedBy
    });

    return {
      taskId,
      status: 'completed',
      nextStep: instance.currentStep
    };
  }

  /**
   * Move to next step in workflow
   */
  async moveToNextStep(instance, currentStep) {
    // Mark current step as completed
    instance.completedSteps.push(currentStep.id);

    // Find next step
    const currentIndex = instance.workflow.steps.findIndex((s) => s.id === currentStep.id);
    const nextStep = instance.workflow.steps[currentIndex + 1];

    if (nextStep) {
      instance.currentStep = nextStep.id;
      await this.executeStep(instance.id, nextStep);
    } else {
      // No more steps, workflow complete
      instance.status = 'completed';
      instance.completedAt = new Date();
      this.activeInstances.delete(instance.id);
    }
  }

  /**
   * Skip a step
   */
  async skipStep(instanceId, step) {
    const instance = this.activeInstances.get(instanceId);

    this.addToHistory(instance, 'step_skipped', {
      stepId: step.id,
      reason: 'Conditions not met'
    });

    await this.moveToNextStep(instance, step);
  }

  /**
   * Reject workflow
   */
  async rejectWorkflow(instance, reason, rejectedBy) {
    instance.status = 'rejected';
    instance.rejectedAt = new Date();
    instance.rejectedBy = rejectedBy;
    instance.rejectionReason = reason;

    // Remove from active instances
    this.activeInstances.delete(instance.id);

    // Emit event
    this.emit('workflow_rejected', {
      instanceId: instance.id,
      reason,
      rejectedBy
    });
  }

  /**
   * Execute actions
   */
  async executeActions(instance, actions) {
    if (!actions || actions.length === 0) return;

    for (const action of actions) {
      try {
        await this.executeAction(instance, action);
      } catch (error) {
        console.error(`Action execution failed: ${action}`, error);
        this.addToHistory(instance, 'action_failed', {
          action,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute individual action
   */
  async executeAction(instance, action) {
    switch (action) {
      case 'validate_data':
        await this.validateData(instance);
        break;
      case 'calculate_budget':
        await this.calculateBudget(instance);
        break;
      case 'create_promotion':
        await this.createPromotion(instance);
        break;
      case 'notify_stakeholders':
        await this.notifyStakeholders(instance);
        break;
      case 'update_systems':
        await this.updateSystems(instance);
        break;
      default:
        console.log(`Executing action: ${action}`);
    }
  }

  /**
   * Apply business rules
   */
  async applyBusinessRules(instance) {
    const ruleSet = this.getRulesForWorkflow(instance.workflowId);

    for (const rule of ruleSet) {
      if (this.evaluateRule(rule, instance.data)) {
        await this.executeRuleAction(instance, rule);
      }
    }
  }

  /**
   * Evaluate conditions
   */
  evaluateConditions(conditions, data) {
    return conditions.every((condition) => {
      const value = this.getNestedValue(data, condition.field);

      switch (condition.operator) {
        case '>':
          return value > condition.value;
        case '<':
          return value < condition.value;
        case '>=':
          return value >= condition.value;
        case '<=':
          return value <= condition.value;
        case '==':
          return value == condition.value;
        case '!=':
          return value != condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'not in':
          return Array.isArray(condition.value) && !condition.value.includes(value);
        default:
          return false;
      }
    });
  }

  /**
   * Get workflow instances for tenant
   */
  getWorkflowInstances(tenantId, options = {}) {
    const { status, workflowId, limit = 50, offset = 0 } = options;

    let instances = Array.from(this.activeInstances.values())
      .filter((instance) => instance.tenantId === tenantId);

    if (status) {
      instances = instances.filter((instance) => instance.status === status);
    }

    if (workflowId) {
      instances = instances.filter((instance) => instance.workflowId === workflowId);
    }

    // Sort by creation date (newest first)
    instances.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const total = instances.length;
    instances = instances.slice(offset, offset + limit);

    return {
      instances: instances.map((instance) => ({
        id: instance.id,
        workflowId: instance.workflowId,
        workflowName: instance.workflow.name,
        status: instance.status,
        currentStep: instance.currentStep,
        initiator: instance.initiator,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Get tasks for user
   */
  getTasksForUser(tenantId, assignee, options = {}) {
    const { status = 'pending', limit = 20 } = options;

    const tasks = Array.from(this.tasks.values())
      .filter((task) => {
        const instance = this.activeInstances.get(task.instanceId);
        return instance &&
               instance.tenantId === tenantId &&
               task.assignee === assignee &&
               task.status === status;
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return tasks.map((task) => ({
      id: task.id,
      type: task.type,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      workflowName: this.activeInstances.get(task.instanceId)?.workflow.name
    }));
  }

  // Helper methods
  generateInstanceId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addToHistory(instance, event, data) {
    instance.history.push({
      event,
      data,
      timestamp: new Date()
    });
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getRulesForWorkflow(workflowId) {
    // Return relevant rules based on workflow type
    switch (workflowId) {
      case 'promotion_approval':
        return this.rules.get('promotion_validation') || [];
      case 'budget_allocation':
        return this.rules.get('budget_validation') || [];
      case 'customer_onboarding':
        return this.rules.get('customer_validation') || [];
      default:
        return [];
    }
  }

  evaluateRule(rule, data) {
    // Simple rule evaluation - would be more sophisticated in production
    try {
      // This would use a proper rule engine in production
      return eval(rule.condition.replace(/\w+/g, (match) => `data.${match}`));
    } catch (error) {
      console.error('Rule evaluation error:', error);
      return false;
    }
  }

  async executeRuleAction(instance, rule) {
    switch (rule.action) {
      case 'reject':
        await this.rejectWorkflow(instance, rule.message, 'system');
        break;
      case 'warn':
        this.addToHistory(instance, 'rule_warning', {
          rule: rule.id,
          message: rule.message
        });
        break;
      case 'require_approval':
        // Add additional approval step
        this.addToHistory(instance, 'additional_approval_required', {
          rule: rule.id,
          message: rule.message
        });
        break;
    }
  }

  async notifyAssignee(task) {
    // Mock notification - would integrate with actual notification system
    console.log(`Notification sent to ${task.assignee} for task: ${task.title}`);
  }

  handleTaskTimeout(taskId, escalation) {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      console.log(`Task ${taskId} timed out, escalating to ${escalation}`);

      // Update task assignee to escalation target
      task.assignee = escalation;
      task.escalated = true;
      task.escalatedAt = new Date();
    }
  }

  startTaskMonitoring() {
    // Monitor tasks every hour
    setInterval(() => {
      this.checkOverdueTasks();
    }, 60 * 60 * 1000);
  }

  checkOverdueTasks() {
    const now = new Date();

    this.tasks.forEach((task) => {
      if (task.status === 'pending' && task.dueDate && now > task.dueDate) {
        console.log(`Task ${task.id} is overdue`);

        // Mark as overdue
        task.status = 'overdue';
        task.overdueAt = now;

        // Notify about overdue task
        this.emit('task_overdue', {
          taskId: task.id,
          assignee: task.assignee,
          overdueDays: Math.floor((now - task.dueDate) / (24 * 60 * 60 * 1000))
        });
      }
    });
  }

  // Mock action implementations
  async validateData(instance) {
    console.log('Validating data for instance:', instance.id);
  }

  async calculateBudget(instance) {
    console.log('Calculating budget for instance:', instance.id);
  }

  async createPromotion(instance) {
    console.log('Creating promotion for instance:', instance.id);
  }

  async notifyStakeholders(instance) {
    console.log('Notifying stakeholders for instance:', instance.id);
  }

  async updateSystems(instance) {
    console.log('Updating systems for instance:', instance.id);
  }
}

module.exports = WorkflowEngine;
