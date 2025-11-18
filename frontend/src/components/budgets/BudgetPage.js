import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab
} from '@mui/material';
import {
  List as ListIcon,
  AccountTree as HierarchyIcon,
  Assessment as ReportsIcon
} from '@mui/icons-material';

import BudgetList from './BudgetList';
import HierarchicalBudgetManager from './HierarchicalBudgetManager';
import BudgetReports from '../reports/modules/BudgetReports';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `budget-tab-${index}`,
    'aria-controls': `budget-tabpanel-${index}`,
  };
}

const BudgetPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="budget management tabs">
          <Tab 
            icon={<ListIcon />} 
            label="Budget List" 
            {...a11yProps(0)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<HierarchyIcon />} 
            label="Hierarchical Budgets" 
            {...a11yProps(1)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<ReportsIcon />} 
            label="Budget Reports" 
            {...a11yProps(2)} 
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <BudgetList />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <HierarchicalBudgetManager />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <BudgetReports />
      </TabPanel>
    </Box>
  );
};

export default BudgetPage;