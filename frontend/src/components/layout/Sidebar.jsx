import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as LocalOfferIcon,
  Campaign as CampaignIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  School as SchoolIcon
} from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      section: 'Overview',
      items: [
        { icon: DashboardIcon, label: 'Dashboard', path: '/dashboard' },
        { icon: AssignmentIcon, label: 'Activities', path: '/activities' },
        { icon: TrendingUpIcon, label: 'Sales Analytics', path: '/sales-analytics' }
      ]
    },
    {
      section: 'Trade Management',
      items: [
        { icon: LocalOfferIcon, label: 'Promotions', path: '/promotions' },
        { icon: CampaignIcon, label: 'Campaigns', path: '/campaigns' },
        { icon: AccountBalanceIcon, label: 'Budgets', path: '/budgets' },
        { icon: DescriptionIcon, label: 'Trading Terms', path: '/trading-terms' }
      ]
    },
    {
      section: 'Master Data',
      items: [
        { icon: PeopleIcon, label: 'Customers', path: '/customers' },
        { icon: InventoryIcon, label: 'Products', path: '/products' },
        { icon: BusinessIcon, label: 'Vendors', path: '/vendors' }
      ]
    },
    {
      section: 'Data',
      items: [
        { icon: SwapHorizIcon, label: 'Import / Export', path: '/data/import-export' }
      ]
    },
        {
          section: 'Administration',
          items: [
            { icon: AssessmentIcon, label: 'Report Builder', path: '/reports' },
            { icon: SecurityIcon, label: 'Security', path: '/admin/security' },
            { icon: SpeedIcon, label: 'Performance', path: '/admin/performance' }
          ]
        },
        {
          section: 'Help & Training',
          items: [
            { icon: HelpIcon, label: 'Help Center', path: '/help' },
            { icon: SchoolIcon, label: 'Training', path: '/help' }
          ]
        }
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ 
      width: '260px', 
      backgroundColor: '#FFFFFF', 
      color: '#171717', 
      height: '100vh', 
      overflowY: 'auto',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '1px solid #E5E5E5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo Section */}
      <div style={{ 
        padding: '20px 16px', 
        borderBottom: '1px solid #E5E5E5',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <img 
          src="/logo.svg" 
          alt="TRADEAI" 
          style={{ height: 32, width: 'auto' }}
        />
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {menuItems.map((section, idx) => (
          <div key={idx} style={{ padding: '12px 0' }}>
            <div style={{ 
              padding: '0 16px', 
              marginBottom: '8px', 
              fontSize: '11px', 
              color: '#737373', 
              fontWeight: '600', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {section.section}
            </div>
            {section.items.map((item, itemIdx) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              return (
                <div
                  key={itemIdx}
                  onClick={() => navigate(item.path)}
                  style={{
                    padding: '10px 16px',
                    margin: '2px 8px',
                    cursor: 'pointer',
                    backgroundColor: active ? 'rgba(30, 64, 175, 0.08)' : 'transparent',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: active ? '#1E40AF' : '#404040'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#F5F5F5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <IconComponent style={{ 
                    fontSize: '20px',
                    color: active ? '#1E40AF' : '#737373'
                  }} />
                  <span style={{ 
                    fontSize: '14px',
                    fontWeight: active ? '500' : '400'
                  }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Logout Section */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #E5E5E5'
      }}>
        <button
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#FAFAFA',
            color: '#525252',
            border: '1px solid #E5E5E5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
            e.currentTarget.style.borderColor = '#D4D4D4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FAFAFA';
            e.currentTarget.style.borderColor = '#E5E5E5';
          }}
        >
          <LogoutIcon style={{ fontSize: '18px' }} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
