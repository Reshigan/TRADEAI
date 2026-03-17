import React from 'react';
import { Box, Typography, Button, Card, Grid, CircularProgress } from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FormPage({ title, subtitle, backPath, sections = [], onSubmit, onSaveDraft, onCancel, loading = false, children }) {
  const navigate = useNavigate();
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {backPath && <Box component="button" onClick={() => navigate(backPath)} sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#F1F5F9' } }}><ArrowLeft size={20} /></Box>}
        <Box>
          <Typography variant="h1">{title}</Typography>
          {subtitle && <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{subtitle}</Typography>}
        </Box>
      </Box>

      {sections.length > 0 ? (
        <Grid container spacing={3}>
          {sections.map((section, i) => (
            <Grid item xs={12} md={section.fullWidth ? 12 : 6} key={i}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ mb: 2 }}>{section.title}</Typography>
                {section.content}
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : children}

      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider', py: 2, mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        {onCancel && <Button variant="outlined" onClick={onCancel || (() => navigate(backPath))}>Cancel</Button>}
        {onSaveDraft && <Button variant="outlined" onClick={onSaveDraft} startIcon={<Save size={16} />}>Save Draft</Button>}
        {onSubmit && <Button variant="contained" onClick={onSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>Submit</Button>}
      </Box>
    </Box>
  );
}
