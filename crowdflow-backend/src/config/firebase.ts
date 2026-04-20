import * as admin from 'firebase-admin';
import { config, hasFirebase } from './environment';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (hasFirebase) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });

    db = admin.firestore();
    auth = admin.auth();
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.warn('⚠️  Firebase Admin init failed, running in mock mode:', error);
  }
} else {
  console.log('ℹ️  Firebase credentials not provided, running in mock mode');
}

export const firebaseDb = db;
export const firebaseAuth = auth;
export default admin;
