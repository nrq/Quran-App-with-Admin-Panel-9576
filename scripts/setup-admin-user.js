import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupAdminUser() {
  try {
    console.log('Checking if admin user already exists...');
    
    // Check if admin user already exists
    const adminUsersRef = collection(db, 'admin_users');
    const q = query(adminUsersRef, where('username', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('✓ Admin user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
      return;
    }
    
    console.log('Creating admin user...');
    
    // Create admin user
    const docRef = await addDoc(collection(db, 'admin_users'), {
      username: 'admin',
      password_hash: 'admin123', // In production, this should be properly hashed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✓ Admin user created successfully!');
    console.log('Document ID:', docRef.id);
    console.log('\nLogin Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nYou can now log in at /admin-login');
    
  } catch (error) {
    console.error('Error setting up admin user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

setupAdminUser();
