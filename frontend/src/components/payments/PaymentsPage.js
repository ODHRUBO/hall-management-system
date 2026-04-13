import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Card, DataTable, Badge, Btn, Modal, StatCard, Field, Input, Select, Textarea, Alert, Spinner } from '../dashboard/UI';

export const PaymentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'student';

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ paymentMethod: 'cash', transactionId: '', notes: '' });
  const [genForm, setGenForm] = useState({ month: '', year: new Date().getFullYear() });
  const [filterStatus, setFilterStatus] = useState('');
  const [msg, setMsg] = useState(null);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const [p, s] = await Promise.all([paymentsAPI.getAll(params), paymentsAPI.getSummary()]);
      setPayments(p.data);
      setSummary(s.data);
    } catch (e) { setMsg({ type: 'error', text: 'Failed to load payments' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleConfirm = async () => {
    try {
      await paymentsAPI.confirm(selected.id, confirmForm);
      setConfirmModal(false);
      setMsg({ type: 'success', text: 'Payment confirmed' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed' }); }
  };

  const handleGenerate = async () => {
    try {
      const res = await paymentsAPI.generate(genForm);
      setGenerateModal(false);
      setMsg({ type: 'success', text: res.data.message });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed' }); }
  };

  const handleMarkOverdue = async () => {
    if (!window.confirm('Mark all overdue pending payments?')) return;
    const res = await paymentsAPI.markOverdue();
    setMsg({ type: 'info', text: res.data.message });
    load();
  };

  const cols = [
    ...(isAdmin ? [{ key: 'student', label: 'Student', render: r => (
      <div><div style={{ fontWeight: 500 }}>{r.student?.name}</div><div style={{ fontSize: 12, color: '#888' }}>{r.student?.studentId}</div></div>
    )}] : []),
    { key: 'month', label: 'Period', render: r => `${r.month} ${r.year}` },
    { key: 'room', label: 'Room', render: r => r.Allocation?.room ? `Room ${r.Allocation.room.roomNumber}` : '—' },
    { key: 'amount', label: 'Amount', render: r => <strong>৳{Number(r.amount).toLocaleString()}</strong> },
    { key: 'dueDate', label: 'Due Date', render: r => new Date(r.dueDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'paidDate', label: 'Paid Date', render: r => r.paidDate ? new Date(r.paidDate).toLocaleDateString() : '—' },
    ...(isAdmin ? [{ key: 'actions', label: 'Actions', render: r => (
      r.status === 'pending' || r.status === 'overdue'
        ? <Btn size="sm" variant="success" onClick={() => { setSelected(r); setConfirmModal(true); }}>Confirm</Btn>
        : <Badge status={r.status} />
    )}] : []),
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Payment Management"
        subtitle="Fee tracking and payment confirmation"
        action={isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={handleMarkOverdue}>Mark Overdue</Btn>
            <Btn onClick={() => setGenerateModal(true)}>Generate Fees</Btn>
          </div>
        )}
      />

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Records" value={summary.total} icon="📄" color="#6c3fc5" />
          <StatCard label="Paid" value={summary.paid} icon="✅" color="#28a745" />
          <StatCard label="Pending" value={summary.pending} icon="⏳" color="#ffc107" />
          <StatCard label="Overdue" value={summary.overdue} icon="⚠️" color="#dc3545" />
          <StatCard label="Total Collected" value={`৳${summary.paidAmount?.toLocaleString()}`} icon="💰" color="#0a7d6b" />
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Payment Records ({payments.length})</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', 'pending', 'paid', 'overdue'].map(s => (
              <Btn key={s} size="sm" variant={filterStatus === s ? 'primary' : 'secondary'} onClick={() => setFilterStatus(s)}>
                {s || 'All'}
              </Btn>
            ))}
          </div>
        </div>
        <DataTable columns={cols} data={payments} />
      </Card>

      {/* Confirm Payment Modal */}
      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Payment">
        {selected && (
          <div>
            <div style={{ background: '#f6f8fc', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <strong>{selected.student?.name}</strong> — ৳{Number(selected.amount).toLocaleString()}<br />
              <span style={{ fontSize: 13, color: '#666' }}>{selected.month} {selected.year}</span>
            </div>
            <Field label="Payment Method">
              <Select value={confirmForm.paymentMethod} onChange={e => setConfirmForm({ ...confirmForm, paymentMethod: e.target.value })}>
                {['cash', 'bank_transfer', 'mobile_banking', 'cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Transaction ID">
              <Input value={confirmForm.transactionId} onChange={e => setConfirmForm({ ...confirmForm, transactionId: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Notes">
              <Input value={confirmForm.notes} onChange={e => setConfirmForm({ ...confirmForm, notes: e.target.value })} placeholder="Optional note" />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Btn>
              <Btn variant="success" onClick={handleConfirm}>Confirm Payment</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Fees Modal */}
      <Modal open={generateModal} onClose={() => setGenerateModal(false)} title="Generate Monthly Fees">
        <Field label="Month">
          <Select value={genForm.month} onChange={e => setGenForm({ ...genForm, month: e.target.value })}>
            <option value="">Select month</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Year">
          <Input type="number" value={genForm.year} onChange={e => setGenForm({ ...genForm, year: e.target.value })} min={2020} max={2030} />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setGenerateModal(false)}>Cancel</Btn>
          <Btn onClick={handleGenerate}>Generate</Btn>
        </div>
      </Modal>
    </div>
  );
};
