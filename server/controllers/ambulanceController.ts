import { Request, Response } from 'express';
import { ambulanceService } from '../services/ambulanceService';

export const startAmbulance = async (req: Request, res: Response) => {
  try {
    const { id, destination, route } = req.body;
    await ambulanceService.startEmergency(id, destination, route);
    res.status(200).json({ message: 'Ambulance started emergency mode' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start ambulance' });
  }
};

export const stopAmbulance = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await ambulanceService.stopEmergency(id);
    res.status(200).json({ message: 'Ambulance stopped emergency mode' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop ambulance' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id, location } = req.body;
    await ambulanceService.updateLocation(id, location);
    res.status(200).json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
};
