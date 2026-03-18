import React, { useState } from 'react';
import {
  Box, Button, Chip, Stack, Typography, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert
} from '@mui/material';
import {
  Send, Check, X, ArrowLeft, Copy, Edit, Trash2, RotateCcw,
  DollarSign, FileCheck, AlertTriangle
} from 'lucide-react';
import StatusChip from './StatusChip';

/**
 * QuickActionBar — Status display + contextual action buttons for detail pages.
 * Shows current status with visual indicator and available transitions.
 */

const STATUS_TRANSITIONS = {
  draft: [
    { action: 'submit', label: 'Submit for Approval', icon: <Send size={16} />, color: 'primary', confirm: true, confirmMsg: 'Submit this item for approval?' },
    { action: 'edit', label: 'Edit', icon: <Edit size={16} />, color: 'inherit' },
    { action: 'delete', label: 'Delete', icon: <Trash2 size={16} />, color: 'error', confirm: true, confirmMsg: 'Delete this draft permanently?' },
  ],
  pending_approval: [
    { action: 'approve', label: 'Approve', icon: <Check size={16} />, color: 'success', confirm: true, confirmMsg: 'Approve this item?', requireComment: false },
    { action: 'reject', label: 'Reject', icon: <X size={16} />, color: 'error', confirm: true, confirmMsg: 'Reject this item?', requireComment: true },
    { action: 'return', label: 'Return to Draft', icon: <ArrowLeft size={16} />, color: 'warning', confirm: true, confirmMsg: 'Return this item to draft?' },
  ],
  approved: [
    { action: 'activate', label: 'Activate', icon: <Check size={16} />, color: 'success' },
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'primary' },
  ],
  active: [
    { action: 'settle', label: 'Settle', icon: <DollarSign size={16} />, color: 'primary', confirm: true, confirmMsg: 'Begin settlement process?' },
    { action: 'complete', label: 'Complete', icon: <FileCheck size={16} />, color: 'success', confirm: true, confirmMsg: 'Mark as completed?' },
    { action: 'cancel', label: 'Cancel', icon: <X size={16} />, color: 'error', confirm: true, confirmMsg: 'Cancel this active item?' },
  ],
  completed: [
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'primary' },
  ],
  rejected: [
    { action: 'resubmit', label: 'Resubmit', icon: <RotateCcw size={16} />, color: 'primary', confirm: true, confirmMsg: 'Resubmit for approval?' },
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'inherit' },
  ],
  cancelled: [
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'inherit' },
  ],
  settled: [
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'inherit' },
  ],
  // Claim-specific statuses
  submitted: [
    { action: 'approve', label: 'Approve', icon: <Check size={16} />, color: 'success', confirm: true, confirmMsg: 'Approve this item?', requireComment: false },
    { action: 'reject', label: 'Reject', icon: <X size={16} />, color: 'error', confirm: true, confirmMsg: 'Reject this item?', requireComment: true },
    { action: 'return', label: 'Return to Draft', icon: <ArrowLeft size={16} />, color: 'warning', confirm: true, confirmMsg: 'Return this item to draft?' },
  ],
  under_review: [
    { action: 'approve', label: 'Approve', icon: <Check size={16} />, color: 'success', confirm: true, confirmMsg: 'Approve this item?', requireComment: false },
    { action: 'reject', label: 'Reject', icon: <X size={16} />, color: 'error', confirm: true, confirmMsg: 'Reject this item?', requireComment: true },
  ],
  pending: [
    { action: 'submit', label: 'Submit for Approval', icon: <Send size={16} />, color: 'primary', confirm: true, confirmMsg: 'Submit this item for approval?' },
    { action: 'edit', label: 'Edit', icon: <Edit size={16} />, color: 'inherit' },
    { action: 'delete', label: 'Delete', icon: <Trash2 size={16} />, color: 'error', confirm: true, confirmMsg: 'Delete this item permanently?' },
  ],
  // Deduction-specific statuses
  open: [
    { action: 'approve', label: 'Validate', icon: <Check size={16} />, color: 'success', confirm: true, confirmMsg: 'Validate this deduction?' },
    { action: 'reject', label: 'Dispute', icon: <AlertTriangle size={16} />, color: 'warning', confirm: true, confirmMsg: 'Dispute this deduction?', requireComment: true },
  ],
  validated: [
    { action: 'settle', label: 'Resolve', icon: <DollarSign size={16} />, color: 'primary', confirm: true, confirmMsg: 'Resolve this deduction?' },
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'inherit' },
  ],
  disputed: [
    { action: 'settle', label: 'Resolve', icon: <DollarSign size={16} />, color: 'primary', confirm: true, confirmMsg: 'Resolve this disputed deduction?' },
    { action: 'clone', label: 'Clone', icon: <Copy size={16} />, color: 'inherit' },
  ],
};

const QuickActionBar = ({
  status,
  entityType,
  entityId,
  entityName,
  onAction,
  customActions,
  budgetInfo,
  createdAt,
  updatedAt,
  owner,
  sx = {},
}) => {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  const normalizedStatus = (status || 'draft').toLowerCase().replace(/\s+/g, '_');
  const availableActions = customActions || STATUS_TRANSITIONS[normalizedStatus] || [];

  const handleAction = async (action) => {
    if (action.confirm) {
      setConfirmDialog(action);
      return;
    }
    await executeAction(action.action);
  };

  const executeAction = async (actionName, actionComment) => {
    setActionLoading(actionName);
    setActionError(null);
    try {
      if (onAction) {
        await onAction(actionName, { comment: actionComment, entityId, entityType });
      }
      setConfirmDialog(null);
      setComment('');
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          ...sx,
        }}
      >
        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">Status:</Typography>
          <StatusChip status={status} />
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Metadata */}
        {owner && (
          <Typography variant="body2" color="text.secondary">
            Owner: <strong>{owner}</strong>
          </Typography>
        )}

        {/* Budget info */}
        {budgetInfo && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Budget:</Typography>
              <Chip
                size="small"
                label={`R ${new Intl.NumberFormat('en-ZA').format(budgetInfo.spent || 0)} / R ${new Intl.NumberFormat('en-ZA').format(budgetInfo.total || 0)}`}
                color={budgetInfo.spent > budgetInfo.total ? 'error' : 'default'}
                variant="outlined"
              />
            </Box>
          </>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Action error */}
        {actionError && (
          <Alert severity="error" sx={{ py: 0, px: 1 }} onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={1}>
          {availableActions.map((action) => (
            <Button
              key={action.action}
              size="small"
              variant={action.action === 'approve' || action.action === 'submit' ? 'contained' : 'outlined'}
              color={action.color || 'primary'}
              startIcon={action.icon}
              onClick={() => handleAction(action)}
              disabled={actionLoading !== null}
            >
              {actionLoading === action.action ? 'Processing...' : action.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Confirmation dialog */}
      <Dialog
        open={Boolean(confirmDialog)}
        onClose={() => { setConfirmDialog(null); setComment(''); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle size={20} color="#ed6c02" />
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {confirmDialog?.confirmMsg}
          </Typography>
          {confirmDialog?.requireComment && (
            <TextField
              label="Comment (required)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              multiline
              rows={2}
              required
              placeholder="Please provide a reason..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmDialog(null); setComment(''); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog?.color || 'primary'}
            onClick={() => executeAction(confirmDialog?.action, comment)}
            disabled={confirmDialog?.requireComment && !comment.trim()}
          >
            {confirmDialog?.label || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickActionBar;
