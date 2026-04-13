import React, { useState, useEffect } from 'react';
import { applicationsAPI, roomsAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, Btn, Modal, Field, Select, Textarea, Alert, Spinner } from '../dashboard/UI';

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', assignedRoomId: '', reviewNote: '' });
  const [filterStatus, setFilterStatus] = useState('pending');
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([
        applicationsAPI.getAll({ status: filterStatus || undefined }),
        roomsAPI.getAll({ status: 'available' }),
      ]);
      setApplications(a.data);
      setRooms(r.data);
    } catch (e) { setMsg({ type: 'error', text: 'Failed to load' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openReview = (app) => {
    setSelected(app);
    setReviewForm({ status: 'approved', assignedRoomId: '', reviewNote: '' });
    setReviewModal(true);
  };

  const submitReview = async () => {
    try {
      await applicationsAPI.review(selected.id, reviewForm);
      setReviewModal(false);
      setMsg({ type: 'success', text: `Application ${reviewForm.status} successfully` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Review failed' }); }
  };

  const cols = [
    { key: 'student', label: 'Student', render: r => (
      <div>
        <div style={{ fontWeight: 500 }}>{r.student?.name}</div>
        <div style={{ fontSize: 12, color: '#888' }}>{r.student?.studentId} · {r.student?.email}</div>
      </div>
    )},
    { key: 'hall', label: 'Hall', render: r => r.hall?.name },
    { key: 'preferredRoomType', label: 'Preferred Type', render: r => <span style={{ textTransform: 'capitalize' }}>{r.preferredRoomType}</span> },
    { key: 'session', label: 'Session' },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'assignedRoom', label: 'Assigned Room', render: r => r.assignedRoom ? `Room ${r.assignedRoom.roomNumber}` : '—' },
    { key: 'createdAt', label: 'Applied', render: r => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: r => (
      r.status === 'pending'
        ? <Btn size="sm" variant="outline" onClick={() => openReview(r)}>Review</Btn>
        : <span style={{ color: '#999', fontSize: 13 }}>—</span>
    )},
  ];

  const availableRooms = rooms.filter(r => {
    if (!selected) return true;
    return r.hall?.id === selected.hallId && r.type === selected.preferredRoomType && r.currentOccupancy < r.capacity;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Room Applications" subtitle="Review and process student accommodation applications" />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
          <Btn key={s} variant={filterStatus === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterStatus(s)}>
            {s || 'All'}
          </Btn>
        ))}
      </div>

      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Applications ({applications.length})</h3>
        <DataTable columns={cols} data={applications} emptyText="No applications found" />
      </Card>

      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Review Application">
        {selected && (
          <div>
            <div style={{ background: '#f6f8fc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.student?.name}</div>
              <div style={{ fontSize: 13, color: '#666' }}>ID: {selected.student?.studentId}</div>
              <div style={{ fontSize: 13, color: '#666' }}>Hall: {selected.hall?.name} · Type: {selected.preferredRoomType}</div>
              {selected.reason && <div style={{ fontSize: 13, marginTop: 6, color: '#444' }}>Reason: {selected.reason}</div>}
            </div>

            <Field label="Decision">
              <Select value={reviewForm.status} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })}>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </Select>
            </Field>

            {reviewForm.status === 'approved' && (
              <Field label="Assign Room" required>
                <Select value={reviewForm.assignedRoomId} onChange={e => setReviewForm({ ...reviewForm, assignedRoomId: e.target.value })}>
                  <option value="">Select a room</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} — {r.type} (Floor {r.floor}, {r.currentOccupancy}/{r.capacity} occupied) — ৳{r.monthlyFee}/mo
                    </option>
                  ))}
                </Select>
                {availableRooms.length === 0 && <p style={{ color: '#c00', fontSize: 12, margin: '4px 0 0' }}>No matching rooms available</p>}
              </Field>
            )}

            <Field label="Review Note">
              <Textarea value={reviewForm.reviewNote} onChange={e => setReviewForm({ ...reviewForm, reviewNote: e.target.value })} placeholder="Optional note to the student..." />
            </Field>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setReviewModal(false)}>Cancel</Btn>
              <Btn variant={reviewForm.status === 'approved' ? 'success' : 'danger'} onClick={submitReview}>
                {reviewForm.status === 'approved' ? '✓ Approve' : '✗ Reject'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
