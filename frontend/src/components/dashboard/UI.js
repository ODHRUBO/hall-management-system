import React, { useState } from 'react';

// ─── Stat Card ────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color = '#1a1a2e', sub }) => (
  <div style={{ ...uiS.statCard, borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={uiS.statLabel}>{label}</div>
        <div style={{ ...uiS.statValue, color }}>{value ?? '—'}</div>
        {sub && <div style={uiS.statSub}>{sub}</div>}
      </div>
      <span style={{ fontSize: 28 }}>{icon}</span>
    </div>
  </div>
);

// ─── Page Header ──────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={uiS.pageHeader}>
    <div>
      <h1 style={uiS.pageTitle}>{title}</h1>
      {subtitle && <p style={uiS.pageSub}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────
const badgeColors = {
  pending: ['#fff3cd', '#856404'], approved: ['#d4edda', '#155724'],
  rejected: ['#f8d7da', '#721c24'], active: ['#d4edda', '#155724'],
  paid: ['#d4edda', '#155724'], overdue: ['#f8d7da', '#721c24'],
  submitted: ['#cce5ff', '#004085'], under_review: ['#fff3cd', '#856404'],
  in_progress: ['#d1ecf1', '#0c5460'], resolved: ['#d4edda', '#155724'],
  closed: ['#e2e3e5', '#383d41'], available: ['#d4edda', '#155724'],
  occupied: ['#f8d7da', '#721c24'], maintenance: ['#fff3cd', '#856404'],
  low: ['#e2e3e5', '#383d41'], medium: ['#fff3cd', '#856404'],
  high: ['#f8d7da', '#721c24'], urgent: ['#ff4444', '#fff'],
  admin: ['#e8d5f5', '#5b2d8e'], hall_manager: ['#d4f5ef', '#0a5c4e'], student: ['#d4e8f5', '#0a3d5e'],
  cancelled: ['#e2e3e5', '#383d41'], waived: ['#d1ecf1', '#0c5460'],
  vacated: ['#e2e3e5', '#383d41'], transferred: ['#d1ecf1', '#0c5460'],
  reserved: ['#d1ecf1', '#0c5460'],
};

export const Badge = ({ status }) => {
  const [bg, color] = badgeColors[status] || ['#e2e3e5', '#383d41'];
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Button ───────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style: extra }) => {
  const variants = {
    primary: { background: '#1a1a2e', color: '#fff', border: 'none' },
    secondary: { background: '#f0f4f8', color: '#333', border: '1.5px solid #d0d8e8' },
    danger: { background: '#dc3545', color: '#fff', border: 'none' },
    success: { background: '#28a745', color: '#fff', border: 'none' },
    outline: { background: 'transparent', color: '#1a1a2e', border: '1.5px solid #1a1a2e' },
  };
  const sizes = { sm: { padding: '5px 12px', fontSize: 13 }, md: { padding: '8px 18px', fontSize: 14 }, lg: { padding: '11px 24px', fontSize: 15 } };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size], borderRadius: 8, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, ...extra,
    }}>
      {children}
    </button>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={uiS.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...uiS.modal, width, maxWidth: '95vw' }}>
        <div style={uiS.modalHeader}>
          <h2 style={uiS.modalTitle}>{title}</h2>
          <button style={uiS.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={uiS.modalBody}>{children}</div>
      </div>
    </div>
  );
};

// ─── Form Field ───────────────────────────────────────────────────────────
export const Field = ({ label, children, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 5 }}>
      {label} {required && <span style={{ color: '#c00' }}>*</span>}
    </label>
    {children}
  </div>
);

export const Input = ({ ...props }) => (
  <input style={{ width: '100%', padding: '9px 13px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} {...props} />
);

export const Select = ({ children, ...props }) => (
  <select style={{ width: '100%', padding: '9px 13px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: '#fff' }} {...props}>
    {children}
  </select>
);

export const Textarea = ({ ...props }) => (
  <textarea style={{ width: '100%', padding: '9px 13px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 80 }} {...props} />
);

// ─── Data Table ───────────────────────────────────────────────────────────
export const DataTable = ({ columns, data, emptyText = 'No data found' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={uiS.table}>
      <thead>
        <tr>{columns.map(col => <th key={col.key} style={uiS.th}>{col.label}</th>)}</tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ ...uiS.td, textAlign: 'center', color: '#999', padding: 32 }}>{emptyText}</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={row.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              {columns.map(col => (
                <td key={col.key} style={uiS.td}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────
export const Card = ({ children, style: extra }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', ...extra }}>{children}</div>
);

// ─── Alert ────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children }) => {
  const styles = {
    success: { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
    error: { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
    info: { bg: '#cce5ff', border: '#b8daff', color: '#004085' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', color: '#856404' },
  };
  const st = styles[type];
  return <div style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{children}</div>;
};

// ─── Loading Spinner ──────────────────────────────────────────────────────
export const Spinner = ({ text = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#888', gap: 10 }}>
    <div style={{ width: 20, height: 20, border: '3px solid #e0e0e0', borderTop: '3px solid #1a1a2e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    {text}
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────
const uiS = {
  statCard: { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 160 },
  statLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700 },
  statSub: { fontSize: 12, color: '#aaa', marginTop: 4 },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
  pageSub: { margin: '4px 0 0', color: '#666', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 14px', background: '#f6f8fc', color: '#555', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #e8ecf2', whiteSpace: 'nowrap' },
  td: { padding: '11px 14px', borderBottom: '1px solid #f0f2f6', color: '#333', verticalAlign: 'middle' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eef0f5' },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  closeBtn: { background: '#f0f4f8', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: '20px 24px' },
};
