import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportsAPI, complaintsAPI } from '../../services/api';
import { StatCard, Card, Spinner, PageHeader, Alert } from './UI';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#6c3fc5', '#0a7d6b', '#e67e22', '#e74c3c', '#3498db'];

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [occupancy, setOccupancy] = useState([]);
  const [payReport, setPayReport] = useState(null);
  const [cmpStats, setCmpStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.getDashboard(),
      reportsAPI.getOccupancy(),
      reportsAPI.getPayments({ year: new Date().getFullYear() }),
      complaintsAPI.getStats(),
    ])
      .then(([s, o, p, c]) => {
        setStats(s.data);
        setOccupancy(o.data);
        setPayReport(p.data);
        setCmpStats(c.data);
      })
      .catch(() => setError('Failed to load dashboard data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading dashboard..." />;

  const payChartData = payReport?.monthly?.filter(m => m.total > 0).map(m => ({
    name: m.month.slice(0, 3), paid: m.paid, pending: m.pending, overdue: m.overdue,
  }));

  const cmpPieData = cmpStats ? [
    { name: 'Resolved', value: cmpStats.resolved },
    { name: 'Pending', value: cmpStats.pending },
  ] : [];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name} 👋`}
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />
      {error && <Alert type="error">{error}</Alert>}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Students" value={stats?.totalStudents} icon="🎓" color="#6c3fc5" />
        <StatCard label="Total Rooms" value={stats?.totalRooms} icon="🏠" color="#0a7d6b" />
        <StatCard label="Active Allocations" value={stats?.activeAllocations} icon="✅" color="#1a6fb5" />
        <StatCard label="Pending Applications" value={stats?.pendingApplications} icon="📋" color="#e67e22" />
        <StatCard label="Pending Payments" value={stats?.pendingPayments} icon="💳" color="#e74c3c" />
        <StatCard label="Open Complaints" value={stats?.openComplaints} icon="📢" color="#c0392b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Payment Chart */}
        {payChartData?.length > 0 && (
          <Card>
            <h3 style={chartTitle}>Monthly Payment Status ({new Date().getFullYear()})</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={payChartData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="paid" fill="#28a745" name="Paid" radius={[3,3,0,0]} />
                <Bar dataKey="pending" fill="#ffc107" name="Pending" radius={[3,3,0,0]} />
                <Bar dataKey="overdue" fill="#dc3545" name="Overdue" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Complaint Pie */}
        {cmpPieData.some(d => d.value > 0) && (
          <Card>
            <h3 style={chartTitle}>Complaints Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={cmpPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {cmpPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Occupancy Table */}
      {occupancy.length > 0 && (
        <Card>
          <h3 style={chartTitle}>Hall Occupancy Overview</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>{['Hall', 'Rooms', 'Capacity', 'Occupied', 'Available', 'Maintenance', 'Occupancy Rate'].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', background: '#f6f8fc', color: '#555', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #e8ecf2' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {occupancy.map((h, i) => (
                <tr key={h.hallId} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={td}><strong>{h.hallName}</strong></td>
                  <td style={td}>{h.totalRooms}</td>
                  <td style={td}>{h.totalCapacity}</td>
                  <td style={td}>{h.totalOccupied}</td>
                  <td style={td}><span style={{ color: '#28a745' }}>{h.byStatus.available}</span></td>
                  <td style={td}><span style={{ color: '#ffc107' }}>{h.byStatus.maintenance}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#e8f4fd', borderRadius: 4, height: 8 }}>
                        <div style={{ width: `${h.occupancyRate}%`, background: h.occupancyRate > 80 ? '#dc3545' : '#28a745', height: '100%', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, minWidth: 36 }}>{h.occupancyRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const chartTitle = { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a2e' };
const td = { padding: '10px 12px', borderBottom: '1px solid #f0f2f6', color: '#333' };
