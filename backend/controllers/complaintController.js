const { Complaint, User, Hall } = require('../models');

// POST /api/complaints
const submitComplaint = async (req, res) => {
  try {
    const { hallId, category, title, description, priority } = req.body;
    const complaint = await Complaint.create({
      studentId: req.user.id, hallId, category, title, description, priority,
    });
    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/complaints
const getComplaints = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') where.studentId = req.user.id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;
    if (req.query.hallId) where.hallId = req.query.hallId;

    const complaints = await Complaint.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'studentId'] },
        { model: Hall, as: 'hall', attributes: ['id', 'name'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/complaints/:id/update — admin/manager updates status
const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const { status, resolution, assignedToId, priority } = req.body;
    const updates = { status, priority };
    if (assignedToId) updates.assignedToId = assignedToId;
    if (resolution) updates.resolution = resolution;
    if (status === 'resolved') updates.resolvedAt = new Date();

    await complaint.update(updates);
    res.json({ message: 'Complaint updated', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/complaints/stats
const getComplaintStats = async (req, res) => {
  try {
    const all = await Complaint.findAll();
    const stats = {
      total: all.length,
      submitted: all.filter(c => c.status === 'submitted').length,
      under_review: all.filter(c => c.status === 'under_review').length,
      in_progress: all.filter(c => c.status === 'in_progress').length,
      resolved: all.filter(c => c.status === 'resolved').length,
      closed: all.filter(c => c.status === 'closed').length,
      byCategory: {},
    };
    all.forEach(c => {
      stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitComplaint, getComplaints, updateComplaint, getComplaintStats };
