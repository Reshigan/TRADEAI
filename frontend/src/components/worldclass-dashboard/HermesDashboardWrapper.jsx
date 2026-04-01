import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import HermesDashboard from './HermesDashboard';

// Wrapper component to provide proper context to our HermesDashboard
const HermesDashboardWrapper = () => {
  const { user } = useContext(AuthContext);
  
  // Error boundary would be handled at higher level in App.js
  
  return <HermesDashboard user={user} />;
};

export default HermesDashboardWrapper;