const { Hall, Room, Allocation, Payment, Complaint, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getManagedHallIds } = require('../middleware/managerScope');

// GET /api/reports/occupancy
const getOccupancyReport = async (req, res) => {
  try {
    const hallWhere = { isActive: true };
    if (req.user.role === 'hall_manager') hallWhere.id = { [Op.in]: await getManagedHallIds(req.user) };
    const halls = await Hall.findAll({
      where: hallWhere,
      include: [{ model: Room, as: 'rooms' }],
    });

    const report = halls.map(hall => {
      const rooms = hall.rooms;
      const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
      const totalOccupied = rooms.reduce((s, r) => s + r.currentOccupancy, 0);
      return {
        hallId: hall.id,
        hallName: hall.name,
        totalRooms: rooms.length,
        totalCapacity,
        totalOccupied,
        occupancyRate: totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : 0,
        byStatus: {
          available: rooms.filter(r => r.status === 'available').length,
          occupied: rooms.filter(r => r.status === 'occupied').length,
          maintenance: rooms.filter(r => r.status === 'maintenance').length,
        },
        byType: {
          single: rooms.filter(r => r.type === 'single').length,
          double: rooms.filter(r => r.type === 'double').length,
          triple: rooms.filter(r => r.type === 'triple').length,
          dormitory: rooms.filter(r => r.type === 'dormitory').length,
        },
      };
    });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reports/payments
const getPaymentReport = async (req, res) => {
  try {
    const { year } = req.query;
    const where = year ? { year: parseInt(year) } : {};

    const paymentWhere = { ...where };
    if (req.user.role === 'hall_manager') paymentWhere['$Allocation.hallId$'] = { [Op.in]: await getManagedHallIds(req.user) };
    const payments = await Payment.findAll({ where: paymentWhere, include: [{ model: Allocation }] });
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const monthly = months.map(month => {
      const mp = payments.filter(p => p.month === month);
      return {
        month,
        total: mp.length,
        paid: mp.filter(p => p.status === 'paid').length,
        pending: mp.filter(p => p.status === 'pending').length,
        overdue: mp.filter(p => p.status === 'overdue').length,
        collected: mp.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
        outstanding: mp.filter(p => ['pending','overdue'].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0),
      };
    });

    res.json({
      year: year || 'all',
      monthly,
      totals: {
        collected: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
        outstanding: payments.filter(p => ['pending','overdue'].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reports/complaints
const getComplaintReport = async (req, res) => {
  try {
    const complaintWhere = {};
    if (req.user.role === 'hall_manager') complaintWhere.hallId = { [Op.in]: await getManagedHallIds(req.user) };
    const complaints = await Complaint.findAll({
      where: complaintWhere,
      include: [{ model: Hall, as: 'hall', attributes: ['name'] }],
    });

    const categories = ['maintenance','noise','hygiene','security','facilities','staff','other'];
    const byCategory = categories.map(cat => ({
      category: cat,
      total: complaints.filter(c => c.category === cat).length,
      resolved: complaints.filter(c => c.category === cat && c.status === 'resolved').length,
    }));

    res.json({
      total: complaints.length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      pending: complaints.filter(c => !['resolved','closed'].includes(c.status)).length,
      byCategory,
      byPriority: {
        urgent: complaints.filter(c => c.priority === 'urgent').length,
        high: complaints.filter(c => c.priority === 'high').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        low: complaints.filter(c => c.priority === 'low').length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reports/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const managedHallIds = req.user.role === 'hall_manager' ? await getManagedHallIds(req.user) : null;
    const hallFilter = managedHallIds ? { hallId: { [Op.in]: managedHallIds } } : {};
    const paymentFilter = managedHallIds ? { '$Allocation.hallId$': { [Op.in]: managedHallIds } } : {};
    const [totalStudents, totalRooms, activeAllocations, pendingApplications, pendingPayments, openComplaints] = await Promise.all([
      managedHallIds
        ? Allocation.count({ distinct: true, col: 'studentId', where: { status: 'active', ...hallFilter } })
        : User.count({ where: { role: 'student', isActive: true } }),
      Room.count({ where: hallFilter }),
      Allocation.count({ where: { status: 'active', ...hallFilter } }),
      require('../models').RoomApplication.count({ where: { status: 'pending', ...hallFilter } }),
      Payment.count({ where: { status: { [Op.in]: ['pending', 'overdue'] }, ...paymentFilter }, include: managedHallIds ? [{ model: Allocation }] : [] }),
      Complaint.count({ where: { status: { [Op.notIn]: ['resolved', 'closed'] }, ...hallFilter } }),
    ]);

    res.json({ totalStudents, totalRooms, activeAllocations, pendingApplications, pendingPayments, openComplaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getOccupancyReport, getPaymentReport, getComplaintReport, getDashboardStats };
