import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      section: 'Main',
      items: [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
        { icon: '🎯', label: 'Activities', path: '/activities' },
        { icon: '📈', label: 'Sales Analytics', path: '/sales-analytics' }
      ]
    },
    {
      section: 'Management',
      items: [
        { icon: '🎯', label: 'Promotions', path: '/promotions' },
        { icon: '📢', label: 'Campaigns', path: '/campaigns' },
        { icon: '💰', label: 'Budgets', path: '/budgets' },
        { icon: '📋', label: 'Trading Terms', path: '/trading-terms' }
      ]
    },
    {
      section: 'Master Data',
      items: [
        { icon: '👥', label: 'Customers', path: '/customers' },
        { icon: '📦', label: 'Products', path: '/products' },
        { icon: '🏢', label: 'Vendors', path: '/vendors' }
      ]
    },
    {
      section: 'Reports & Admin',
      items: [
        { icon: '📊', label: 'Report Builder', path: '/reports' },
        { icon: '🔒', label: 'Security', path: '/admin/security' },
        { icon: '⚡', label: 'Performance', path: '/admin/performance' }
      ]
    }
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ 
      width: '260px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      height: '100vh', 
      overflowY: 'auto',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>🚀 TRADEAI</h2>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#94a3b8' }}>Trade Promotion Management</p>
      </div>

      {menuItems.map((section, idx) => (
        <div key={idx} style={{ padding: '20px 0' }}>
          <div style={{ padding: '0 20px', marginBottom: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
            {section.section}
          </div>
          {section.items.map((item, itemIdx) => (
            <div
              key={itemIdx}
              onClick={() => navigate(item.path)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                backgroundColor: isActive(item.path) ? '#334155' : 'transparent',
                borderLeft: isActive(item.path) ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => !isActive(item.path) && (e.currentTarget.style.backgroundColor = '#2d3748')}
              onMouseLeave={(e) => !isActive(item.path) && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ padding: '20px', borderTop: '1px solid #334155', marginTop: 'auto' }}>
        <button
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
