const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ทุก route ในนี้ต้อง login ก่อนเสมอ
router.use(requireAuth);

// เปลี่ยนรหัสผ่านของตัวเอง - ผู้ใช้ทุก role (User/Admin) ทำได้ ไม่ต้องเป็น Admin
router.patch('/me/password', adminUserController.changeOwnPassword);

// ที่เหลือ (จัดการผู้ใช้คนอื่น) ต้องเป็น Admin เท่านั้น
router.get('/', requireAdmin, adminUserController.getAllUsers);
router.post('/', requireAdmin, adminUserController.createUser);
router.put('/:id', requireAdmin, adminUserController.updateUser);
router.patch('/:id/reset-password', requireAdmin, adminUserController.resetPassword);
router.patch('/:id/status', requireAdmin, adminUserController.toggleStatus);

module.exports = router;
