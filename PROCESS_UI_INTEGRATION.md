# Process UI Integration Guide

## Quick Start

### 1. Install Dependencies

Ensure you have the required dependencies:

```bash
npm install framer-motion @mui/material @mui/icons-material
```

### 2. Import Components

```jsx
import {
  ProcessStepper,
  ProcessTracker,
  ProcessFlow,
  ProcessWizard,
} from './components/common/process-index';
```

### 3. Use in Your Pages

#### Example: Promotion Detail Page

```jsx
import React from 'react';
import { Grid, Box } from '@mui/material';
import { ProcessStepper, ProcessTracker } from './components/common/process-index';

function PromotionDetail({ promotion }) {
  // Transform promotion data to process steps
  const processSteps = [
    {
      id: 'planning',
      title: 'Planning',
      description: 'Define promotion strategy',
      status: promotion.planningComplete ? 'completed' : 'pending',
      estimatedTime: '2 days',
      assignee: promotion.planner,
    },
    {
      id: 'approval',
      title: 'Approval',
      description: 'Get management sign-off',
      status: promotion.approvalStatus,
      estimatedTime: '1 day',
      assignee: promotion.approver,
    },
    {
      id: 'execution',
      title: 'Execution',
      description: 'Launch promotion',
      status: promotion.status === 'active' ? 'active' : 'pending',
      estimatedTime: '14 days',
      assignee: promotion.manager,
    },
    {
      id: 'analysis',
      title: 'Analysis',
      description: 'Review results',
      status: promotion.completed ? 'completed' : 'pending',
      estimatedTime: '3 days',
      assignee: promotion.analyst,
    },
  ];

  const activeStep = processSteps.findIndex(s => s.status === 'active');

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ProcessTracker
            process={{
              name: `${promotion.name} - Workflow`,
              description: 'Track promotion through approval and execution',
              activeStep: activeStep >= 0 ? activeStep : 0,
            }}
            steps={processSteps}
          />
        </Grid>
        
        <Grid item xs={12}>
          <ProcessStepper
            steps={processSteps}
            activeStep={activeStep >= 0 ? activeStep : 0}
            showTimeEstimates
            interactive
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default PromotionDetail;
```

#### Example: Budget Planning Wizard

```jsx
import React from 'react';
import { ProcessWizard } from './components/common/process-index';

function BudgetPlanningWizard({ onComplete }) {
  const steps = [
    {
      id: 'overview',
      title: 'Budget Overview',
      description: 'Set overall budget parameters',
      content: ({ data, onChange }) => (
        <BudgetOverviewForm data={data} onChange={onChange} />
      ),
      validate: (data) => ({
        valid: data.totalBudget && data.fiscalYear,
        errors: [
          !data.totalBudget && 'Total budget is required',
          !data.fiscalYear && 'Fiscal year is required',
        ].filter(Boolean),
      }),
      help: 'Enter your total budget allocation for the fiscal year',
    },
    {
      id: 'allocation',
      title: 'Department Allocation',
      description: 'Distribute budget across departments',
      content: ({ data, onChange }) => (
        <AllocationForm data={data} onChange={onChange} />
      ),
      validate: (data) => ({
        valid: data.allocations && data.allocations.length > 0,
        errors: [],
      }),
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review budget plan',
      content: ({ data }) => (
        <BudgetSummary data={data} />
      ),
    },
  ];

  return (
    <ProcessWizard
      steps={steps}
      initialData={{ totalBudget: 0, fiscalYear: new Date().getFullYear() }}
      onComplete={onComplete}
      onSave={(data) => console.log('Draft saved', data)}
      enableAI={true}
      title="Budget Planning Wizard"
      subtitle="AI-assisted budget planning and allocation"
    />
  );
}

export default BudgetPlanningWizard;
```

#### Example: Process Flow Visualization

```jsx
import React from 'react';
import { ProcessFlow } from './components/common/process-index';

function ClaimsProcessFlow({ claim }) {
  const nodes = [
    {
      id: 'submission',
      title: 'Claim Submitted',
      description: 'Initial claim submission',
      type: 'Manual',
      duration: '1 day',
      assignee: claim.submitter,
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'Automated validation checks',
      type: 'Automated',
      duration: '2 hours',
      assignee: 'System',
    },
    {
      id: 'review',
      title: 'Manual Review',
      description: 'Claims team review',
      type: 'Manual',
      duration: '1-2 days',
      assignee: claim.reviewer || 'Unassigned',
    },
    {
      id: 'approval',
      title: 'Approval',
      description: 'Final approval',
      type: 'Manual',
      duration: '1 day',
      assignee: claim.approver || 'Pending',
    },
    {
      id: 'payment',
      title: 'Payment Processing',
      description: 'Process payment',
      type: 'Automated',
      duration: '1-3 days',
      assignee: 'Finance System',
    },
  ];

  const activeNode = claim.processSteps.findIndex(s => s.status === 'in_progress');

  return (
    <ProcessFlow
      nodes={nodes}
      activeNode={activeNode >= 0 ? activeNode : 0}
      animated={true}
      onNodeClick={(index) => console.log('Clicked:', nodes[index])}
    />
  );
}

export default ClaimsProcessFlow;
```

---

## Component Selection Guide

### When to Use Each Component

#### ProcessStepper
**Best for:**
- Showing progress through a known sequence
- Step-by-step workflows
- Approval chains
- Onboarding flows

**Example Use Cases:**
- Promotion approval workflow
- Budget allocation process
- User onboarding
- Document review process

#### ProcessTracker
**Best for:**
- Real-time monitoring dashboards
- Process analytics
- Bottleneck identification
- Team performance tracking

**Example Use Cases:**
- Trade spend monitoring
- Claims processing dashboard
- Campaign execution tracking
- SLA compliance monitoring

#### ProcessFlow
**Best for:**
- Visual process documentation
- Complex workflows with branches
- Process mapping
- Training materials

**Example Use Cases:**
- Process documentation
- Workflow visualization
- Decision trees
- Flowchart diagrams

#### ProcessWizard
**Best for:**
- Multi-step forms
- Guided creation flows
- Complex data entry
- AI-assisted workflows

**Example Use Cases:**
- Create new promotion
- Budget planning
- Campaign setup
- Customer onboarding

---

## Customization Examples

### Custom Step Styling

```jsx
<ProcessStepper
  steps={steps}
  activeStep={2}
  renderStepIcon={(step, index, status) => (
    <CustomIcon status={status} />
  )}
  sx={{
    '& .step-content': {
      bgcolor: 'primary.light',
    },
  }}
/>
```

### Custom Themes

```jsx
// Create custom theme for process components
const customTheme = {
  colors: {
    completed: '#10B981',
    active: '#3B82F6',
    pending: '#94A3B8',
    error: '#EF4444',
  },
  animations: {
    enabled: true,
    duration: 300,
  },
};

<ProcessTracker theme={customTheme} />
```

### Custom Actions

```jsx
<ProcessStepper
  steps={steps}
  renderActions={(step, index) => (
    <Box>
      <IconButton onClick={() => handleEdit(step)}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={() => handleDelete(step)}>
        <DeleteIcon />
      </IconButton>
    </Box>
  )}
/>
```

---

## Performance Tips

### 1. Memoize Step Data

```jsx
const steps = useMemo(() => 
  processData.map(mapToStep),
  [processData]
);
```

### 2. Lazy Load Components

```jsx
const ProcessStepper = lazy(() => 
  import('./components/common/ProcessStepper.enhanced')
);
```

### 3. Virtual Scrolling for Long Lists

```jsx
<ProcessStepper
  steps={steps.slice(0, visibleCount)}
  onLoadMore={() => setVisibleCount(prev => prev + 10)}
/>
```

---

## Common Patterns

### Pattern 1: Dashboard + Detail

```jsx
function ProcessDashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ProcessTracker process={process} steps={steps} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ProcessStepper steps={steps} activeStep={activeStep} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ProcessFlow nodes={nodes} activeNode={activeStep} />
      </Grid>
    </Grid>
  );
}
```

### Pattern 2: Wizard with Preview

```jsx
function WizardWithPreview() {
  const [showPreview, setShowPreview] = useState(false);
  
  return (
    <>
      <ProcessWizard steps={steps} onComplete={handleSubmit} />
      <Button onClick={() => setShowPreview(true)}>Preview</Button>
      <PreviewDialog open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  );
}
```

### Pattern 3: Stepper with Form

```jsx
function StepperForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});

  return (
    <Box>
      <ProcessStepper steps={steps} activeStep={activeStep} />
      <FormStep 
        step={steps[activeStep]}
        data={formData}
        onChange={setFormData}
        onNext={() => setActiveStep(prev => prev + 1)}
      />
    </Box>
  );
}
```

---

## Troubleshooting

### Issue: Animations Not Working

**Solution:** Ensure framer-motion is installed and imported:
```bash
npm install framer-motion
```

### Issue: Steps Not Updating

**Solution:** Make sure step data is immutable:
```jsx
// ❌ Wrong
steps[activeStep].status = 'completed';

// ✅ Correct
setSteps(prev => prev.map((step, i) => 
  i === activeStep ? { ...step, status: 'completed' } : step
));
```

### Issue: Performance Issues with Many Steps

**Solution:** Use pagination or virtualization:
```jsx
const visibleSteps = steps.slice(0, 10);
<ProcessStepper steps={visibleSteps} />
```

---

## Best Practices

### ✅ Do

- Use meaningful step titles and descriptions
- Provide time estimates for better user expectations
- Show assignee information for accountability
- Enable interactive navigation when appropriate
- Use AI suggestions for complex workflows
- Implement auto-save for long forms
- Provide contextual help

### ❌ Don't

- Don't overload steps with too much information
- Don't skip validation on critical steps
- Don't hide important actions in menus
- Don't use too many steps (aim for 3-7)
- Don't forget mobile responsiveness
- Don't ignore accessibility requirements

---

## Support

For questions or issues:

1. Check `WORLD_CLASS_PROCESS_UI.md` for detailed documentation
2. Review example code in `ProcessShowcase.jsx`
3. Contact the UI/UX team for design questions
4. Check MUI documentation for underlying components

---

## Updates & Changelog

### v1.0.0 (Current)

- ✨ ProcessStepper with rich metadata
- ✨ ProcessTracker with real-time monitoring
- ✨ ProcessFlow with visual diagrams
- ✨ ProcessWizard with AI assistance
- 🎨 Full design system integration
- ♿ WCAG 2.1 AA compliance
- 📱 Mobile responsive
- ⚡ Performance optimized

### Planned

- [ ] Step dependencies visualization
- [ ] Gantt chart view
- [ ] Collaborative editing
- [ ] Advanced analytics
- [ ] Custom step templates
- [ ] Export to PDF/PNG
