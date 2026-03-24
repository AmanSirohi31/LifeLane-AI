import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Read config manually
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.error('Error reading firebase-applet-config.json:', error);
}

// Initialize Firebase Admin SDK
// In this environment, we can often initialize with just the project ID
// or it might already be initialized by the platform.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const db = admin.firestore(firebaseConfig.firestoreDatabaseId);

console.log(`Firebase Admin SDK initialized for project: ${firebaseConfig.projectId} and database: ${firebaseConfig.firestoreDatabaseId}`);
