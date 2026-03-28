/**
 * TypeScript Type Definitions for Process UI Components
 * World-class type safety for all process components
 */

import { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Base Types
// ============================================================================

export type StepStatus = 'pending' | 'active' | 'completed' | 'error' | 'warning' | 'blocked';

export type Orientation = 'horizontal' | 'vertical';

export type Variant = 'default' | 'elevated' | 'outlined';

export type Size = 'small' | 'medium' | 'large';

// ============================================================================
// Step/Node Data Types
// ============================================================================

export interface StepMetadata {
  /** Unique identifier for the step */
  id: string;
  /** Display title */
  title: string;
  /** Optional description */
  description?: string;
  /** Current status of the step */
  status?: StepStatus;
  /** Estimated time to complete (e.g., "2 days", "3 hours") */
  estimatedTime?: string;
  /** Actual time taken (e.g., "1.5 days") */
  actualTime?: string;
  /** Estimated duration in minutes */
  estimatedMinutes?: number;
  /** Actual duration in minutes */
  actualMinutes?: number;
  /** Person responsible for this step */
  assignee?: string;
  /** Confidence score (0-100) */
  confidence?: number;
  /** Timestamp (e.g., "Jan 15, 2024") */
  timestamp?: string;
  /** Prerequisites that must be completed first */
  prerequisites?: string[];
  /** Dependencies on other steps */
  dependencies?: string[];
  /** Custom data payload */
  data?: Record<string, any>;
}

export interface ProcessStep extends StepMetadata {
  /** Detailed content shown when expanded */
  details?: ReactNode | (() => ReactNode);
  /** Validation function for wizard steps */
  validate?: (data: any) => ValidationResult;
  /** Form content for wizard steps */
  content?: (props: StepContentProps) => ReactNode;
  /** Help text or component */
  help?: string | ReactNode | (() => ReactNode);
  /** Whether step is completed */
  completed?: boolean;
  /** Whether step is blocked */
  blocked?: boolean;
}

export interface FlowNode extends StepMetadata {
  /** Node type (Manual, Automated, Hybrid, etc.) */
  type?: string;
  /** Duration display text */
  duration?: string;
  /** Node position coordinates (for custom layouts) */
  x?: number;
  y?: number;
}

export interface FlowEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge label */
  label?: string;
  /** Edge type (default, conditional, parallel) */
  type?: 'default' | 'conditional' | 'parallel';
  /** Condition for conditional edges */
  condition?: string;
}

// ============================================================================
// Process Data Types
// ============================================================================

export interface ProcessMetadata {
  /** Process name */
  name: string;
  /** Process description */
  description?: string;
  /** Current active step index */
  activeStep: number;
  /** Process ID */
  id?: string;
  /** Process type */
  type?: string;
  /** Start date */
  startDate?: Date | string;
  /** End date */
  endDate?: Date | string;
  /** Process owner */
  owner?: string;
  /** Tags or categories */
  tags?: string[];
}

export interface ProcessMetrics {
  /** Overall progress percentage (0-100) */
  progress: number;
  /** Completed steps count */
  completed: number;
  /** In-progress steps count */
  inProgress: number;
  /** Pending steps count */
  pending: number;
  /** Blocked steps count */
  blocked: number;
  /** Error steps count */
  errors: number;
  /** Estimated time remaining (minutes) */
  estimatedTimeRemaining?: number;
  /** Actual time elapsed (minutes) */
  actualTimeElapsed?: number;
  /** Bottleneck step IDs */
  bottlenecks?: string[];
  /** Health score (0-100) */
  healthScore?: number;
}

// ============================================================================
// Wizard Types
// ============================================================================

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
}

export interface StepContentProps {
  /** Current step data */
  data: any;
  /** Data change handler */
  onChange: (data: any) => void;
  /** Validation errors */
  errors: Record<string, string[]>;
  /** Step metadata */
  step: ProcessStep;
  /** All form data */
  formData?: any;
}

export interface WizardStep extends ProcessStep {
  /** Step order/index */
  order?: number;
  /** Whether step is optional */
  optional?: boolean;
  /** Whether step can be skipped */
  skippable?: boolean;
}

export interface WizardConfig {
  /** Wizard title */
  title: string;
  /** Wizard subtitle */
  subtitle?: string;
  /** Array of wizard steps */
  steps: WizardStep[];
  /** Initial form data */
  initialData?: Record<string, any>;
  /** Whether to enable AI assistance */
  enableAI?: boolean;
  /** Whether to enable auto-save */
  autoSave?: boolean;
  /** Auto-save interval (ms) */
  autoSaveInterval?: number;
  /** Show preview before submit */
  showPreview?: boolean;
  /** Show help buttons */
  showHelp?: boolean;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ProcessStepperProps {
  /** Array of process steps */
  steps: ProcessStep[];
  /** Current active step index */
  activeStep?: number;
  /** Layout orientation */
  orientation?: Orientation;
  /** Compact mode (progress bar only) */
  compact?: boolean;
  /** Enable interactive step navigation */
  interactive?: boolean;
  /** Step click handler */
  onStepClick?: (index: number, step: ProcessStep) => void;
  /** Show time estimates */
  showTimeEstimates?: boolean;
  /** Show confidence indicators */
  showConfidence?: boolean;
  /** Enable animations */
  animated?: boolean;
  /** Visual variant */
  variant?: Variant;
  /** Custom CSS */
  sx?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Custom step icon renderer */
  renderStepIcon?: (step: ProcessStep, index: number, status: StepStatus) => ReactNode;
  /** Custom actions renderer */
  renderActions?: (step: ProcessStep, index: number) => ReactNode;
}

export interface ProcessTrackerProps {
  /** Process metadata */
  process: ProcessMetadata;
  /** Process steps */
  steps: ProcessStep[];
  /** Loading state */
  loading?: boolean;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Pause handler */
  onPause?: () => void;
  /** Resume handler */
  onResume?: () => void;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Custom CSS */
  sx?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Show metrics */
  showMetrics?: boolean;
  /** Show time estimates */
  showTimeEstimates?: boolean;
  /** Auto-refresh interval (ms) */
  autoRefreshInterval?: number;
}

export interface ProcessFlowProps {
  /** Flow nodes */
  nodes: FlowNode[];
  /** Flow edges (optional, auto-generated for linear) */
  edges?: FlowEdge[];
  /** Currently active node index */
  activeNode?: number;
  /** Enable animations */
  animated?: boolean;
  /** Node click handler */
  onNodeClick?: (index: number, node: FlowNode) => void;
  /** Node double-click handler */
  onNodeDoubleClick?: (index: number, node: FlowNode) => void;
  /** Custom node renderer */
  renderNode?: (node: FlowNode, index: number, isActive: boolean) => ReactNode;
  /** Custom edge renderer */
  renderEdge?: (edge: FlowEdge) => ReactNode;
  /** Initial zoom level */
  initialZoom?: number;
  /** Min zoom level */
  minZoom?: number;
  /** Max zoom level */
  maxZoom?: number;
  /** Custom CSS */
  sx?: CSSProperties;
  /** Custom class name */
  className?: string;
}

export interface ProcessWizardProps {
  /** Wizard configuration */
  steps: WizardStep[];
  /** Initial form data */
  initialData?: Record<string, any>;
  /** Completion handler */
  onComplete: (data: any) => Promise<void> | void;
  /** Save handler (for drafts) */
  onSave?: (data: any) => Promise<void> | void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Enable AI assistance */
  enableAI?: boolean;
  /** Enable auto-save */
  autoSave?: boolean;
  /** Wizard title */
  title?: string;
  /** Wizard subtitle */
  subtitle?: string;
  /** AI service endpoint */
  aiEndpoint?: string;
  /** Custom CSS */
  sx?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Submit button text */
  submitButtonText?: string;
  /** Next button text */
  nextButtonText?: string;
  /** Back button text */
  backButtonText?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface StepChangeEvent {
  /** Step index */
  index: number;
  /** Step data */
  step: ProcessStep;
  /** Previous step index */
  previousIndex?: number;
  /** Change type */
  changeType: 'next' | 'back' | 'jump' | 'complete';
  /** Timestamp */
  timestamp: Date;
}

export interface ProcessUpdateEvent {
  /** Process ID */
  processId: string;
  /** Updated steps */
  steps: ProcessStep[];
  /** New active step */
  activeStep: number;
  /** Update type */
  updateType: 'progress' | 'status' | 'complete' | 'error';
  /** Timestamp */
  timestamp: Date;
}

export interface WizardSubmitEvent {
  /** All form data */
  data: Record<string, any>;
  /** Completion time */
  completionTime: Date;
  /** Time spent per step */
  stepTimes: Record<string, number>;
  /** Total steps */
  totalSteps: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ProcessApiResponse {
  /** Success status */
  success: boolean;
  /** Process data */
  data?: ProcessMetadata & { steps: ProcessStep[] };
  /** Error message */
  error?: string;
  /** Status code */
  statusCode?: number;
}

export interface WizardApiResponse {
  /** Success status */
  success: boolean;
  /** Saved data */
  data?: Record<string, any>;
  /** Draft ID */
  draftId?: string;
  /** Error message */
  error?: string;
}

export interface AIRecommendation {
  /** Recommendation ID */
  id: string;
  /** Recommendation type */
  type: 'optimization' | 'warning' | 'suggestion' | 'insight';
  /** Recommendation title */
  title: string;
  /** Recommendation description */
  description: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Impact level (low, medium, high) */
  impact: 'low' | 'medium' | 'high';
  /** Suggested action */
  action?: string;
  /** Related step IDs */
  relatedSteps?: string[];
}

export interface AISuggestionsResponse {
  /** Success status */
  success: boolean;
  /** Array of recommendations */
  recommendations: AIRecommendation[];
  /** Overall confidence */
  overallConfidence?: number;
  /** Error message */
  error?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type StepId = string;

export type ProcessId = string;

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  secondary: string;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  StepMetadata as IStepMetadata,
  ProcessStep as IProcessStep,
  FlowNode as IFlowNode,
  ProcessMetadata as IProcessMetadata,
  WizardConfig as IWizardConfig,
};
