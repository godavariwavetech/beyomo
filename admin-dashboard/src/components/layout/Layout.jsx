import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
