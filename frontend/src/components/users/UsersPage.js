import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, Btn, Modal, Field, Input, Select, Alert, Spinner } from '../dashboard/UI';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '', phone: '', department: '' });
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (e) { setMsg({ type: 'error', text: 'Failed to load users' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const data = editUser && !form.password ? { ...form, password: undefined } : form;
      if (editUser) await usersAPI.update(editUser.id, data);
      else await usersAPI.create(form);
      setModal(false);
      setMsg({ type: 'success', text: `User ${editUser ? 'updated' : 'created'}` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed' }); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    await usersAPI.delete(id);
    setMsg({ type: 'success', text: 'User deactivated' });
    load();
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, studentId: u.studentId || '', phone: u.phone || '', department: u.department || '' });
    setModal(true);
  };

  const filtered = users.filter(u => {
    const matchRole = filterRole ? u.role === filterRole : true;
    const matchSearch = search ? (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.studentId || '').toLowerCase().includes(search.toLowerCase())) : true;
    return matchRole && matchSearch;
  });

  const cols = [
    { key: 'name', label: 'Name', render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e8d5f5', color: '#5b2d8e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
          {r.name.charAt(0).toUpperCase()}
        </div>
        <div><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ fontSize: 12, color: '#888' }}>{r.email}</div></div>
      </div>
    )},
    { key: 'studentId', label: 'Student ID', render: r => r.studentId || '—' },
    { key: 'role', label: 'Role', render: r => <Badge status={r.role} /> },
    { key: 'department', label: 'Department', render: r => r.department || '—' },
    { key: 'phone', label: 'Phone', render: r => r.phone || '—' },
    { key: 'isActive', label: 'Status', render: r => <Badge status={r.isActive ? 'active' : 'closed'} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        {r.isActive && <Btn size="sm" variant="danger" onClick={() => deactivate(r.id)}>Deactivate</Btn>}
      </div>
    )},
  ];

  if (loading) return <Spinner />;

  const counts = { admin: users.filter(u => u.role === 'admin').length, hall_manager: users.filter(u => u.role === 'hall_manager').length, student: users.filter(u => u.role === 'student').length };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage students, hall managers and admins" action={<Btn onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'student', studentId: '', phone: '', department: '' }); setModal(true); }}>+ Add User</Btn>} />

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[['Admins', counts.admin, '#6c3fc5'], ['Hall Managers', counts.hall_manager, '#0a7d6b'], ['Students', counts.student, '#1a6fb5']].map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `3px solid ${c}` }}>
            <div style={{ fontSize: 12, color: '#888' }}>{l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 14 }}
          />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 14 }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hall_manager">Hall Manager</option>
            <option value="student">Student</option>
          </select>
        </div>
        <DataTable columns={cols} data={filtered} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editUser ? 'Edit User' : 'Add New User'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Full Name" required><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label={editUser ? 'New Password (leave blank to keep)' : 'Password'} required={!editUser}>
            <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editUser ? '(unchanged)' : 'Min 6 characters'} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="hall_manager">Hall Manager</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Student ID"><Input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        </div>
        <Field label="Department"><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save}>{editUser ? 'Update User' : 'Create User'}</Btn>
        </div>
      </Modal>
    </div>
  );
};
