import React, { useState, useEffect } from 'react';

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div style={{ 
      height: '60px', 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      position: 'fixed',
      top: 0,
      left: '260px',
      right: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>
          Welcome back, {user?.firstName || 'User'}! 👋
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '20px',
          fontSize: '14px',
          color: '#0284c7',
          fontWeight: '500'
        }}>
          {user?.role || 'User'}
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          backgroundColor: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          {user?.firstName?.charAt(0) || 'U'}
        </div>
      </div>
    </div>
  );
};

export default Header;
