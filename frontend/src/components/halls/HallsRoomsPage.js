import React, { useState, useEffect } from 'react';
import { hallsAPI, roomsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Card, DataTable, Badge, Btn, Modal, Field, Input, Select, Textarea, Alert, Spinner } from '../dashboard/UI';

export const HallsRoomsPage = () => {
  const { user } = useAuth();
  const [halls, setHalls] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [managers, setManagers] = useState([]);
  const [tab, setTab] = useState('halls');
  const [loading, setLoading] = useState(true);
  const [hallModal, setHallModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [hallForm, setHallForm] = useState({ name: '', description: '', managerId: '' });
  const [roomForm, setRoomForm] = useState({ roomNumber: '', hallId: '', type: 'single', capacity: 1, monthlyFee: '', floor: 1, status: 'available' });
  const [msg, setMsg] = useState(null);
  const [filterHall, setFilterHall] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [h, r, u] = await Promise.all([
        hallsAPI.getAll(),
        roomsAPI.getAll({}),
        user?.role === 'admin' ? usersAPI.getAll() : Promise.resolve({ data: [] }),
      ]);
      setHalls(h.data);
      setRooms(r.data);
      setManagers(u.data.filter(u => u.role === 'hall_manager'));
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to load' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadRooms = async () => {
    const params = {};
    if (filterHall) params.hallId = filterHall;
    if (filterStatus) params.status = filterStatus;
    const r = await roomsAPI.getAll(params);
    setRooms(r.data);
  };

  useEffect(() => { loadRooms(); }, [filterHall, filterStatus]);

  const saveHall = async () => {
    try {
      const data = { ...hallForm, managerId: hallForm.managerId || null };
      if (editItem) await hallsAPI.update(editItem.id, data);
      else await hallsAPI.create(data);
      setHallModal(false); setEditItem(null); setHallForm({ name: '', description: '', managerId: '' });
      setMsg({ type: 'success', text: `Hall ${editItem ? 'updated' : 'created'} successfully` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to save' }); }
  };

  const saveRoom = async () => {
    try {
      if (editItem) await roomsAPI.update(editItem.id, roomForm);
      else await roomsAPI.create(roomForm);
      setRoomModal(false); setEditItem(null);
      setRoomForm({ roomNumber: '', hallId: '', type: 'single', capacity: 1, monthlyFee: '', floor: 1, status: 'available' });
      setMsg({ type: 'success', text: `Room ${editItem ? 'updated' : 'created'} successfully` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to save' }); }
  };

  const deleteHall = async (id) => {
    if (!window.confirm('Delete this hall?')) return;
    await hallsAPI.delete(id);
    setMsg({ type: 'success', text: 'Hall deleted' });
    load();
  };

  const deleteRoom = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await roomsAPI.delete(id);
      setMsg({ type: 'success', text: 'Room deleted' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.message }); }
  };

  const openEditHall = (h) => { setEditItem(h); setHallForm({ name: h.name, description: h.description || '', managerId: h.managerId || '' }); setHallModal(true); };
  const openEditRoom = (r) => { setEditItem(r); setRoomForm({ roomNumber: r.roomNumber, hallId: r.hallId, type: r.type, capacity: r.capacity, monthlyFee: r.monthlyFee, floor: r.floor, status: r.status }); setRoomModal(true); };

  const hallCols = [
    { key: 'name', label: 'Hall Name' },
    { key: 'totalRooms', label: 'Rooms' },
    { key: 'manager', label: 'Manager', render: r => r.manager?.name || '—' },
    { key: 'isActive', label: 'Status', render: r => <Badge status={r.isActive ? 'active' : 'closed'} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="secondary" onClick={() => openEditHall(r)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => deleteHall(r.id)}>Delete</Btn>
      </div>
    )},
  ];

  const roomCols = [
    { key: 'roomNumber', label: 'Room No.' },
    { key: 'hall', label: 'Hall', render: r => r.hall?.name },
    { key: 'type', label: 'Type', render: r => <span style={{ textTransform: 'capitalize' }}>{r.type}</span> },
    { key: 'floor', label: 'Floor' },
    { key: 'capacity', label: 'Capacity', render: r => `${r.currentOccupancy}/${r.capacity}` },
    { key: 'monthlyFee', label: 'Monthly Fee', render: r => `৳${Number(r.monthlyFee).toLocaleString()}` },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn size="sm" variant="secondary" onClick={() => openEditRoom(r)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => deleteRoom(r.id)}>Delete</Btn>
      </div>
    )},
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Halls & Rooms" subtitle="Manage dormitory halls and room inventory" />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['halls', 'rooms'].map(t => (
          <Btn key={t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</Btn>
        ))}
      </div>

      {tab === 'halls' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>All Halls ({halls.length})</h3>
            <Btn onClick={() => { setEditItem(null); setHallForm({ name: '', description: '', managerId: '' }); setHallModal(true); }}>+ Add Hall</Btn>
          </div>
          <DataTable columns={hallCols} data={halls} />
        </Card>
      )}

      {tab === 'rooms' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>All Rooms ({rooms.length})</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select style={filterStyle} value={filterHall} onChange={e => setFilterHall(e.target.value)}>
                <option value="">All Halls</option>
                {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <select style={filterStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                {['available', 'occupied', 'maintenance', 'reserved'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Btn onClick={() => { setEditItem(null); setRoomForm({ roomNumber: '', hallId: '', type: 'single', capacity: 1, monthlyFee: '', floor: 1, status: 'available' }); setRoomModal(true); }}>+ Add Room</Btn>
            </div>
          </div>
          <DataTable columns={roomCols} data={rooms} />
        </Card>
      )}

      {/* Hall Modal */}
      <Modal open={hallModal} onClose={() => setHallModal(false)} title={editItem ? 'Edit Hall' : 'Add New Hall'}>
        <Field label="Hall Name" required><Input value={hallForm.name} onChange={e => setHallForm({ ...hallForm, name: e.target.value })} placeholder="e.g. Shahjalal Hall" /></Field>
        <Field label="Description"><Textarea value={hallForm.description} onChange={e => setHallForm({ ...hallForm, description: e.target.value })} placeholder="Brief description..." /></Field>
        <Field label="Assign Manager">
          <Select value={hallForm.managerId} onChange={e => setHallForm({ ...hallForm, managerId: e.target.value })}>
            <option value="">Select Manager (optional)</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setHallModal(false)}>Cancel</Btn>
          <Btn onClick={saveHall}>Save Hall</Btn>
        </div>
      </Modal>

      {/* Room Modal */}
      <Modal open={roomModal} onClose={() => setRoomModal(false)} title={editItem ? 'Edit Room' : 'Add New Room'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Room Number" required><Input value={roomForm.roomNumber} onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="e.g. 101A" /></Field>
          <Field label="Floor"><Input type="number" value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} min={1} /></Field>
        </div>
        <Field label="Hall" required>
          <Select value={roomForm.hallId} onChange={e => setRoomForm({ ...roomForm, hallId: e.target.value })}>
            <option value="">Select Hall</option>
            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Room Type">
            <Select value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}>
              {['single', 'double', 'triple', 'dormitory'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Capacity"><Input type="number" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} min={1} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Monthly Fee (৳)" required><Input type="number" value={roomForm.monthlyFee} onChange={e => setRoomForm({ ...roomForm, monthlyFee: e.target.value })} placeholder="e.g. 3500" /></Field>
          <Field label="Status">
            <Select value={roomForm.status} onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}>
              {['available', 'occupied', 'maintenance', 'reserved'].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setRoomModal(false)}>Cancel</Btn>
          <Btn onClick={saveRoom}>Save Room</Btn>
        </div>
      </Modal>
    </div>
  );
};

const filterStyle = { padding: '7px 10px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 13, background: '#fff' };
