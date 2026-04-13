const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// ─── User ────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'hall_manager', 'student'), defaultValue: 'student' },
  studentId: { type: DataTypes.STRING, unique: true, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  profileImage: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// ─── Hall ────────────────────────────────────────────────────────────────────
const Hall = sequelize.define('Hall', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  totalRooms: { type: DataTypes.INTEGER, defaultValue: 0 },
  managerId: { type: DataTypes.UUID, allowNull: true, references: { model: 'Users', key: 'id' } },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// ─── Room ────────────────────────────────────────────────────────────────────
const Room = sequelize.define('Room', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  roomNumber: { type: DataTypes.STRING, allowNull: false },
  hallId: { type: DataTypes.UUID, allowNull: false, references: { model: 'Halls', key: 'id' } },
  type: { type: DataTypes.ENUM('single', 'double', 'triple', 'dormitory'), defaultValue: 'single' },
  capacity: { type: DataTypes.INTEGER, defaultValue: 1 },
  currentOccupancy: { type: DataTypes.INTEGER, defaultValue: 0 },
  monthlyFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  floor: { type: DataTypes.INTEGER, defaultValue: 1 },
  facilities: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'reserved'), defaultValue: 'available' },
});

// ─── RoomApplication ─────────────────────────────────────────────────────────
const RoomApplication = sequelize.define('RoomApplication', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false, references: { model: 'Users', key: 'id' } },
  hallId: { type: DataTypes.UUID, allowNull: false, references: { model: 'Halls', key: 'id' } },
  preferredRoomType: { type: DataTypes.ENUM('single', 'double', 'triple', 'dormitory'), allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'), defaultValue: 'pending' },
  assignedRoomId: { type: DataTypes.UUID, allowNull: true, references: { model: 'Rooms', key: 'id' } },
  reviewedById: { type: DataTypes.UUID, allowNull: true, references: { model: 'Users', key: 'id' } },
  reviewNote: { type: DataTypes.TEXT, allowNull: true },
  session: { type: DataTypes.STRING, allowNull: false },
});

// ─── RoomChangeRequest ────────────────────────────────────────────────────────
const RoomChangeRequest = sequelize.define('RoomChangeRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  currentRoomId: { type: DataTypes.UUID, allowNull: false },
  requestedRoomId: { type: DataTypes.UUID, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  reviewedById: { type: DataTypes.UUID, allowNull: true },
  reviewNote: { type: DataTypes.TEXT, allowNull: true },
});

// ─── Allocation ───────────────────────────────────────────────────────────────
const Allocation = sequelize.define('Allocation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  roomId: { type: DataTypes.UUID, allowNull: false },
  hallId: { type: DataTypes.UUID, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'vacated', 'transferred'), defaultValue: 'active' },
  session: { type: DataTypes.STRING, allowNull: false },
});

// ─── Payment ──────────────────────────────────────────────────────────────────
const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  allocationId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  month: { type: DataTypes.STRING, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  paidDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'paid', 'overdue', 'waived'), defaultValue: 'pending' },
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  transactionId: { type: DataTypes.STRING, allowNull: true },
  confirmedById: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

// ─── Complaint ────────────────────────────────────────────────────────────────
const Complaint = sequelize.define('Complaint', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  hallId: { type: DataTypes.UUID, allowNull: false },
  category: { type: DataTypes.ENUM('maintenance', 'noise', 'hygiene', 'security', 'facilities', 'staff', 'other'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('submitted', 'under_review', 'in_progress', 'resolved', 'closed'), defaultValue: 'submitted' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  assignedToId: { type: DataTypes.UUID, allowNull: true },
  resolution: { type: DataTypes.TEXT, allowNull: true },
  resolvedAt: { type: DataTypes.DATE, allowNull: true },
});

// ─── Associations ─────────────────────────────────────────────────────────────
Hall.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
Hall.hasMany(Room, { foreignKey: 'hallId', as: 'rooms' });
Room.belongsTo(Hall, { foreignKey: 'hallId', as: 'hall' });

RoomApplication.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
RoomApplication.belongsTo(Hall, { as: 'hall', foreignKey: 'hallId' });
RoomApplication.belongsTo(Room, { as: 'assignedRoom', foreignKey: 'assignedRoomId' });
RoomApplication.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedById' });

Allocation.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Allocation.belongsTo(Room, { as: 'room', foreignKey: 'roomId' });
Allocation.belongsTo(Hall, { as: 'hall', foreignKey: 'hallId' });

Payment.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Payment.belongsTo(Allocation, { foreignKey: 'allocationId' });
Payment.belongsTo(User, { as: 'confirmedBy', foreignKey: 'confirmedById' });

Complaint.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Complaint.belongsTo(Hall, { as: 'hall', foreignKey: 'hallId' });
Complaint.belongsTo(User, { as: 'assignedTo', foreignKey: 'assignedToId' });

module.exports = { User, Hall, Room, RoomApplication, RoomChangeRequest, Allocation, Payment, Complaint, sequelize };
