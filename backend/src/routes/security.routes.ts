import { Router } from 'express';
import { scanQRCode } from '../controllers/security.controller';
import { requireRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
// in security.routes.ts
router.post('/scan-test', (req, res) => {
  console.log('Scan test hit!');
  res.json({ message: 'Scan test route works!' });
});

// ✅ Fix: use GET and include route params
router.get('/scan/:passId/:token', requireRole(Role.SECURITY), scanQRCode);

export default router;
