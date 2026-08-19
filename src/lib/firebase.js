/**
 * FIREBASE SETUP
 * --------------
 * Login on this website is handled by Firebase, a free Google service.
 *
 * The keys are NOT written in this file. They live in a file called `.env`
 * that stays on your computer (and in your Vercel settings when the site is live).
 * Copy `.env.example` to `.env` and fill in the values from your Firebase project.
 *
 * Full step-by-step instructions are in README.md, section "Setting up login".
 *
 * If the keys are missing, the website still works normally — only the login
 * page will say that login has not been set up yet.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** true once the keys are filled in */
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { app, auth };
