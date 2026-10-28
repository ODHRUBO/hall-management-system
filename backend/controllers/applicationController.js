const { RoomApplication, Room, Hall, Allocation, Payment, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getManagedHallIds, canManageHall } = require('../middleware/managerScope');

// POST /api/applications — student submits application
const submitApplication = async (req, res) => {
  try {
    const { hallId, preferredRoomType, reason, session } = req.body;

    const existing = await RoomApplication.findOne({
      where: { studentId: req.user.id, session, status: { [Op.in]: ['pending', 'approved'] } },
    });
    if (existing) return res.status(400).json({ message: 'You already have an active application for this session' });

    const application = await RoomApplication.create({
      studentId: req.user.id, hallId, preferredRoomType, reason, session,
    });
    res.status(201).json({ message: 'Application submitted', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/applications
const getApplications = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') where.studentId = req.user.id;
    if (req.user.role === 'hall_manager') where.hallId = { [Op.in]: await getManagedHallIds(req.user) };
    if (req.query.status) where.status = req.query.status;
    if (req.query.hallId) where.hallId = req.query.hallId;

    const applications = await RoomApplication.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'studentId'] },
        { model: Hall, as: 'hall', attributes: ['id', 'name'] },
        { model: Room, as: 'assignedRoom', attributes: ['id', 'roomNumber', 'type'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/applications/:id/review — admin/manager approves or rejects
const reviewApplication = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { status, reviewNote, assignedRoomId } = req.body;
    const application = await RoomApplication.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!application) {
      await t.rollback();
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Only pending applications can be reviewed' });
    }
    if (!(await canManageHall(req.user, application.hallId))) {
      await t.rollback();
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (status === 'approved') {
      if (!assignedRoomId) {
        await t.rollback();
        return res.status(400).json({ message: 'assignedRoomId is required for approval' });
      }
      const room = await Room.findByPk(assignedRoomId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!room || room.hallId !== application.hallId || room.type !== application.preferredRoomType ||
          room.status === 'maintenance' || room.currentOccupancy >= room.capacity) {
        await t.rollback();
        return res.status(400).json({ message: 'Room not available' });
      }
      const activeAllocation = await Allocation.findOne({
        where: { studentId: application.studentId, status: 'active' },
        transaction: t,
      });
      if (activeAllocation) {
        await t.rollback();
        return res.status(400).json({ message: 'Student already has an active allocation' });
      }

      // Create allocation
      await Allocation.create({
        studentId: application.studentId,
        roomId: assignedRoomId,
        hallId: application.hallId,
        startDate: new Date(),
        session: application.session,
      }, { transaction: t });

      await room.increment('currentOccupancy', { transaction: t });
      if (room.currentOccupancy + 1 >= room.capacity) {
        await room.update({ status: 'occupied' }, { transaction: t });
      }
    }

    await application.update({ status, reviewNote, assignedRoomId, reviewedById: req.user.id }, { transaction: t });
    await t.commit();
    res.json({ message: `Application ${status}`, application });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/allocations
const getAllocations = async (req, res) => {
  try {
    const where = { status: 'active' };
    if (req.user.role === 'student') where.studentId = req.user.id;
    if (req.user.role === 'hall_manager') where.hallId = { [Op.in]: await getManagedHallIds(req.user) };
    if (req.query.hallId) where.hallId = req.query.hallId;

    const allocations = await Allocation.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'studentId', 'phone'] },
        { model: Room, as: 'room' },
        { model: Hall, as: 'hall', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(allocations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { submitApplication, getApplications, reviewApplication, getAllocations };
