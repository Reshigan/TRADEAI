import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, IconButton, Chip } from '@mui/material';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusChip from '../shared/StatusChip';

export default function DetailPage({ title, status, subtitle, tabs = [], backPath, aiSidebar, actions, children }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', gap: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {backPath && <IconButton onClick={() => navigate(backPath)} size="small" sx={{ mr: -1 }}><ArrowLeft size={20} /></IconButton>}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h1">{title}</Typography>
              {status && <StatusChip status={status} />}
            </Box>
            {subtitle && <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.25 }}>{subtitle}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {aiSidebar && (
              <IconButton onClick={() => setShowAI(!showAI)} sx={{ bgcolor: showAI ? '#7C3AED15' : 'transparent', color: showAI ? '#7C3AED' : 'text.secondary' }}>
                <Sparkles size={18} />
              </IconButton>
            )}
            {actions}
          </Box>
        </Box>

        {tabs.length > 0 && (
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
            {tabs.map((tab, i) => <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" sx={{ minHeight: 44 }} />)}
          </Tabs>
        )}

        <Box>{tabs.length > 0 && tabs[activeTab] ? tabs[activeTab].content : children}</Box>
      </Box>

      {showAI && aiSidebar && (
        <Box sx={{ width: 320, flexShrink: 0, ml: 3, borderLeft: '1px solid', borderColor: 'divider', pl: 3 }}>
          {aiSidebar}
        </Box>
      )}
    </Box>
  );
}
