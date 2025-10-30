import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <Header />
        <div style={{ marginTop: '60px', padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
