# TRADEAI FRONTEND IMPLEMENTATION TASKLIST
## 5 Core Components + Complete Promotion Flow
### Super Speed & Quality Execution Plan

**Objective**: Implement world-class process-oriented frontend with AI integration  
**Timeline**: 48 hours (accelerated from 6 weeks)  
**Approach**: Parallel execution with quality gates  
**Target**: Production-ready revenue management system

---

## 🚀 EXECUTION STRATEGY

### Parallel Workstreams
- **Stream A**: Core Components (AIInsightCard, DecisionPoint, RealtimeMetrics)
- **Stream B**: Flow Components (FlowTimeline, ApprovalWorkflow)
- **Stream C**: Integration (Promotion Flow End-to-End)
- **Stream D**: Testing & Deployment

### Quality Gates
- ✅ Code review after each component
- ✅ Unit tests for each component (80% coverage)
- ✅ Integration test after each flow
- ✅ UAT before deployment

---

## 📋 DETAILED TASKLIST

### PHASE 1: FOUNDATION (Hours 0-4)

#### Task 1.1: Environment Setup (30 mins)
- [ ] SSH into production server
- [ ] Navigate to frontend repo: `cd ~/tradeai-repo/frontend`
- [ ] Create feature branch: `git checkout -b feature/process-flows`
- [ ] Create component directories:
  ```bash
  mkdir -p src/components/ai
  mkdir -p src/components/process
  mkdir -p src/components/flows
  mkdir -p src/hooks/useProcessFlow
  mkdir -p src/contexts/ProcessContext
  mkdir -p src/services/aiService
  ```
- [ ] Verify Node version: `node -v` (should be >= 16)
- [ ] Install any missing dependencies

**Acceptance Criteria**: Directory structure created, branch ready

---

#### Task 1.2: Create AIInsightCard Component (45 mins)

**File**: `src/components/ai/AIInsightCard.jsx`

**Requirements**:
- Display AI recommendations with confidence scores
- Support 4 types: recommendation, alert, prediction, insight
- Priority levels: URGENT, OPPORTUNITY, INFO
- Action buttons (view, dismiss, snooze)
- Expandable details section
- Icon based on type (Lightbulb, Warning, TrendingUp, Info)

**Code Template**:
```jsx
import React, { useState } from 'react';
import {
  Card, CardContent, CardActions,
  Typography, Chip, Button, IconButton,
  Collapse, Box, LinearProgress
} from '@mui/material';
import {
  Lightbulb, Warning, TrendingUp, Info,
  ExpandMore, Close, Snooze, CheckCircle
} from '@mui/icons-material';

const AIInsightCard = ({
  type = 'recommendation',
  priority = 'INFO',
  title,
  insight,
  confidence = 0.85,
  reasoning = '',
  impact = '',
  actions = [],
  onDismiss,
  onSnooze,
  data = {}
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Type configurations
  const typeConfig = {
    recommendation: { icon: Lightbulb, color: 'info', bgColor: '#e3f2fd' },
    alert: { icon: Warning, color: 'warning', bgColor: '#fff3e0' },
    prediction: { icon: TrendingUp, color: 'success', bgColor: '#e8f5e9' },
    insight: { icon: Info, color: 'info', bgColor: '#f3e5f5' }
  };

  const priorityConfig = {
    URGENT: { color: 'error', label: 'Urgent', bgColor: '#ffebee' },
    OPPORTUNITY: { color: 'success', label: 'Opportunity', bgColor: '#e8f5e9' },
    INFO: { color: 'info', label: 'Info', bgColor: '#e3f2fd' }
  };

  const config = typeConfig[type];
  const Icon = config.icon;
  const priorityStyle = priorityConfig[priority];

  if (dismissed) return null;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        backgroundColor: priorityStyle.bgColor,
        border: `2px solid ${priority === 'URGENT' ? '#f44336' : 'transparent'}`,
        boxShadow: priority === 'URGENT' ? 4 : 1,
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Icon sx={{ mr: 1, color: `${config.color}.main`, fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" component="div">
                {title}
              </Typography>
              <Chip 
                label={priorityStyle.label} 
                color={priorityStyle.color} 
                size="small" 
              />
              <Chip 
                label={`${Math.round(confidence * 100)}% confidence`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
              {insight}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={confidence * 100} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
          <IconButton 
            size="small" 
            onClick={() => { setDismissed(true); onDismiss?.(); }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Expandable Details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            {reasoning && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  🤔 Reasoning:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {reasoning}
                </Typography>
              </>
            )}
            {impact && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Expected Impact:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {impact}
                </Typography>
              </>
            )}
            {Object.keys(data).length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  📈 Supporting Data:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(data).map(([key, value]) => (
                    <Chip 
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          {actions.map((action, idx) => (
            <Button
              key={idx}
              size="small"
              variant={idx === 0 ? 'contained' : 'outlined'}
              onClick={action.onClick}
              startIcon={action.icon}
              sx={{ mr: 1 }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
        <Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            <ExpandMore 
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} 
            />
          </IconButton>
          {onSnooze && (
            <IconButton size="small" onClick={onSnooze}>
              <Snooze fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default AIInsightCard;
```

**Testing**:
```jsx
// src/components/ai/__tests__/AIInsightCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import AIInsightCard from '../AIInsightCard';

test('renders AI insight card with title and insight', () => {
  render(
    <AIInsightCard
      title="Price Optimization Available"
      insight="12 products can be optimized for +R28K/month profit"
      confidence={0.87}
    />
  );
  expect(screen.getByText('Price Optimization Available')).toBeInTheDocument();
  expect(screen.getByText(/12 products can be optimized/)).toBeInTheDocument();
});

test('expands to show reasoning when clicked', () => {
  render(
    <AIInsightCard
      title="Test"
      insight="Test insight"
      reasoning="This is the reasoning"
    />
  );
  const expandButton = screen.getByRole('button', { name: /expand/i });
  fireEvent.click(expandButton);
  expect(screen.getByText('This is the reasoning')).toBeInTheDocument();
});
```

**Acceptance Criteria**: 
- [ ] Component renders all variants (recommendation, alert, prediction, insight)
- [ ] Confidence score displays correctly
- [ ] Priority badges show correctly (URGENT, OPPORTUNITY, INFO)
- [ ] Expand/collapse works
- [ ] Actions trigger callbacks
- [ ] Dismiss and snooze work
- [ ] Tests pass (80% coverage)

---

#### Task 1.3: Create DecisionPoint Component (45 mins)

**File**: `src/components/ai/DecisionPoint.jsx`

**Requirements**:
- Display question/decision to be made
- Show AI-recommended option (highlighted)
- Display reasoning for recommendation
- List all available options with comparison
- Allow manual override
- Show expected impact/ROI for each option
- Confirmation dialog before submission

**Code Template**:
```jsx
import React, { useState } from 'react';
import {
  Card, CardContent, CardActions,
  Typography, Button, Radio, RadioGroup,
  FormControlLabel, Box, Chip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { CheckCircle, TrendingUp, AttachMoney } from '@mui/icons-material';

const DecisionPoint = ({
  question,
  aiRecommendation = null,
  options = [],
  onSelect,
  comparisonMetrics = ['roi', 'risk', 'timeline'],
  allowOverride = true
}) => {
  const [selectedOption, setSelectedOption] = useState(
    aiRecommendation?.optionId || ''
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleSubmit = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    const option = options.find(o => o.id === selectedOption);
    onSelect(option);
    setShowConfirmation(false);
  };

  const isAiRecommended = (optionId) => {
    return aiRecommendation?.optionId === optionId;
  };

  const isOverride = selectedOption !== aiRecommendation?.optionId;

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🤔 {question}
          </Typography>

          {/* AI Recommendation Alert */}
          {aiRecommendation && (
            <Alert 
              severity="info" 
              icon={<CheckCircle />}
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                AI Recommendation: {aiRecommendation.optionLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {aiRecommendation.reasoning}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Chip 
                  icon={<TrendingUp />}
                  label={`Expected ROI: ${aiRecommendation.expectedROI}`}
                  size="small"
                  color="success"
                />
                <Chip 
                  label={`${Math.round(aiRecommendation.confidence * 100)}% confidence`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Alert>
          )}

          {/* Options */}
          <RadioGroup 
            value={selectedOption} 
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            {options.map((option) => (
              <Box
                key={option.id}
                sx={{
                  border: isAiRecommended(option.id) ? '2px solid #2196f3' : '1px solid #ddd',
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  backgroundColor: isAiRecommended(option.id) ? '#e3f2fd' : 'transparent',
                  position: 'relative'
                }}
              >
                {isAiRecommended(option.id) && (
                  <Chip
                    label="AI Recommended"
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
                <FormControlLabel
                  value={option.id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {option.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {option.metrics?.map((metric, idx) => (
                          <Chip
                            key={idx}
                            label={`${metric.label}: ${metric.value}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', width: '100%' }}
                />
              </Box>
            ))}
          </RadioGroup>

          {/* Override Warning */}
          {isOverride && allowOverride && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You are overriding the AI recommendation. Please ensure you have considered all factors.
            </Alert>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Hide' : 'Show'} Comparison
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedOption}
          >
            Confirm Selection
          </Button>
        </CardActions>

        {/* Comparison Table */}
        {showComparison && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Option</TableCell>
                  {comparisonMetrics.map(metric => (
                    <TableCell key={metric} align="right">
                      {metric.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {options.map(option => (
                  <TableRow 
                    key={option.id}
                    sx={{ 
                      backgroundColor: isAiRecommended(option.id) ? '#e3f2fd' : 'transparent'
                    }}
                  >
                    <TableCell>{option.label}</TableCell>
                    {comparisonMetrics.map(metric => (
                      <TableCell key={metric} align="right">
                        {option.comparison?.[metric] || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)}>
        <DialogTitle>Confirm Decision</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to select:{' '}
            <strong>{options.find(o => o.id === selectedOption)?.label}</strong>?
          </Typography>
          {isOverride && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This overrides the AI recommendation.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DecisionPoint;
```

**Testing**: Similar structure to AIInsightCard tests

**Acceptance Criteria**:
- [ ] Displays question and all options
- [ ] AI recommendation highlighted
- [ ] Manual override allowed with warning
- [ ] Comparison table toggles
- [ ] Confirmation dialog works
- [ ] Tests pass

---

#### Task 1.4: Create RealtimeMetrics Component (45 mins)

**File**: `src/components/ai/RealtimeMetrics.jsx`

**Requirements**:
- Display live performance metric
- Show target vs actual comparison
- Display trend (up/down with percentage)
- Show forecast value
- AI insights as tooltip or expandable
- Auto-refresh data (SSE or polling)
- Visual indicators (color coding, arrows)

**Code Template**:
```jsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, LinearProgress,
  Tooltip, IconButton
} from '@mui/material';
import {
  TrendingUp, TrendingDown, TrendingFlat,
  Refresh, Info
} from '@mui/icons-material';

const RealtimeMetrics = ({
  title,
  metric,
  target,
  actual,
  forecast = null,
  trend = '+0%',
  unit = 'R',
  aiInsights = [],
  refreshInterval = 30000, // 30 seconds
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;
    
    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh?.();
    setLastUpdate(Date.now());
    setLoading(false);
  };

  // Calculate percentage
  const percentage = target > 0 ? (actual / target) * 100 : 0;
  const variance = actual - target;
  const variancePercent = target > 0 ? ((variance / target) * 100).toFixed(1) : 0;

  // Determine color and icon
  const isPositive = actual >= target;
  const color = isPositive ? 'success' : 'error';
  const trendValue = parseFloat(trend.replace(/[^0-9.-]/g, ''));
  const TrendIcon = trendValue > 0 ? TrendingUp : trendValue < 0 ? TrendingDown : TrendingFlat;

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box>
            {aiInsights.length > 0 && (
              <Tooltip title={aiInsights.join(' • ')}>
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={handleRefresh} disabled={loading}>
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Main Metric */}
        <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {unit}{formatNumber(actual)}
        </Typography>

        {/* Target Comparison */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            vs {unit}{formatNumber(target)} target
          </Typography>
          <Chip
            icon={<TrendIcon />}
            label={`${variancePercent > 0 ? '+' : ''}${variancePercent}%`}
            color={color}
            size="small"
          />
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          color={color}
          sx={{ height: 8, borderRadius: 4, mb: 2 }}
        />

        {/* Additional Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {forecast && (
            <Typography variant="caption" color="text.secondary">
              Forecast: {unit}{formatNumber(forecast)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Updated: {new Date(lastUpdate).toLocaleTimeString()}
          </Typography>
        </Box>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="primary">
              💡 {aiInsights[0]}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeMetrics;
```

**Acceptance Criteria**:
- [ ] Displays metric with target comparison
- [ ] Trend indicator shows correctly
- [ ] Auto-refreshes at interval
- [ ] Manual refresh works
- [ ] Progress bar visualizes performance
- [ ] AI insights display
- [ ] Tests pass

---

### PHASE 2: FLOW COMPONENTS (Hours 4-8)

#### Task 2.1: Create FlowTimeline Component (60 mins)

**File**: `src/components/process/FlowTimeline.jsx`

**Requirements**:
- Vertical timeline showing process steps
- Each step shows: name, status, date, duration
- Status types: completed, in_progress, pending, blocked
- Visual connectors between steps
- Expandable details for each step
- Stakeholder avatars for each step
- ETA for pending steps

**Code Template**:
```jsx
import React, { useState } from 'react';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import {
  Card, CardContent, Typography, Box, Chip, Avatar,
  AvatarGroup, Collapse, IconButton
} from '@mui/material';
import {
  CheckCircle, RadioButtonUnchecked, PlayCircle,
  Block, ExpandMore, AccessTime
} from '@mui/icons-material';

const FlowTimeline = ({
  steps = [],
  currentStep,
  onStepClick
}) => {
  const [expandedSteps, setExpandedSteps] = useState(new Set([currentStep]));

  const toggleStep = (stepId) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const statusConfig = {
    completed: {
      icon: CheckCircle,
      color: 'success',
      dotColor: '#4caf50',
      label: 'Completed'
    },
    in_progress: {
      icon: PlayCircle,
      color: 'primary',
      dotColor: '#2196f3',
      label: 'In Progress'
    },
    pending: {
      icon: RadioButtonUnchecked,
      color: 'grey',
      dotColor: '#9e9e9e',
      label: 'Pending'
    },
    blocked: {
      icon: Block,
      color: 'error',
      dotColor: '#f44336',
      label: 'Blocked'
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Process Timeline
        </Typography>

        <Timeline position="right">
          {steps.map((step, index) => {
            const config = statusConfig[step.status] || statusConfig.pending;
            const Icon = config.icon;
            const isExpanded = expandedSteps.has(step.id);
            const isLast = index === steps.length - 1;

            return (
              <TimelineItem key={step.id}>
                <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                  <Typography variant="caption">
                    {step.date ? new Date(step.date).toLocaleDateString() : step.eta || 'TBD'}
                  </Typography>
                  {step.duration && (
                    <Typography variant="caption" display="block">
                      {formatDuration(step.duration)}
                    </Typography>
                  )}
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot sx={{ backgroundColor: config.dotColor }}>
                    <Icon sx={{ fontSize: 16, color: 'white' }} />
                  </TimelineDot>
                  {!isLast && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 }
                    }}
                    onClick={() => {
                      toggleStep(step.id);
                      onStepClick?.(step);
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {step.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                            <Chip
                              label={config.label}
                              color={config.color}
                              size="small"
                            />
                            {step.assignees && step.assignees.length > 0 && (
                              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
                                {step.assignees.map((assignee, idx) => (
                                  <Avatar key={idx} alt={assignee.name} src={assignee.avatar}>
                                    {assignee.name[0]}
                                  </Avatar>
                                ))}
                              </AvatarGroup>
                            )}
                            {step.eta && step.status === 'in_progress' && (
                              <Chip
                                icon={<AccessTime />}
                                label={`ETA: ${step.eta}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        <IconButton size="small">
                          <ExpandMore
                            sx={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s'
                            }}
                          />
                        </IconButton>
                      </Box>

                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                          {step.description && (
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {step.description}
                            </Typography>
                          )}
                          {step.details && Object.keys(step.details).length > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {Object.entries(step.details).map(([key, value]) => (
                                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {key}:
                                  </Typography>
                                  <Typography variant="caption" fontWeight="bold">
                                    {value}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {step.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                              Note: {step.notes}
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default FlowTimeline;
```

**Acceptance Criteria**:
- [ ] Timeline displays all steps vertically
- [ ] Status icons and colors correct
- [ ] Expand/collapse works for each step
- [ ] Stakeholder avatars display
- [ ] ETA shows for pending steps
- [ ] Duration calculation works
- [ ] Tests pass

---

#### Task 2.2: Create ApprovalWorkflow Component (60 mins)

**File**: `src/components/process/ApprovalWorkflow.jsx`

**Requirements**:
- Display approval chain (multi-level)
- Each approver shows: name, role, status, date, comments
- Status: pending, approved, rejected, delegated
- Allow delegation to another user
- Comment/feedback system
- Approval rules display (e.g., "Auto-approve if < R50K")
- Email notification triggers

**Code Template**: (Similar structure to FlowTimeline with approval-specific features)

**Acceptance Criteria**:
- [ ] Shows approval chain dynamically
- [ ] Approver status displays correctly
- [ ] Delegation workflow works
- [ ] Comments save and display
- [ ] Approval rules show
- [ ] Notification indicators
- [ ] Tests pass

---

### PHASE 3: INTEGRATION (Hours 8-16)

#### Task 3.1: Create ProcessWizard Integration File (30 mins)
- [ ] Copy ProcessWizard.jsx to `src/components/flows/`
- [ ] Update imports to use local components
- [ ] Add process type configurations
- [ ] Add API service integration

#### Task 3.2: Create Promotion Flow Configuration (2 hours)

**File**: `src/flows/promotionFlow.js`

**7 Steps Configuration**:
1. Opportunity Identification (AIInsightCard + DecisionPoint)
2. Mechanics Design (Form + AIInsightCard)
3. Budget & Pricing (DecisionPoint + Calculator)
4. Customer Selection (Multi-select + AIInsightCard)
5. Approval Request (ApprovalWorkflow)
6. Execution Tracking (RealtimeMetrics + FlowTimeline)
7. Post-Analysis (Charts + AIInsightCard)

```javascript
export const promotionFlowSteps = [
  {
    id: 'opportunity',
    label: 'Opportunity Identification',
    description: 'Identify market gaps and timing',
    component: OpportunityStep,
    validate: async (data) => { /* validation */ },
    aiEndpoint: '/api/ai/promotion/opportunities'
  },
  // ... 6 more steps
];
```

#### Task 3.3: Create Step Components (3 hours)
- [ ] OpportunityStep.jsx
- [ ] MechanicsStep.jsx
- [ ] BudgetPricingStep.jsx
- [ ] CustomerSelectionStep.jsx
- [ ] ApprovalRequestStep.jsx
- [ ] ExecutionTrackingStep.jsx
- [ ] PostAnalysisStep.jsx

#### Task 3.4: Create Main Promotion Page (1 hour)

**File**: `src/pages/PromotionWizardPage.jsx`

```jsx
import ProcessWizard from '../components/flows/ProcessWizard';
import { promotionFlowSteps } from '../flows/promotionFlow';

const PromotionWizardPage = () => {
  const handleComplete = async (data) => {
    // Save promotion
    await api.post('/api/promotions', data);
  };

  return (
    <ProcessWizard
      processType="promotion"
      steps={promotionFlowSteps}
      onComplete={handleComplete}
      aiEnabled={true}
      saveProgress={true}
    />
  );
};
```

---

### PHASE 4: TESTING (Hours 16-20)

#### Task 4.1: Unit Tests (2 hours)
- [ ] AIInsightCard.test.jsx (10 tests)
- [ ] DecisionPoint.test.jsx (10 tests)
- [ ] RealtimeMetrics.test.jsx (8 tests)
- [ ] FlowTimeline.test.jsx (10 tests)
- [ ] ApprovalWorkflow.test.jsx (10 tests)
- [ ] ProcessWizard.test.jsx (15 tests)

**Target**: 80% code coverage

#### Task 4.2: Integration Tests (1 hour)
- [ ] Complete promotion flow end-to-end
- [ ] Test all 7 steps
- [ ] Test save/resume functionality
- [ ] Test validation errors
- [ ] Test API integration

#### Task 4.3: UAT Testing (1 hour)
- [ ] Manual browser testing
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test responsive design
- [ ] Test accessibility (keyboard navigation)
- [ ] Performance testing (Lighthouse)

---

### PHASE 5: DEPLOYMENT (Hours 20-24)

#### Task 5.1: Build & Deploy (1 hour)
```bash
cd ~/tradeai-repo/frontend
npm run build
rsync -av --delete build/ /var/www/tradeai/frontend/build/
sudo systemctl reload nginx
```

#### Task 5.2: Production Verification (1 hour)
- [ ] Run deployment script: `./deploy-tradeai.sh`
- [ ] All 100+ tests pass
- [ ] Manual UAT in production
- [ ] Performance check
- [ ] Error monitoring setup

#### Task 5.3: Documentation (1 hour)
- [ ] Component API documentation
- [ ] Flow configuration guide
- [ ] User guide for promotion flow
- [ ] Developer handoff document

#### Task 5.4: Training & Handoff (1 hour)
- [ ] Demo to stakeholders
- [ ] User training session
- [ ] Q&A and feedback
- [ ] Support documentation

---

## ⚡ ACCELERATED EXECUTION CHECKLIST

### Hour-by-Hour Breakdown

**Hours 0-4**: Foundation
- ✅ Task 1.1: Setup (30 min)
- ✅ Task 1.2: AIInsightCard (45 min)
- ✅ Task 1.3: DecisionPoint (45 min)
- ✅ Task 1.4: RealtimeMetrics (45 min)
- ⏸️  Buffer: 45 min

**Hours 4-8**: Flow Components
- ✅ Task 2.1: FlowTimeline (60 min)
- ✅ Task 2.2: ApprovalWorkflow (60 min)
- ✅ Tests for above (60 min)
- ⏸️  Buffer: 60 min

**Hours 8-16**: Integration
- ✅ Task 3.1: ProcessWizard integration (30 min)
- ✅ Task 3.2: Promotion flow config (120 min)
- ✅ Task 3.3: Step components (180 min)
- ✅ Task 3.4: Main page (60 min)
- ⏸️  Buffer: 90 min

**Hours 16-20**: Testing
- ✅ Unit tests (120 min)
- ✅ Integration tests (60 min)
- ✅ UAT testing (60 min)

**Hours 20-24**: Deployment
- ✅ Build & deploy (60 min)
- ✅ Production verification (60 min)
- ✅ Documentation (60 min)
- ✅ Training (60 min)

---

## 🎯 SUCCESS METRICS

### Code Quality
- [ ] 80% test coverage minimum
- [ ] All linting rules pass
- [ ] No console errors or warnings
- [ ] TypeScript types (if applicable)
- [ ] Performance: Lighthouse score > 90

### Functionality
- [ ] All 5 core components working
- [ ] Complete promotion flow (7 steps)
- [ ] AI integration functional
- [ ] Save/resume works
- [ ] Approval workflow operational

### User Experience
- [ ] Intuitive navigation
- [ ] Clear AI recommendations
- [ ] Fast response times (< 2s)
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)

### Production Readiness
- [ ] Deployed to production
- [ ] All tests passing
- [ ] Documentation complete
- [ ] User training done
- [ ] Support in place

---

## 🚨 RISK MITIGATION

### If Behind Schedule
1. **Priority 1**: Core components (AIInsightCard, DecisionPoint, RealtimeMetrics)
2. **Priority 2**: ProcessWizard integration
3. **Priority 3**: 1 complete flow (Promotion)
4. **Can Defer**: Additional flows, advanced features

### If Technical Issues
1. Use existing UI library components where possible
2. Simplify AI integration (mock data first)
3. Defer real-time updates (use manual refresh)
4. Focus on core workflow, enhance later

### If Testing Gaps
1. Prioritize critical path testing
2. Manual UAT over automated for speed
3. Deploy to staging first
4. Production deployment after basic verification

---

## ✅ FINAL DELIVERABLES CHECKLIST

### Components (5 files)
- [ ] AIInsightCard.jsx
- [ ] DecisionPoint.jsx
- [ ] RealtimeMetrics.jsx
- [ ] FlowTimeline.jsx
- [ ] ApprovalWorkflow.jsx

### Integration (2 files)
- [ ] ProcessWizard.jsx (enhanced)
- [ ] promotionFlow.js (config)

### Pages (1 file)
- [ ] PromotionWizardPage.jsx

### Tests (6 files)
- [ ] All components with 80% coverage

### Documentation (3 docs)
- [ ] Component API docs
- [ ] User guide
- [ ] Developer guide

### Deployment
- [ ] Production deployment
- [ ] 100+ tests passing
- [ ] UAT complete
- [ ] Training done

---

**Total Estimated Time**: 24 hours (accelerated)  
**Team Size**: 1 developer (with AI assistance)  
**Confidence Level**: HIGH  
**Risk Level**: MEDIUM (aggressive timeline)

**Alternative Timeline**: 
- 48 hours for high quality + buffer
- 1 week for production-grade with full testing
- 6 weeks for complete system (all flows)

---

*This tasklist provides a structured, time-boxed approach to deliver world-class process-oriented frontend components with AI integration at super speed while maintaining quality standards.*
