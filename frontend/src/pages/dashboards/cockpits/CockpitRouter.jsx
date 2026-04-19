import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import KAMCockpit from './KAMCockpit';
import AnalystCockpit from './AnalystCockpit';
import TradeMarketingCockpit from './TradeMarketingCockpit';
import FinanceCockpit from './FinanceCockpit';
import ManagerCockpit from './ManagerCockpit';
import AdminCockpit from './AdminCockpit';
import SuperAdminCockpit from './SuperAdminCockpit';

const COCKPIT_MAP = {
  kam: KAMCockpit,
  key_account_manager: KAMCockpit,
  jam: KAMCockpit,
  analyst: AnalystCockpit,
  trade_marketing: TradeMarketingCockpit,
  finance: FinanceCockpit,
  manager: ManagerCockpit,
  director: ManagerCockpit,
  admin: AdminCockpit,
  super_admin: SuperAdminCockpit,
};

export default function CockpitRouter() {
  const { user } = useAuth();
  const CockpitComponent = COCKPIT_MAP[user?.role] || KAMCockpit;
  return <CockpitComponent user={user} />;
}
