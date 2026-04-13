import React, { useState, useEffect } from 'react';
import { applicationsAPI, allocationsAPI, paymentsAPI, hallsAPI } from '../../services/api';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Card, Badge, Btn, Modal, Field, Select, Textarea, Input, Alert, Spinner, StatCard, DataTable } from '../dashboard/UI';

// ─── Student Dashboard ─────────────────────────────────────────────────────
export const StudentDashboard = () => {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([allocationsAPI.getAll(), paymentsAPI.getSummary()])
      .then(([a, s]) => { setAllocation(a.data[0] || null); setSummary(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title={`Hello, ${user?.name} 👋`} subtitle="University Hall Management System — Student Portal" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Current Room" value={allocation ? `#${allocation.room?.roomNumber}` : 'Not Assigned'} icon="🏠" color={allocation ? '#28a745' : '#888'} />
        <StatCard label="Total Payments" value={summary?.total || 0} icon="📄" color="#6c3fc5" />
        <StatCard label="Paid" value={summary?.paid || 0} icon="✅" color="#28a745" />
        <StatCard label="Overdue" value={summary?.overdue || 0} icon="⚠️" color="#dc3545" />
      </div>

      {allocation && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Current Room Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              ['Hall', allocation.hall?.name],
              ['Room', `Room ${allocation.room?.roomNumber}`],
              ['Type', allocation.room?.type],
              ['Floor', `Floor ${allocation.room?.floor}`],
              ['Monthly Fee', `৳${Number(allocation.room?.monthlyFee).toLocaleString()}`],
              ['Session', allocation.session],
            ].map(([l, v]) => (
              <div key={l} style={{ background: '#f6f8fc', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, color: '#888' }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, textTransform: 'capitalize' }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!allocation && (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 48 }}>🏠</div>
            <h3 style={{ color: '#1a1a2e' }}>No Room Allocated</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>You haven't been assigned a room yet. Apply for accommodation.</p>
            <Btn onClick={() => window.location.href = '/student/apply'}>Apply for a Room →</Btn>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── Apply for Room ────────────────────────────────────────────────────────
export const ApplyRoomPage = () => {
  const [halls, setHalls] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ hallId: '', preferredRoomType: 'single', reason: '', session: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    Promise.all([hallsAPI.getAll(), applicationsAPI.getAll()])
      .then(([h, a]) => { setHalls(h.data); setApplications(a.data); })
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    try {
      await applicationsAPI.submit(form);
      setModal(false);
      setMsg({ type: 'success', text: 'Application submitted! You will be notified upon review.' });
      const a = await applicationsAPI.getAll();
      setApplications(a.data);
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Submission failed' }); }
  };

  const currentYear = new Date().getFullYear();
  const sessions = [`${currentYear}-${currentYear + 1}`, `${currentYear + 1}-${currentYear + 2}`];

  const cols = [
    { key: 'hall', label: 'Hall', render: r => r.hall?.name },
    { key: 'preferredRoomType', label: 'Room Type', render: r => <span style={{ textTransform: 'capitalize' }}>{r.preferredRoomType}</span> },
    { key: 'session', label: 'Session' },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'assignedRoom', label: 'Room Assigned', render: r => r.assignedRoom ? `Room ${r.assignedRoom.roomNumber}` : '—' },
    { key: 'createdAt', label: 'Applied On', render: r => new Date(r.createdAt).toLocaleDateString() },
    { key: 'reviewNote', label: 'Review Note', render: r => r.reviewNote || '—' },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Room Application" subtitle="Apply for hall accommodation" action={<Btn onClick={() => setModal(true)}>+ Apply Now</Btn>} />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>My Applications</h3>
        <DataTable columns={cols} data={applications} emptyText="You haven't submitted any applications yet" />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Apply for Room Accommodation">
        <Field label="Hall" required>
          <Select value={form.hallId} onChange={e => setForm({ ...form, hallId: e.target.value })}>
            <option value="">Select a hall</option>
            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Preferred Room Type">
            <Select value={form.preferredRoomType} onChange={e => setForm({ ...form, preferredRoomType: e.target.value })}>
              {['single', 'double', 'triple', 'dormitory'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Session" required>
            <Select value={form.session} onChange={e => setForm({ ...form, session: e.target.value })}>
              <option value="">Select session</option>
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Reason / Remarks"><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Brief reason for your accommodation request..." /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={submit}>Submit Application</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ─── Student Profile ───────────────────────────────────────────────────────
export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);

  const saveProfile = async () => {
    try {
      await authAPI.updateProfile(form);
      updateUser(form);
      setMsg({ type: 'success', text: 'Profile updated' });
    } catch (e) { setMsg({ type: 'error', text: 'Update failed' }); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
    } catch (e) { setPwMsg({ type: 'error', text: e.response?.data?.message || 'Failed' }); }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account information" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Personal Information</h3>
          {msg && <Alert type={msg.type}>{msg.text}</Alert>}
          <div style={{ marginBottom: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e8d5f5', color: '#5b2d8e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              {user?.name?.charAt(0)}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>Email: {user?.email}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Student ID: {user?.studentId || '—'}</div>
          </div>
          <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Department"><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Field>
          <Btn onClick={saveProfile}>Save Changes</Btn>
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Change Password</h3>
          {pwMsg && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
          <Field label="Current Password"><Input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></Field>
          <Field label="New Password"><Input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} /></Field>
          <Field label="Confirm New Password"><Input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} /></Field>
          <Btn onClick={changePassword}>Update Password</Btn>
        </Card>
      </div>
    </div>
  );
};

// ─── Allocations Page ──────────────────────────────────────────────────────
export const AllocationsPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    allocationsAPI.getAll().then(r => setAllocations(r.data)).finally(() => setLoading(false));
  }, []);

  const cols = [
    { key: 'student', label: 'Student', render: r => (
      <div><div style={{ fontWeight: 500 }}>{r.student?.name}</div><div style={{ fontSize: 12, color: '#888' }}>{r.student?.studentId} · {r.student?.phone}</div></div>
    )},
    { key: 'hall', label: 'Hall', render: r => r.hall?.name },
    { key: 'room', label: 'Room', render: r => `Room ${r.room?.roomNumber} (${r.room?.type})` },
    { key: 'session', label: 'Session' },
    { key: 'startDate', label: 'Start Date', render: r => new Date(r.startDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Room Allocations" subtitle="All active room assignments" />
      <Card><DataTable columns={cols} data={allocations} emptyText="No active allocations" /></Card>
    </div>
  );
};
