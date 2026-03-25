import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
let app;
try {
  if (!getApps().length) {
    if (firebaseConfig.projectId) {
      app = initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log(`Firebase Admin SDK initialized for project: ${firebaseConfig.projectId}`);
    } else {
      console.warn('Firebase Project ID is missing. Firebase features will not be available.');
    }
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

export const db = firebaseConfig.projectId ? getFirestore(firebaseConfig.firestoreDatabaseId || '(default)') : null as any;

if (firebaseConfig.projectId) {
  if (firebaseConfig.firestoreDatabaseId) {
    console.log(`Using Firestore database: ${firebaseConfig.firestoreDatabaseId}`);
  } else {
    console.warn('Firestore Database ID is missing, using (default)');
  }
}
