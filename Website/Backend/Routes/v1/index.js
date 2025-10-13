import express from 'express';
import HealthRoutes from '../../Routes/HealthRoutes.js';
import AuthenticationRoutes from '../../Routes/AuthenticationRoutes.js';
import AdminRoutes from '../../Routes/AdminRoutes.js';
import UserRoutes from '../../Routes/UserRoutes.js';
// 🔧 PAGINATION #83: Import pagination controller
import PaginationRoutes from '../../Controllers/PaginationController.js';

const router = express.Router();

// Mount all version 1 routes
router.use('/health', HealthRoutes);
router.use('/auth', AuthenticationRoutes);
router.use('/admin', AdminRoutes);
router.use('/user', UserRoutes);
// 🔧 PAGINATION #83: Mount pagination routes
router.use('/pagination', PaginationRoutes);

// Add more routes as needed
// router.use('/chat', ChatRoutes);
// router.use('/message', MessageRoutes);

export default router;