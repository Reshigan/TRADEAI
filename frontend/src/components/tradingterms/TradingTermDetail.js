import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  Card,
  CardContent
} from '@mui/material';

const TradingTermDetail = ({ open, onClose, term }) => {
  if (!term) return null;

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'error',
      expired: 'secondary',
      suspended: 'error'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'error'
    };
    return colors[priority] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {term.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={term.approvalWorkflow.status}
              color={getStatusColor(term.approvalWorkflow.status)}
              size="small"
            />
            <Chip
              label={term.priority}
              color={getPriorityColor(term.priority)}
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {term.code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {term.termType}
                    </Typography>
                  </Grid>
                  {term.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {term.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Validity Period */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Validity Period
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(term.validityPeriod.startDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(term.validityPeriod.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  {term.validityPeriod.autoRenewal && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Auto Renewal
                      </Typography>
                      <Typography variant="body1">
                        {term.validityPeriod.renewalPeriod}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Approval Workflow */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Approval Workflow
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={term.approvalWorkflow.status}
                      color={getStatusColor(term.approvalWorkflow.status)}
                      size="small"
                    />
                  </Grid>
                  {term.approvalWorkflow.submittedBy && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Submitted By
                      </Typography>
                      <Typography variant="body1">
                        {term.approvalWorkflow.submittedBy.firstName} {term.approvalWorkflow.submittedBy.lastName}
                      </Typography>
                    </Grid>
                  )}
                  {term.approvalWorkflow.approvedBy && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Approved By
                      </Typography>
                      <Typography variant="body1">
                        {term.approvalWorkflow.approvedBy.firstName} {term.approvalWorkflow.approvedBy.lastName}
                      </Typography>
                    </Grid>
                  )}
                  {term.approvalWorkflow.rejectionReason && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Rejection Reason
                      </Typography>
                      <Typography variant="body1">
                        {term.approvalWorkflow.rejectionReason}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Financial Impact */}
          {term.financialImpact && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Impact
                  </Typography>
                  <Grid container spacing={2}>
                    {term.financialImpact.estimatedAnnualValue && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Annual Value
                        </Typography>
                        <Typography variant="body1">
                          R {term.financialImpact.estimatedAnnualValue.toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    {term.financialImpact.costToCompany && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Cost to Company
                        </Typography>
                        <Typography variant="body1">
                          R {term.financialImpact.costToCompany.toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    {term.financialImpact.expectedROI && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Expected ROI
                        </Typography>
                        <Typography variant="body1">
                          {term.financialImpact.expectedROI}%
                        </Typography>
                      </Grid>
                    )}
                    {term.financialImpact.marginImpact && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Margin Impact
                        </Typography>
                        <Typography variant="body1">
                          {term.financialImpact.marginImpact}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Performance Metrics */}
          {term.performance && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Grid container spacing={2}>
                    {term.performance.actualVolume && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Actual Volume
                        </Typography>
                        <Typography variant="body1">
                          {term.performance.actualVolume.toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    {term.performance.actualRevenue && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Actual Revenue
                        </Typography>
                        <Typography variant="body1">
                          R {term.performance.actualRevenue.toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    {term.performance.actualROI && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Actual ROI
                        </Typography>
                        <Typography variant="body1">
                          {term.performance.actualROI}%
                        </Typography>
                      </Grid>
                    )}
                    {term.performance.utilizationRate && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Utilization Rate
                        </Typography>
                        <Typography variant="body1">
                          {term.performance.utilizationRate}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Audit Trail */}
          {term.auditTrail && term.auditTrail.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Audit Trail
                  </Typography>
                  {term.auditTrail.slice(-5).map((entry, index) => (
                    <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < 4 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Typography variant="body2">
                        <strong>{entry.action}</strong> by {entry.performedBy?.firstName} {entry.performedBy?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.performedAt).toLocaleString()}
                      </Typography>
                      {entry.notes && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {entry.notes}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradingTermDetail;