import React, { useState, useEffect } from 'react';
import { complaintsAPI, hallsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Card, DataTable, Badge, Btn, Modal, Field, Select, Input, Textarea, Alert, Spinner } from '../dashboard/UI';

export const ComplaintsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'student';

  const [complaints, setComplaints] = useState([]);
  const [halls, setHalls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [submitForm, setSubmitForm] = useState({ hallId: '', category: 'maintenance', title: '', description: '', priority: 'medium' });
  const [updateForm, setUpdateForm] = useState({ status: '', resolution: '', assignedToId: '', priority: '' });
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const [c, h, u] = await Promise.all([
        complaintsAPI.getAll(params),
        hallsAPI.getAll(),
        isAdmin ? usersAPI.getAll() : Promise.resolve({ data: [] }),
      ]);
      setComplaints(c.data);
      setHalls(h.data);
      setStaff(u.data.filter(u => u.role !== 'student'));
    } catch (e) { setMsg({ type: 'error', text: 'Failed to load' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleSubmit = async () => {
    try {
      await complaintsAPI.submit(submitForm);
      setSubmitModal(false);
      setSubmitForm({ hallId: '', category: 'maintenance', title: '', description: '', priority: 'medium' });
      setMsg({ type: 'success', text: 'Complaint submitted successfully' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to submit' }); }
  };

  const handleUpdate = async () => {
    try {
      await complaintsAPI.update(selected.id, updateForm);
      setUpdateModal(false);
      setMsg({ type: 'success', text: 'Complaint updated' });
      load();
    } catch (e) { setMsg({ type: 'error', text: 'Failed to update' }); }
  };

  const openUpdate = (c) => {
    setSelected(c);
    setUpdateForm({ status: c.status, resolution: c.resolution || '', assignedToId: c.assignedToId || '', priority: c.priority });
    setUpdateModal(true);
  };

  const priorityColors = { low: '#888', medium: '#e67e22', high: '#dc3545', urgent: '#c0392b' };

  const cols = [
    ...(isAdmin ? [{ key: 'student', label: 'Student', render: r => (
      <div><div style={{ fontWeight: 500 }}>{r.student?.name}</div><div style={{ fontSize: 12, color: '#888' }}>{r.student?.studentId}</div></div>
    )}] : []),
    { key: 'title', label: 'Title', render: r => <div style={{ maxWidth: 200 }}><div style={{ fontWeight: 500 }}>{r.title}</div><div style={{ fontSize: 12, color: '#888', textTransform: 'capitalize' }}>{r.category}</div></div> },
    { key: 'hall', label: 'Hall', render: r => r.hall?.name || '—' },
    { key: 'priority', label: 'Priority', render: r => <span style={{ color: priorityColors[r.priority], fontWeight: 600, textTransform: 'capitalize', fontSize: 13 }}>{r.priority}</span> },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'assignedTo', label: 'Assigned To', render: r => r.assignedTo?.name || '—' },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() },
    ...(isAdmin ? [{ key: 'actions', label: 'Actions', render: r => (
      <Btn size="sm" variant="secondary" onClick={() => openUpdate(r)}>Update</Btn>
    )}] : []),
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Complaint Management"
        subtitle={isAdmin ? 'Track and resolve student complaints' : 'Submit and track your complaints'}
        action={!isAdmin && <Btn onClick={() => setSubmitModal(true)}>+ New Complaint</Btn>}
      />

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'submitted', 'under_review', 'in_progress', 'resolved', 'closed'].map(s => (
          <Btn key={s} size="sm" variant={filterStatus === s ? 'primary' : 'secondary'} onClick={() => setFilterStatus(s)}>
            {s.replace(/_/g, ' ') || 'All'}
          </Btn>
        ))}
        {isAdmin && <Btn size="sm" onClick={() => setSubmitModal(true)} style={{ marginLeft: 'auto' }}>+ Raise Complaint</Btn>}
      </div>

      <Card>
        <DataTable columns={cols} data={complaints} emptyText="No complaints found" />
      </Card>

      {/* Submit Complaint Modal */}
      <Modal open={submitModal} onClose={() => setSubmitModal(false)} title="Submit Complaint">
        <Field label="Hall" required>
          <Select value={submitForm.hallId} onChange={e => setSubmitForm({ ...submitForm, hallId: e.target.value })}>
            <option value="">Select Hall</option>
            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Category">
            <Select value={submitForm.category} onChange={e => setSubmitForm({ ...submitForm, category: e.target.value })}>
              {['maintenance', 'noise', 'hygiene', 'security', 'facilities', 'staff', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={submitForm.priority} onChange={e => setSubmitForm({ ...submitForm, priority: e.target.value })}>
              {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Title" required><Input value={submitForm.title} onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })} placeholder="Brief title" /></Field>
        <Field label="Description" required><Textarea value={submitForm.description} onChange={e => setSubmitForm({ ...submitForm, description: e.target.value })} placeholder="Describe the issue in detail..." rows={4} /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={() => setSubmitModal(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit}>Submit Complaint</Btn>
        </div>
      </Modal>

      {/* Update Complaint Modal */}
      <Modal open={updateModal} onClose={() => setUpdateModal(false)} title="Update Complaint">
        {selected && (
          <div>
            <div style={{ background: '#f6f8fc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{selected.title}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{selected.description}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Status">
                <Select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                  {['submitted', 'under_review', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={updateForm.priority} onChange={e => setUpdateForm({ ...updateForm, priority: e.target.value })}>
                  {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Assign To">
              <Select value={updateForm.assignedToId} onChange={e => setUpdateForm({ ...updateForm, assignedToId: e.target.value })}>
                <option value="">Unassigned</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>)}
              </Select>
            </Field>
            <Field label="Resolution Note">
              <Textarea value={updateForm.resolution} onChange={e => setUpdateForm({ ...updateForm, resolution: e.target.value })} placeholder="Describe the resolution..." />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setUpdateModal(false)}>Cancel</Btn>
              <Btn onClick={handleUpdate}>Save Changes</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
