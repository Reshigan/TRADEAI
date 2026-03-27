/**
 * Enhanced DetailPage Template
 * Professional detail page with tabs, actions, and consistent layout
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Skeleton,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowLeft,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Share2,
  Printer,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  Copy,
  ExternalLink,
  Star,
  Clock,
  User,
  Calendar,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../states/EmptyState.enhanced';
import LoadingState, { CardSkeleton } from '../states/LoadingState.enhanced';

/**
 * Professional Detail Page Template
 * Use this as a base for all detail pages in the application
 */
export default function DetailPageTemplate({
  // Data
  item = null,
  loading = false,
  error = null,
  
  // Configuration
  titleField = 'name',
  subtitleField = null,
  statusField = 'status',
  avatarField = null,
  
  // Tabs
  tabs = [],
  activeTab = 0,
  onTabChange,
  
  // Actions
  onBack,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onShare,
  customActions = [],
  
  // Status configuration
  statusConfig = {},
  
  // Customization
  renderHeader = null,
  renderContent = null,
  children,
}) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get display values
  const title = item?.[titleField] || 'Untitled';
  const subtitle = subtitleField ? item?.[subtitleField] : null;
  const status = statusField ? item?.[statusField] : null;
  const avatarValue = avatarField ? item?.[avatarField] : title?.charAt(0);
  
  // Status configuration
  const getStatusConfig = (statusValue) => {
    const defaults = {
      draft: { label: 'Draft', color: 'default', bg: '#F1F5F9', text: '#475569' },
      pending: { label: 'Pending', color: 'warning', bg: '#FEF3C7', text: '#92400E' },
      pending_approval: { label: 'Pending Approval', color: 'warning', bg: '#FEF3C7', text: '#92400E' },
      approved: { label: 'Approved', color: 'info', bg: '#DBEAFE', text: '#1E40AF' },
      active: { label: 'Active', color: 'success', bg: '#D1FAE5', text: '#065F46' },
      completed: { label: 'Completed', color: 'default', bg: '#F3F4F6', text: '#374151' },
      cancelled: { label: 'Cancelled', color: 'error', bg: '#FEE2E2', text: '#991B1B' },
      rejected: { label: 'Rejected', color: 'error', bg: '#FEE2E2', text: '#991B1B' },
    };
    return statusConfig[statusValue] || defaults[statusValue] || defaults.draft;
  };
  
  // Handlers
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(item);
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton width={400} height={20} />
        </Box>
        <CardSkeleton variant="default" />
      </Box>
    );
  }
  
  // Error state
  if (error || !item) {
    return (
      <EmptyState
        variant="error"
        title="Item Not Found"
        description={error?.message || "The item you're looking for doesn't exist or has been removed."}
        action={{
          label: 'Go Back',
          onClick: handleBack,
          icon: <ArrowLeft size={18} />,
        }}
      />
    );
  }
  
  const statusCfg = status ? getStatusConfig(status) : null;
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 3 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs separator={<ChevronRight size={16} />} sx={{ mb: 2 }}>
            <Link
              color="text.secondary"
              onClick={handleBack}
              sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Back
            </Link>
            <Typography color="text.primary">{title}</Typography>
          </Breadcrumbs>
          
          {/* Title and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* Avatar */}
              {avatarValue && (
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {avatarValue.toUpperCase()}
                </Avatar>
              )}
              
              {/* Title Block */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h1" sx={{ fontSize: '1.875rem', fontWeight: 700 }}>
                    {title}
                  </Typography>
                  {statusCfg && (
                    <Chip
                      label={statusCfg.label}
                      sx={{
                        bgcolor: statusCfg.bg,
                        color: statusCfg.text,
                        fontWeight: 600,
                        height: 28,
                        borderRadius: 1.5,
                      }}
                    />
                  )}
                </Box>
                {subtitle && (
                  <Typography variant="body1" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
                
                {/* Meta Information */}
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                  {item?.created_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Calendar size={14} color="#94A3B8" />
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(item.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {item?.updated_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock size={14} color="#94A3B8" />
                      <Typography variant="caption" color="text.secondary">
                        Updated {new Date(item.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {item?.owner_name && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <User size={14} color="#94A3B8" />
                      <Typography variant="caption" color="text.secondary">
                        {item.owner_name}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Primary Actions */}
              {onEdit && (
                <Button
                  variant="contained"
                  startIcon={<Edit2 size={18} />}
                  onClick={() => onEdit(item)}
                  sx={{ fontWeight: 600 }}
                >
                  Edit
                </Button>
              )}
              
              {/* Secondary Actions */}
              <Tooltip title="More Actions">
                <IconButton onClick={handleMenuOpen} sx={{ bgcolor: 'background.subtle' }}>
                  <MoreVertical size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Quick Stats Row */}
          {renderHeader && (
            <Box sx={{ mt: 3 }}>
              {renderHeader(item)}
            </Box>
          )}
        </Box>
        
        {/* Tabs */}
        {tabs.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 3 }}>
              <Tabs
                value={activeTab}
                onChange={onTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                  '& .MuiTab-root': {
                    minHeight: 56,
                    fontWeight: 500,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                  },
                }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {tab.icon}
                        {tab.label}
                        {tab.badge !== undefined && (
                          <Chip
                            label={tab.badge}
                            size="small"
                            sx={{
                              height: 20,
                              minWidth: 20,
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              bgcolor: 'primary.50',
                              color: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>
          </>
        )}
      </Box>
      
      {/* Content Section */}
      <Box sx={{ p: 3 }}>
        {renderContent ? (
          renderContent(item, activeTab)
        ) : (
          children
        )}
      </Box>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: 'lg',
          },
        }}
      >
        {onDuplicate && (
          <MenuItem onClick={() => { onDuplicate(item); handleMenuClose(); }}>
            <Copy size={18} style={{ marginRight: 12 }} />
            Duplicate
          </MenuItem>
        )}
        {onExport && (
          <MenuItem onClick={() => { onExport(item); handleMenuClose(); }}>
            <Download size={18} style={{ marginRight: 12 }} />
            Export
          </MenuItem>
        )}
        {onShare && (
          <MenuItem onClick={() => { onShare(item); handleMenuClose(); }}>
            <Share2 size={18} style={{ marginRight: 12 }} />
            Share
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleMenuClose(); }}>
          <Printer size={18} style={{ marginRight: 12 }} />
          Print
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); }}>
          <History size={18} style={{ marginRight: 12 }} />
          View History
        </MenuItem>
        {onDelete && (
          <>
            <Divider />
            <MenuItem
              onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <Trash2 size={18} style={{ marginRight: 12 }} />
              Delete
            </MenuItem>
          </>
        )}
        {customActions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              action.onClick(item);
              handleMenuClose();
            }}
            sx={{ color: action.color || 'inherit' }}
          >
            {action.icon && <action.icon size={18} style={{ marginRight: 12 }} />}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'error.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={24} color="#DC2626" />
            </Box>
            <Typography variant="h5" fontWeight={600}>Delete Item?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography color="text.secondary">
            Are you sure you want to delete "{title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * Info Row Component for Detail Pages
 */
export function InfoRow({ label, value, icon: Icon, copyable = false, onCopy }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    if (copyable && onCopy) {
      onCopy(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <Box sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {Icon && <Icon size={16} color="#94A3B8" />}
        <Typography variant="body2" fontWeight={500}>
          {value || '-'}
        </Typography>
        {copyable && value && (
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={handleCopy}>
              <Copy size={14} color={copied ? '#059669' : '#94A3B8'} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

/**
 * Stats Grid for Detail Pages
 */
export function StatsGrid({ stats = [] }) {
  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                {stat.icon && (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <stat.icon size={20} color={stat.color} />
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
              {stat.trend && (
                <Typography
                  variant="caption"
                  sx={{
                    color: stat.trend > 0 ? '#059669' : '#DC2626',
                    fontWeight: 600,
                  }}
                >
                  {stat.trend > 0 ? '+' : ''}{stat.trend}% vs last period
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Activity Timeline for Detail Pages
 */
export function ActivityTimeline({ activities = [] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Activity Timeline
        </Typography>
        <Box sx={{ position: 'relative', pl: 3, ml: 1 }}>
          {/* Timeline Line */}
          <Box
            sx={{
              position: 'absolute',
              left: 7,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: 'divider',
            }}
          />
          
          {/* Activities */}
          {activities.map((activity, index) => (
            <Box key={index} sx={{ position: 'relative', mb: 3 }}>
              {/* Timeline Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -26,
                  top: 4,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: activity.color || 'primary.main',
                  border: '3px solid',
                  borderColor: 'background.paper',
                }}
              />
              
              {/* Activity Content */}
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {activity.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.description}
                </Typography>
                <Typography variant="caption" color="text.tertiary" sx={{ display: 'block', mt: 0.5 }}>
                  {new Date(activity.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
