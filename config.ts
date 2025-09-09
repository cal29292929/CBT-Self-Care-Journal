// IMPORTANT: These values are now configured via environment variables.
// On Vercel, set these in your project's "Environment Variables" settings.
// For example, create a variable named FIREBASE_API_KEY with your key.
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// This is a default ID for structuring data in Firestore.
// You can change this to a unique identifier for your app instance.
export const appId = 'default-app-id';
