import { db } from '../config/firebase';
import { TrafficSignal } from '../models/types';

export const signalService = {
  async getSignals(): Promise<TrafficSignal[]> {
    const snapshot = await db.collection('trafficSignals').get();
    return snapshot.docs.map(doc => doc.data() as TrafficSignal);
  },

  async updateSignalStatus(id: string, status: 'RED' | 'GREEN'): Promise<void> {
    await db.collection('trafficSignals').doc(id).set({
      status,
      lastChanged: new Date().toISOString()
    }, { merge: true });
  }
};
