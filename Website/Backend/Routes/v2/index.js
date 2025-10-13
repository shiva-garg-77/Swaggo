import express from 'express';
import HealthRoutes from '../../Routes/HealthRoutes.js';
import AuthenticationRoutes from '../../Routes/AuthenticationRoutes.js';
import AdminRoutes from '../../Routes/AdminRoutes.js';
import UserRoutes from '../../Routes/UserRoutes.js';

const router = express.Router();

// Mount all version 2 routes
router.use('/health', HealthRoutes);
router.use('/auth', AuthenticationRoutes);
router.use('/admin', AdminRoutes);
router.use('/user', UserRoutes);

// Add more routes as needed
// router.use('/chat', ChatRoutes);
// router.use('/message', MessageRoutes);

export default router;