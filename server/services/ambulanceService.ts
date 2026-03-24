import { db } from '../config/firebase';
import { Ambulance, Location } from '../models/types';

export const ambulanceService = {
  async getAmbulance(id: string): Promise<Ambulance | null> {
    const docSnap = await db.collection('ambulances').doc(id).get();
    return docSnap.exists ? (docSnap.data() as Ambulance) : null;
  },

  async updateLocation(id: string, location: Location): Promise<void> {
    await db.collection('ambulances').doc(id).set({
      currentLocation: location,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  },

  async startEmergency(id: string, destination: Location, route: Location[]): Promise<void> {
    await db.collection('ambulances').doc(id).set({
      status: 'active',
      destination,
      route,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  },

  async stopEmergency(id: string): Promise<void> {
    await db.collection('ambulances').doc(id).set({
      status: 'idle',
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
};
