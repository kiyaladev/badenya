import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../controllers/upload.controller';

const router = Router();

router.post('/image', authenticate, uploadImage);

export default router;
