import { User, Location } from '../models/types';

// In-memory storage for active users
const activeUsers = new Map<string, User>();

export const userService = {
  updateUserLocation(socketId: string, location: Location): User {
    const user: User = {
      socketId,
      currentLocation: location,
      lastSeen: new Date().toISOString()
    };
    activeUsers.set(socketId, user);
    return user;
  },

  removeUser(socketId: string): void {
    activeUsers.delete(socketId);
  },

  getActiveUsers(): User[] {
    return Array.from(activeUsers.values());
  }
};
