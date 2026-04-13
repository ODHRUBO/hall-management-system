import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/halls', label: 'Halls & Rooms', icon: '🏛️' },
  { path: '/admin/applications', label: 'Applications', icon: '📋' },
  { path: '/admin/allocations', label: 'Allocations', icon: '🏠' },
  { path: '/admin/payments', label: 'Payments', icon: '💳' },
  { path: '/admin/complaints', label: 'Complaints', icon: '📢' },
  { path: '/admin/reports', label: 'Reports', icon: '📈' },
];

const studentNav = [
  { path: '/student', label: 'Dashboard', icon: '📊', end: true },
  { path: '/student/apply', label: 'Apply for Room', icon: '📋' },
  { path: '/student/my-room', label: 'My Room', icon: '🏠' },
  { path: '/student/payments', label: 'Payments', icon: '💳' },
  { path: '/student/complaints', label: 'Complaints', icon: '📢' },
  { path: '/student/profile', label: 'My Profile', icon: '👤' },
];

const managerNav = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/halls', label: 'Halls & Rooms', icon: '🏛️' },
  { path: '/admin/applications', label: 'Applications', icon: '📋' },
  { path: '/admin/allocations', label: 'Allocations', icon: '🏠' },
  { path: '/admin/payments', label: 'Payments', icon: '💳' },
  { path: '/admin/complaints', label: 'Complaints', icon: '📢' },
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'student' ? studentNav : user?.role === 'hall_manager' ? managerNav : adminNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = { admin: '#6c3fc5', hall_manager: '#0a7d6b', student: '#1a6fb5' }[user?.role] || '#333';
  const roleLabel = { admin: 'Administrator', hall_manager: 'Hall Manager', student: 'Student' }[user?.role] || '';

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={{ ...s.sidebar, width: collapsed ? 64 : 240 }}>
        <div style={s.sideTop}>
          <div style={{ ...s.brand, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 24 }}>🏛️</span>
            {!collapsed && <span style={s.brandText}>HMS</span>}
          </div>
          <button style={s.collapseBtn} onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {!collapsed && (
          <div style={{ ...s.userBadge, borderLeft: `3px solid ${roleColor}` }}>
            <div style={s.userName}>{user?.name}</div>
            <div style={{ ...s.userRole, color: roleColor }}>{roleLabel}</div>
          </div>
        )}

        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                ...s.navLink,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                paddingLeft: collapsed ? 0 : 16,
                justifyContent: collapsed ? 'center' : 'flex-start',
              })}
              title={collapsed ? item.label : ''}
            >
              <span style={{ fontSize: 18, minWidth: 22 }}>{item.icon}</span>
              {!collapsed && <span style={{ marginLeft: 10 }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button style={{ ...s.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : 16 }}
          onClick={handleLogout} title="Logout">
          <span style={{ fontSize: 18 }}>🚪</span>
          {!collapsed && <span style={{ marginLeft: 10 }}>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main style={s.main}>
        {children}
      </main>
    </div>
  );
};

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' },
  sidebar: { background: '#1a1a2e', color: '#e0e0f0', display: 'flex', flexDirection: 'column', transition: 'width 0.25s', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', flexShrink: 0, zIndex: 100 },
  sideTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  brandText: { fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 1 },
  collapseBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userBadge: { margin: '12px 12px 4px', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 },
  userName: { fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 12, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  nav: { flex: 1, padding: '8px 8px', overflowY: 'auto' },
  navLink: { display: 'flex', alignItems: 'center', padding: '10px 0', borderRadius: 8, color: '#c8c8e8', textDecoration: 'none', fontSize: 14, marginBottom: 2, transition: 'background 0.15s' },
  logoutBtn: { display: 'flex', alignItems: 'center', padding: '14px 0', margin: '8px', background: 'rgba(255,80,80,0.1)', border: 'none', borderRadius: 8, color: '#ff8080', cursor: 'pointer', fontSize: 14, width: 'calc(100% - 16px)' },
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: 1200 },
};
