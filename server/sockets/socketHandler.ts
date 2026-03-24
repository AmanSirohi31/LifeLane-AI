import { Server, Socket } from 'socket.io';
import { ambulanceService } from '../services/ambulanceService';
import { userService } from '../services/userService';
import { signalService } from '../services/signalService';
import { calculateDistance } from '../utils/distance';
import { Location } from '../models/types';

const USER_ALERT_THRESHOLD = 500; // meters
const SIGNAL_CONTROL_THRESHOLD = 300; // meters

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('userLocationUpdate', (location: Location) => {
      userService.updateUserLocation(socket.id, location);
    });

    socket.on('ambulanceLocationUpdate', async (data: { id: string; location: Location }) => {
      try {
        const { id, location } = data;
        
        // Update ambulance location in DB
        await ambulanceService.updateLocation(id, location);

        // 1. Check proximity to users
        const activeUsers = userService.getActiveUsers();
        activeUsers.forEach(user => {
          const distance = calculateDistance(location, user.currentLocation);
          if (distance <= USER_ALERT_THRESHOLD) {
            io.to(user.socketId).emit('ambulanceNearby', {
              ambulanceId: id,
              distance,
              location
            });
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
    });
  });
};
