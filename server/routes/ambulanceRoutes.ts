import { Router } from 'express';
import { startAmbulance, stopAmbulance, updateLocation } from '../controllers/ambulanceController';

const router = Router();

router.post('/start', startAmbulance);
router.post('/stop', stopAmbulance);
router.post('/location-update', updateLocation);

export default router;
