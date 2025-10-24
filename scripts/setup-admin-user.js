import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiTKUwBWUsYL8sWEm5JEBZGolk2KN1Uuk",
  authDomain: "quranreadertanzil.firebaseapp.com",
  projectId: "quranreadertanzil",
  storageBucket: "quranreadertanzil.firebasestorage.app",
  messagingSenderId: "115345566711",
  appId: "1:115345566711:web:dfc6f51d5a317c94229cf2",
  measurementId: "G-HPQ4YCK20J"
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
