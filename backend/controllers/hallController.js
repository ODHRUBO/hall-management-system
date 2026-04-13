const { Hall, Room, User, Allocation } = require('../models');
const { Op } = require('sequelize');

// ─── Halls ─────────────────────────────────────────────────────────────────
const getAllHalls = async (req, res) => {
  try {
    const halls = await Hall.findAll({
      where: { isActive: true },
      include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'email'] }],
    });
    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createHall = async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    const hall = await Hall.create({ name, description, managerId });
    res.status(201).json({ message: 'Hall created', hall });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findByPk(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });
    await hall.update(req.body);
    res.json({ message: 'Hall updated', hall });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByPk(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });
    await hall.update({ isActive: false });
    res.json({ message: 'Hall deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Rooms ─────────────────────────────────────────────────────────────────
const getRooms = async (req, res) => {
  try {
    const { hallId, status, type } = req.query;
    const where = {};
    if (hallId) where.hallId = hallId;
    if (status) where.status = status;
    if (type) where.type = type;

    const rooms = await Room.findAll({
      where,
      include: [{ model: Hall, as: 'hall', attributes: ['id', 'name'] }],
      order: [['floor', 'ASC'], ['roomNumber', 'ASC']],
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, hallId, type, capacity, monthlyFee, floor, facilities } = req.body;
    const existing = await Room.findOne({ where: { roomNumber, hallId } });
    if (existing) return res.status(400).json({ message: 'Room already exists in this hall' });

    const room = await Room.create({ roomNumber, hallId, type, capacity, monthlyFee, floor, facilities });

    await Hall.increment('totalRooms', { where: { id: hallId } });

    res.status(201).json({ message: 'Room created', room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await room.update(req.body);
    res.json({ message: 'Room updated', room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.currentOccupancy > 0) {
      return res.status(400).json({ message: 'Cannot delete occupied room' });
    }
    await room.destroy();
    await Hall.decrement('totalRooms', { where: { id: room.hallId } });
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllHalls, createHall, updateHall, deleteHall, getRooms, createRoom, updateRoom, deleteRoom };
