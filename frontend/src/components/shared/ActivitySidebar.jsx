import React from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Divider, Avatar, Skeleton,
  IconButton, Tooltip, LinearProgress
} from '@mui/material';
import {
  Clock, FileText, DollarSign, CheckCircle, XCircle,
  Send, Edit, ArrowRight, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

/**
 * ActivitySidebar — Right-side contextual panel for detail pages.
 * Shows: Quick Stats, Activity Feed, Related Entities.
 */

const ACTION_ICONS = {
  created: <FileText size={14} />,
  submitted: <Send size={14} />,
  approved: <CheckCircle size={14} color="#10B981" />,
  rejected: <XCircle size={14} color="#EF4444" />,
  activated: <CheckCircle size={14} color="#1976D2" />,
  updated: <Edit size={14} />,
  settled: <DollarSign size={14} />,
  completed: <CheckCircle size={14} color="#10B981" />,
  cancelled: <XCircle size={14} color="#9e9e9e" />,
  default: <Clock size={14} />,
};

const QuickStatCard = ({ label, value, subValue, progress, color = 'primary' }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{value}</Typography>
    {subValue && <Typography variant="caption" color="text.secondary">{subValue}</Typography>}
    {progress !== undefined && (
      <LinearProgress
        variant="determinate"
        value={Math.min(progress, 100)}
        color={progress > 100 ? 'error' : color}
        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
      />
    )}
  </Box>
);

const ActivityItem = ({ action, user, timestamp, detail }) => {
  const icon = ACTION_ICONS[action?.toLowerCase()] || ACTION_ICONS.default;
  const timeStr = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : '';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, py: 1 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.hover', color: 'text.secondary' }}>
        {icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {user || 'System'} {action?.toLowerCase() || 'updated'}
        </Typography>
        {detail && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {detail}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {timeStr}
        </Typography>
      </Box>
    </Box>
  );
};

const RelatedEntity = ({ type, name, id, path, status }) => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        cursor: path ? 'pointer' : 'default',
        '&:hover': path ? { bgcolor: 'action.hover' } : {},
      }}
      onClick={() => path && navigate(path)}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">{type}</Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{name || id || '—'}</Typography>
      </Box>
      {status && <Chip label={status} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
      {path && <ArrowRight size={14} color="#9e9e9e" />}
    </Box>
  );
};

const ActivitySidebar = ({
  stats = [],
  activities = [],
  relatedEntities = [],
  loading = false,
  onRefresh,
  sx = {},
}) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* Quick Stats */}
      {stats.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Quick Stats
          </Typography>
          {loading ? (
            <>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </>
          ) : (
            stats.map((stat, idx) => (
              <QuickStatCard key={idx} {...stat} />
            ))
          )}
        </Paper>
      )}

      {/* Activity Feed */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
            Activity
          </Typography>
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={onRefresh}>
                <RefreshCw size={14} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {loading ? (
          <>
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </>
        ) : activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No activity yet
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {activities.slice(0, 10).map((activity, idx) => (
              <ActivityItem key={idx} {...activity} />
            ))}
          </Stack>
        )}
      </Paper>

      {/* Related Entities */}
      {relatedEntities.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Related
          </Typography>
          {loading ? (
            <>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </>
          ) : (
            <Stack>
              {relatedEntities.map((entity, idx) => (
                <RelatedEntity key={idx} {...entity} />
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ActivitySidebar;
