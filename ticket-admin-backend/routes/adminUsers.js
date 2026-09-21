const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ທຸກ route ໃນນີ້ຕ້ອງ login ກ່ອນສະເໝີ
router.use(requireAuth);

// ປ່ຽນລະຫັດຜ່ານຂອງຕົນເອງ - ຜູ້ໃຊ້ທຸກ role (User/Admin) ເຮັດໄດ້ ບໍ່ຕ້ອງເປັນ Admin
router.patch('/me/password', adminUserController.changeOwnPassword);

// ທີ່ເຫຼືອ (ຈັດການຜູ້ໃຊ້ຄົນອື່ນ) ຕ້ອງເປັນ Admin ເທົ່ານັ້ນ
router.get('/', requireAdmin, adminUserController.getAllUsers);
router.post('/', requireAdmin, adminUserController.createUser);
router.put('/:id', requireAdmin, adminUserController.updateUser);
router.patch('/:id/reset-password', requireAdmin, adminUserController.resetPassword);
router.patch('/:id/status', requireAdmin, adminUserController.toggleStatus);

module.exports = router;
