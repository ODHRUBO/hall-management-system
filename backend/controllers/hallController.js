const { Hall, Room, User, Allocation, sequelize } = require('../models');
const { Op } = require('sequelize');
const { canManageHall } = require('../middleware/managerScope');

// ─── Halls ─────────────────────────────────────────────────────────────────
const getAllHalls = async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.user.role === 'hall_manager') where.managerId = req.user.id;
    const halls = await Hall.findAll({
      where,
      include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'email'] }],
    });
    res.json(halls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createHall = async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    const normalizedManagerId = managerId || null;
    if (normalizedManagerId) {
      const manager = await User.findOne({
        where: { id: normalizedManagerId, role: 'hall_manager', isActive: true },
      });
      if (!manager) return res.status(400).json({ message: 'Selected manager is invalid' });
    }
    const hall = await Hall.create({ name, description, managerId: normalizedManagerId });
    res.status(201).json({ message: 'Hall created', hall });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findByPk(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });
    const { name, description, managerId, isActive } = req.body;
    const normalizedManagerId = managerId || null;
    if (normalizedManagerId) {
      const manager = await User.findOne({
        where: { id: normalizedManagerId, role: 'hall_manager', isActive: true },
      });
      if (!manager) return res.status(400).json({ message: 'Selected manager is invalid' });
    }
    await hall.update({ name, description, managerId: normalizedManagerId, isActive });
    res.json({ message: 'Hall updated', hall });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByPk(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });
    await hall.update({ isActive: false });
    res.json({ message: 'Hall deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Rooms ─────────────────────────────────────────────────────────────────
const getRooms = async (req, res) => {
  try {
    const { hallId, status, type } = req.query;
    const where = {};
    if (hallId) where.hallId = hallId;
    if (req.user.role === 'hall_manager') where.hallId = { [Op.in]: (await require('../middleware/managerScope').getManagedHallIds(req.user)) };
    if (status) where.status = status;
    if (type) where.type = type;

    const rooms = await Room.findAll({
      where,
      include: [{ model: Hall, as: 'hall', attributes: ['id', 'name'] }],
      order: [['floor', 'ASC'], ['roomNumber', 'ASC']],
    });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, hallId, type, capacity, monthlyFee, floor, facilities } = req.body;
    const existing = await Room.findOne({ where: { roomNumber, hallId } });
    if (!(await canManageHall(req.user, hallId))) return res.status(403).json({ message: 'Insufficient permissions' });
    if (existing) return res.status(400).json({ message: 'Room already exists in this hall' });

    const transaction = await sequelize.transaction();
    try {
      const room = await Room.create({ roomNumber, hallId, type, capacity, monthlyFee, floor, facilities }, { transaction });
      await Hall.increment('totalRooms', { where: { id: hallId }, transaction });
      await transaction.commit();
      return res.status(201).json({ message: 'Room created', room });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!(await canManageHall(req.user, room.hallId))) return res.status(403).json({ message: 'Insufficient permissions' });
    const updates = { roomNumber: req.body.roomNumber, type: req.body.type, capacity: req.body.capacity,
      monthlyFee: req.body.monthlyFee, floor: req.body.floor, facilities: req.body.facilities, status: req.body.status };
    await room.update(updates);
    res.json({ message: 'Room updated', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.currentOccupancy > 0) {
      return res.status(400).json({ message: 'Cannot delete occupied room' });
    }
    const transaction = await sequelize.transaction();
    try {
      await room.destroy({ transaction });
      await Hall.decrement('totalRooms', { where: { id: room.hallId }, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    res.json({ message: 'Room deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllHalls, createHall, updateHall, deleteHall, getRooms, createRoom, updateRoom, deleteRoom };
