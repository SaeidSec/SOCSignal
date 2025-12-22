const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": "needed_for_auth",
    "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": "needed_for_auth",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
};

let storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket && process.env.FIREBASE_PROJECT_ID) {
    storageBucket = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    console.log(`No FIREBASE_STORAGE_BUCKET defined, defaulting to: ${storageBucket}`);
}

// Check if credentials are provided
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('Error: Firebase credentials missing in .env file.');
    // We don't exit here to allow the app to start
} else {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        // Check if index 0 (default app) already exists
        if (!admin.apps.length) {
            console.error('Firebase initialization error:', error);
        }
    }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket, admin };
