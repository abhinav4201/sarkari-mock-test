// src/lib/firebase-admin.js

import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

// Check for the required environment variables and throw a clear error if missing.
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.FIREBASE_CLIENT_EMAIL
) {
  throw new Error(
    "Missing Firebase Admin SDK credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in your environment variables."
  );
}


const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  // The replace function is crucial for Vercel/other deployment platforms.
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin SDK only once.
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
