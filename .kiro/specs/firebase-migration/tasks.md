# Implementation Plan

- [x] 1. Setup Firebase project and dependencies





  - Create new Firebase project with Authentication and Firestore enabled
  - Install Firebase SDK and remove Supabase dependencies from package.json
  - Configure Firebase project settings and enable required services
  - _Requirements: 1.1, 1.2, 4.1_
- [x] 2. Create Firebase configuration and initialization




- [ ] 2. Create Firebase configuration and initialization

  - [x] 2.1 Create Firebase configuration file with environment variables


    - Write `src/lib/firebase.js` with Firebase config using environment variables
    - Implement Firebase app initialization and export auth/firestore instances
    - Add environment variable validation and error handling
    - _Requirements: 1.1, 4.1, 4.3_

  - [x] 2.2 Create environment variable template and documentation


    - Create `.env.example` file with required Firebase environment variables
    - Document environment variable setup for local development
    - _Requirements: 4.1, 4.4_

- [x] 3. Migrate authentication system




  - [x] 3.1 Replace Supabase auth with Firebase Authentication in AuthContext


    - Update `src/contexts/AuthContext.jsx` to use Firebase Authentication
    - Implement Firebase `signInWithEmailAndPassword` for admin login
    - Replace Supabase session management with Firebase `onAuthStateChanged`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Implement admin user validation using Firestore


    - Create Firestore query to validate admin credentials against `admin_users` collection
    - Update login flow to check Firestore before Firebase Authentication
    - Maintain existing username/password authentication flow
    - _Requirements: 2.1, 3.1_

  - [x] 3.3 Write authentication tests


    - Create unit tests for Firebase authentication flow
    - Test error handling for various authentication scenarios
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Migrate database operations in QuranContext






  - [x] 4.1 Replace Supabase client with Firestore in QuranContext

    - Update `src/contexts/QuranContext.jsx` to use Firestore operations
    - Replace all `supabase.from()` calls with Firestore collection references
    - Implement Firestore queries for fetching custom URLs, audio mappings, and tafseer entries
    - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3_


  - [x] 4.2 Implement Firestore CRUD operations for custom URLs






    - Create functions for adding, updating, and deleting custom URLs in Firestore
    - Implement upsert logic using Firestore transactions or batch operations
    - Update URL management functions to work with Firestore document references
    - _Requirements: 3.1, 3.4_

-

  - [x] 4.3 Implement Firestore operations for audio mappings





    - Create functions for saving and retrieving audio mappings from Firestore
    - Implement relationship handling between audio mappings and custom URLs
    - Update audio mapping functions to use Firestore document IDs
    - _Requirements: 3.2, 3.4, 3.5_


  - [x] 4.4 Implement Firestore operations for tafseer entries






    - Create functions for saving and retrieving tafseer entries from Firestore
    - Implement upsert operations for tafseer data
    - Update tafseer management to work with Firestore collections
    - _Requirements: 3.3, 3.4_
-

- [x] 5. Update AdminPanel component for Firebase



  - [x] 5.1 Replace Supabase operations in AdminPanel


    - Update `src/pages/AdminPanel.jsx` to use Firestore operations
    - Replace bulk upsert operations with Firestore batch writes
    - Update error handling for Firestore-specific errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4_


  - [x] 5.2 Write AdminPanel integration tests





    - Create tests for admin panel functionality with Firebase
    - Test bulk operations and error scenarios
    - _Requirements: 3.1, 3.2, 3.3_
-

- [x] 6. Implement error handling and offline support



  - [x] 6.1 Add Firebase-specific error handling


    - Implement error handling for Firebase Authentication errors
    - Add Firestore error handling with user-friendly messages
    - Update toast notifications for Firebase error codes
    - _Requirements: 1.5, 2.1, 3.4_

  - [x] 6.2 Configure Firestore offline persistence







    - Enable Firestore offline persistence for better user experience
    - Ensure offline functionality works with existing offline indicator
    - Test offline data synchronization when connection is restored
    - _Requirements: 5.2, 5.3_
-

- [x] 7. Setup Firestore security rules and indexes






  - [x] 7.1 Create Firestore security rules

    - Write security rules for admin_users, custom_urls, audio_mappings, and tafseer_entries collections
    - Implement authentication-based access control
    - Test security rules with Firebase emulator
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3_


  - [x] 7.2 Configure Firestore indexes for optimal performance






    - Create composite indexes for complex queries
    - Optimize queries for surah_number and ayah_number lookups
    - _Requirements: 1.5, 3.4_
-

- [x] 8. Environment configuration and deployment preparation




  - [x] 8.1 Configure Vercel environment variables

    - Document required environment variables for Vercel deployment
    - Create deployment checklist with environment variable setup
    - Test environment variable configuration in Vercel
    - _Requirements: 4.1, 4.2, 4.4, 4.5_



  - [x] 8.2 Update build and deployment scripts





    - Ensure Firebase configuration works in production build
    - Test production build with Firebase environment variables
    - _Requirements: 4.4, 4.5_
- [x] 9. Testing and validation




- [ ] 9. Testing and validation


  - [x] 9.1 Comprehensive functionality testing

    - Test complete admin authentication flow with Firebase
    - Verify all CRUD operations work with Firestore
    - Test offline functionality and data synchronization
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


  - [x] 9.2 Performance and security validation






    - Test application performance with Firebase
    - Validate Firestore security rules
    - Test environment variable security in deployment
    - _Requirements: 1.5, 4.5_

- [ ] 10. Cleanup and documentation
  - [ ] 10.1 Remove Supabase dependencies and code
    - Remove Supabase package from dependencies
    - Delete `src/lib/supabase.js` file
    - Clean up any remaining Supabase references
    - _Requirements: 1.2_

  - [ ] 10.2 Update project documentation
    - Update README with Firebase setup instructions
    - Document environment variable configuration
    - Create migration guide for future reference
    - _Requirements: 4.4_