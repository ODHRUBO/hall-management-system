import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportsAPI } from '../../services/api';
import { PageHeader, Card, Spinner, Alert } from '../dashboard/UI';

const COLORS = ['#6c3fc5', '#0a7d6b', '#e67e22', '#e74c3c', '#3498db', '#1abc9c', '#9b59b6'];

export const ReportsPage = () => {
  const [tab, setTab] = useState('occupancy');
  const [occupancy, setOccupancy] = useState([]);
  const [payReport, setPayReport] = useState(null);
  const [cmpReport, setCmpReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    Promise.all([reportsAPI.getOccupancy(), reportsAPI.getPayments({ year }), reportsAPI.getComplaints()])
      .then(([o, p, c]) => { setOccupancy(o.data); setPayReport(p.data); setCmpReport(c.data); })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load reports' }))
      .finally(() => setLoading(false));
  }, [year]);

  const tabs = ['occupancy', 'payments', 'complaints'];

  if (loading) return <Spinner text="Generating reports..." />;

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive data insights and export tools" />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e8ecf2', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t ? 600 : 400, color: tab === t ? '#1a1a2e' : '#888',
            borderBottom: tab === t ? '2px solid #1a1a2e' : '2px solid transparent',
            marginBottom: -2, textTransform: 'capitalize', fontSize: 14,
          }}>{t}</button>
        ))}
      </div>

      {/* Occupancy Report */}
      {tab === 'occupancy' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {occupancy.map(hall => (
              <Card key={hall.hallId}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#1a1a2e' }}>{hall.hallName}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Total Rooms', v: hall.totalRooms, c: '#6c3fc5' },
                    { label: 'Capacity', v: hall.totalCapacity, c: '#1a6fb5' },
                    { label: 'Occupied', v: hall.totalOccupied, c: '#dc3545' },
                    { label: 'Available', v: hall.byStatus.available, c: '#28a745' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#f6f8fc', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, color: '#888' }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>Occupancy Rate</span><strong>{hall.occupancyRate}%</strong>
                  </div>
                  <div style={{ background: '#e8ecf2', borderRadius: 4, height: 10 }}>
                    <div style={{
                      width: `${hall.occupancyRate}%`, height: '100%', borderRadius: 4,
                      background: hall.occupancyRate > 90 ? '#dc3545' : hall.occupancyRate > 70 ? '#e67e22' : '#28a745',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={120} style={{ marginTop: 12 }}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Available', value: hall.byStatus.available },
                      { name: 'Occupied', value: hall.byStatus.occupied },
                      { name: 'Maintenance', value: hall.byStatus.maintenance },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={50} dataKey="value" label>
                      {['#28a745', '#dc3545', '#ffc107'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Payment Report */}
      {tab === 'payments' && payReport && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 14, color: '#555' }}>Year:</label>
            <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '6px 10px', border: '1.5px solid #d8dce8', borderRadius: 8, fontSize: 14 }}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={summaryCard}><div style={summaryLabel}>Total Collected</div><div style={{ ...summaryVal, color: '#28a745' }}>৳{payReport.totals.collected.toLocaleString()}</div></div>
            <div style={summaryCard}><div style={summaryLabel}>Outstanding</div><div style={{ ...summaryVal, color: '#dc3545' }}>৳{payReport.totals.outstanding.toLocaleString()}</div></div>
          </div>

          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Monthly Breakdown — {year}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={payReport.monthly.filter(m => m.total > 0)}>
                <XAxis dataKey="month" tickFormatter={m => m.slice(0, 3)} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
                <Bar dataKey="paid" fill="#28a745" name="Paid" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#ffc107" name="Pending" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" fill="#dc3545" name="Overdue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Complaint Report */}
      {tab === 'complaints' && cmpReport && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total', v: cmpReport.total, c: '#6c3fc5' },
              { label: 'Resolved', v: cmpReport.resolved, c: '#28a745' },
              { label: 'Pending', v: cmpReport.pending, c: '#e67e22' },
              { label: 'Urgent', v: cmpReport.byPriority.urgent, c: '#dc3545' },
            ].map(s => (
              <div key={s.label} style={summaryCard}><div style={summaryLabel}>{s.label}</div><div style={{ ...summaryVal, color: s.c }}>{s.v}</div></div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>By Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cmpReport.byCategory} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="category" type="category" fontSize={12} width={80} tickFormatter={c => c.slice(0, 10)} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#6c3fc5" name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="resolved" fill="#28a745" name="Resolved" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>By Priority</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={Object.entries(cmpReport.byPriority).map(([k, v]) => ({ name: k, value: v }))}
                    cx="50%" cy="50%" outerRadius={85} dataKey="value" label>
                    {Object.keys(cmpReport.byPriority).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const summaryCard = { background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const summaryLabel = { fontSize: 12, color: '#888', marginBottom: 4 };
const summaryVal = { fontSize: 24, fontWeight: 700 };
