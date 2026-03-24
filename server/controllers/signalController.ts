import { Request, Response } from 'express';
import { signalService } from '../services/signalService';

export const getSignals = async (req: Request, res: Response) => {
  try {
    const signals = await signalService.getSignals();
    res.status(200).json(signals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
};

export const updateSignal = async (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    await signalService.updateSignalStatus(id, status);
    res.status(200).json({ message: 'Signal updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update signal' });
  }
};
