const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const hallCtrl = require('../controllers/hallController');
const appCtrl = require('../controllers/applicationController');
const payCtrl = require('../controllers/paymentController');
const cmpCtrl = require('../controllers/complaintController');
const rptCtrl = require('../controllers/reportController');

// ─── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], authCtrl.register);

router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.put('/auth/profile', authenticate, authCtrl.updateProfile);
router.put('/auth/change-password', authenticate, authCtrl.changePassword);

// ─── User Management (Admin) ───────────────────────────────────────────────
const { User } = require('../models');
const userFields = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'hall_manager', 'student']),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }),
];
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal server error' }); }
});

router.post('/users', authenticate, authorize('admin'), userFields, validateRequest, async (req, res) => {
  try {
    const { name, email, password, role, studentId, phone, department } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    const user = await User.create({ name, email, password, role, studentId, phone, department });
    res.status(201).json({ message: 'User created', user });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal server error' }); }
});

router.put('/users/:id', authenticate, authorize('admin'), userFields, validateRequest, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { name, email, password, role, studentId, phone, department } = req.body;
    const updates = { name, email, role, studentId, phone, department };
    if (password) updates.password = password;
    await user.update(updates);
    res.json({ message: 'User updated', user });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal server error' }); }
});

router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal server error' }); }
});

// ─── Halls ─────────────────────────────────────────────────────────────────
router.get('/halls', authenticate, hallCtrl.getAllHalls);
router.post('/halls', authenticate, authorize('admin'), hallCtrl.createHall);
router.put('/halls/:id', authenticate, authorize('admin'), hallCtrl.updateHall);
router.delete('/halls/:id', authenticate, authorize('admin'), hallCtrl.deleteHall);

// ─── Rooms ─────────────────────────────────────────────────────────────────
router.get('/rooms', authenticate, hallCtrl.getRooms);
router.post('/rooms', authenticate, authorize('admin', 'hall_manager'), hallCtrl.createRoom);
router.put('/rooms/:id', authenticate, authorize('admin', 'hall_manager'), hallCtrl.updateRoom);
router.delete('/rooms/:id', authenticate, authorize('admin'), hallCtrl.deleteRoom);

// ─── Applications ──────────────────────────────────────────────────────────
router.get('/applications', authenticate, appCtrl.getApplications);
router.post('/applications', authenticate, authorize('student'), [
  body('hallId').isUUID(),
  body('preferredRoomType').isIn(['single', 'double', 'triple', 'dormitory']),
  body('session').trim().notEmpty(),
], validateRequest, appCtrl.submitApplication);
router.put('/applications/:id/review', authenticate, authorize('admin', 'hall_manager'), appCtrl.reviewApplication);

// ─── Allocations ───────────────────────────────────────────────────────────
router.get('/allocations', authenticate, appCtrl.getAllocations);

// ─── Payments ──────────────────────────────────────────────────────────────
router.get('/payments', authenticate, payCtrl.getPayments);
router.get('/payments/summary', authenticate, payCtrl.getPaymentSummary);
router.post('/payments/generate', authenticate, authorize('admin'), payCtrl.generateMonthlyFees);
router.put('/payments/mark-overdue', authenticate, authorize('admin'), payCtrl.markOverduePayments);
router.put('/payments/:id/confirm', authenticate, authorize('admin', 'hall_manager'), payCtrl.confirmPayment);

// ─── Complaints ────────────────────────────────────────────────────────────
router.get('/complaints', authenticate, cmpCtrl.getComplaints);
router.get('/complaints/stats', authenticate, authorize('admin', 'hall_manager'), cmpCtrl.getComplaintStats);
router.post('/complaints', authenticate, authorize('student'), [
  body('hallId').isUUID(),
  body('category').isIn(['maintenance', 'noise', 'hygiene', 'security', 'facilities', 'staff', 'other']),
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], validateRequest, cmpCtrl.submitComplaint);
router.put('/complaints/:id/update', authenticate, authorize('admin', 'hall_manager'), cmpCtrl.updateComplaint);

// ─── Reports ───────────────────────────────────────────────────────────────
router.get('/reports/dashboard', authenticate, authorize('admin', 'hall_manager'), rptCtrl.getDashboardStats);
router.get('/reports/occupancy', authenticate, authorize('admin', 'hall_manager'), rptCtrl.getOccupancyReport);
router.get('/reports/payments', authenticate, authorize('admin', 'hall_manager'), rptCtrl.getPaymentReport);
router.get('/reports/complaints', authenticate, authorize('admin', 'hall_manager'), rptCtrl.getComplaintReport);

module.exports = router;
