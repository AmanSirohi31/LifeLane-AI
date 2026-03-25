import { Server, Socket } from 'socket.io';
import { ambulanceService } from '../services/ambulanceService';
import { userService } from '../services/userService';
import { signalService } from '../services/signalService';
import { calculateDistance, isAhead } from '../utils/distance';
import { Location } from '../models/types';

const USER_ALERT_THRESHOLD = 500; // meters
const SIGNAL_CONTROL_THRESHOLD = 300; // meters

let ioInstance: Server | null = null;

// Track which users are currently in the alert zone for each ambulance
const alertedUsers = new Map<string, Set<string>>(); // ambulanceId -> Set of socketIds

export const clearAmbulanceAlerts = (ambulanceId: string) => {
  if (!ioInstance) return;
  const currentAlerted = alertedUsers.get(ambulanceId);
  if (currentAlerted) {
    currentAlerted.forEach(socketId => {
      ioInstance!.to(socketId).emit('ambulanceGone', { ambulanceId });
    });
    alertedUsers.delete(ambulanceId);
  }
};

export const setupSocketHandlers = (io: Server) => {
  ioInstance = io;
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('userLocationUpdate', (location: Location) => {
      userService.updateUserLocation(socket.id, location);
    });

    socket.on('ambulanceLocationUpdate', async (data: { id: string; location: Location; heading?: number }) => {
      try {
        const { id, location, heading } = data;
        
        // Update ambulance location in DB
        await ambulanceService.updateLocation(id, location);

        // 1. Check proximity and direction to users
        const activeUsers = userService.getActiveUsers();
        
        if (!alertedUsers.has(id)) {
          alertedUsers.set(id, new Set());
        }
        const currentAlerted = alertedUsers.get(id)!;

        activeUsers.forEach(user => {
          const distance = calculateDistance(location, user.currentLocation);
          const ahead = heading !== undefined ? isAhead(location, heading, user.currentLocation) : true;
          
          const isInZone = distance <= USER_ALERT_THRESHOLD && ahead;

          if (isInZone) {
            io.to(user.socketId).emit('ambulanceNearby', {
              ambulanceId: id,
              distance,
              location,
              heading
            });
            currentAlerted.add(user.socketId);
          } else if (currentAlerted.has(user.socketId)) {
            // User was in zone but now is out
            io.to(user.socketId).emit('ambulanceGone', { ambulanceId: id });
            currentAlerted.delete(user.socketId);
          }
        });

        // 2. Check proximity to traffic signals
        const signals = await signalService.getSignals();
        for (const signal of signals) {
          const distance = calculateDistance(location, signal.location);
          if (distance <= SIGNAL_CONTROL_THRESHOLD) {
            if (signal.status !== 'GREEN') {
              await signalService.updateSignalStatus(signal.id, 'GREEN');
              io.emit('signalUpdate', {
                id: signal.id,
                status: 'GREEN'
              });
            }
          } else if (signal.status === 'GREEN') {
            // Reset signal to RED if ambulance has passed (simple logic)
            await signalService.updateSignalStatus(signal.id, 'RED');
            io.emit('signalUpdate', {
              id: signal.id,
              status: 'RED'
            });
          }
        }
      } catch (error) {
        console.error('Error in ambulanceLocationUpdate:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      userService.removeUser(socket.id);
      
      // Remove user from all alerted sets
      alertedUsers.forEach(set => set.delete(socket.id));
    });
  });
};
