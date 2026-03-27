/**
 * TRADEAI Enhanced Components Index
 * Central export for all enhanced UI components
 */

// Templates
export { default as ListPageTemplate } from './templates/ListPage.enhanced';
export { default as DetailPageTemplate, InfoRow, StatsGrid, ActivityTimeline } from './templates/DetailPage.enhanced';
export { default as FormPageTemplate, FieldGroup, RepeatingFieldGroup } from './templates/FormPage.enhanced';

// Shared Components
export { default as KPICard, KPICompact, KPIWithSparkline } from './shared/KPICard.enhanced';
export { default as PageHeader, SimplePageHeader, StatsPageHeader } from './shared/PageHeader.enhanced';

// State Components
export {
  default as EmptyState,
  EmptyTableState,
  SearchEmptyState,
  FilterEmptyState,
  FirstTimeState,
  PermissionDeniedState,
  MaintenanceState,
} from './states/EmptyState.enhanced';

export {
  PageLoader,
  CardSkeleton,
  DashboardSkeleton,
  TableSkeleton,
  FormSkeleton,
  InlineLoader,
  ContentPlaceholder,
  Shimmer,
} from './states/LoadingState.enhanced';

// Re-export from original components for backward compatibility
export { default as KPICardOriginal } from './shared/KPICard.original';
export { default as PageHeaderOriginal } from './shared/PageHeader.original';
