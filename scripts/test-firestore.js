import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
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
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirestore() {
  console.log('🔥 Starting Firestore Test...\n');
  
  try {
    // Step 1: Authenticate
    console.log('📝 Step 1: Authenticating...');
    await signInWithEmailAndPassword(auth, 'admin@nrq.no', 'admin123');
    console.log('✅ Authentication successful!\n');
    
    // Step 2: Write to Firestore
    console.log('📝 Step 2: Writing test data to Firestore...');
    const testData = {
      url: 'https://test-audio-url.com/test.mp3',
      title: 'Test Audio URL',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'custom_urls'), testData);
    console.log('✅ Document written with ID:', docRef.id);
    console.log('   Data:', testData, '\n');
    
    // Step 3: Read from Firestore
    console.log('📝 Step 3: Reading data from Firestore...');
    const q = query(collection(db, 'custom_urls'), where('title', '==', 'Test Audio URL'));
    const querySnapshot = await getDocs(q);
    
    console.log('✅ Found', querySnapshot.size, 'document(s)');
    querySnapshot.forEach((doc) => {
      console.log('   Document ID:', doc.id);
      console.log('   Data:', doc.data());
    });
    console.log('');
    
    // Step 4: Delete from Firestore
    console.log('📝 Step 4: Deleting test data from Firestore...');
    await deleteDoc(doc(db, 'custom_urls', docRef.id));
    console.log('✅ Document deleted successfully!\n');
    
    // Step 5: Verify deletion
    console.log('📝 Step 5: Verifying deletion...');
    const verifySnapshot = await getDocs(q);
    console.log('✅ Documents remaining:', verifySnapshot.size);
    
    if (verifySnapshot.size === 0) {
      console.log('✅ Test data cleaned up successfully!\n');
    }
    
    console.log('🎉 All Firestore operations completed successfully!');
    console.log('\n✅ WRITE - Working');
    console.log('✅ READ - Working');
    console.log('✅ DELETE - Working');
    
  } catch (error) {
    console.error('❌ Error during Firestore test:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    process.exit(1);
  }
}

testFirestore();
