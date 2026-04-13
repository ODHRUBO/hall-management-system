const { Payment, Allocation, Room, User, Hall } = require('../models');
const { Op } = require('sequelize');

// GET /api/payments
const getPayments = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') where.studentId = req.user.id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.month) where.month = req.query.month;
    if (req.query.year) where.year = req.query.year;

    const payments = await Payment.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'studentId'] },
        {
          model: Allocation,
          include: [{ model: Room, as: 'room', attributes: ['id', 'roomNumber', 'type', 'monthlyFee'] }],
        },
      ],
      order: [['dueDate', 'DESC']],
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/generate — admin generates monthly fees
const generateMonthlyFees = async (req, res) => {
  try {
    const { month, year } = req.body;
    const allocations = await Allocation.findAll({
      where: { status: 'active' },
      include: [{ model: Room, as: 'room' }],
    });

    const created = [];
    for (const alloc of allocations) {
      const existing = await Payment.findOne({
        where: { allocationId: alloc.id, month, year },
      });
      if (!existing) {
        const dueDate = new Date(year, new Date(`${month} 1`).getMonth(), 10);
        const payment = await Payment.create({
          studentId: alloc.studentId,
          allocationId: alloc.id,
          amount: alloc.room.monthlyFee,
          month,
          year,
          dueDate,
        });
        created.push(payment);
      }
    }

    res.json({ message: `Generated ${created.length} payment records for ${month} ${year}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/payments/:id/confirm — admin confirms payment
const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const { paymentMethod, transactionId, notes } = req.body;
    await payment.update({
      status: 'paid',
      paidDate: new Date(),
      paymentMethod,
      transactionId,
      notes,
      confirmedById: req.user.id,
    });

    res.json({ message: 'Payment confirmed', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/payments/mark-overdue — cron-style endpoint
const markOverduePayments = async (req, res) => {
  try {
    const [count] = await Payment.update(
      { status: 'overdue' },
      {
        where: {
          status: 'pending',
          dueDate: { [Op.lt]: new Date() },
        },
      }
    );
    res.json({ message: `Marked ${count} payments as overdue` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/summary — student's own summary
const getPaymentSummary = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
    const all = await Payment.findAll({ where: { studentId } });
    const summary = {
      total: all.length,
      paid: all.filter(p => p.status === 'paid').length,
      pending: all.filter(p => p.status === 'pending').length,
      overdue: all.filter(p => p.status === 'overdue').length,
      totalAmount: all.reduce((s, p) => s + Number(p.amount), 0),
      paidAmount: all.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    };
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayments, generateMonthlyFees, confirmPayment, markOverduePayments, getPaymentSummary };
