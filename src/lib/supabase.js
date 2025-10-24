// TEMPORARY STUB FILE - TO BE REMOVED DURING FIREBASE MIGRATION
// This file exists only to prevent build errors during the migration process
// All Supabase functionality will be replaced with Firebase in subsequent tasks

console.warn('Supabase client is deprecated and will be replaced with Firebase');

// Temporary stub to prevent import errors
const supabase = {
  auth: {
    signInWithPassword: () => Promise.reject(new Error('Supabase deprecated - use Firebase')),
    signOut: () => Promise.reject(new Error('Supabase deprecated - use Firebase')),
    getSession: () => Promise.reject(new Error('Supabase deprecated - use Firebase')),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => Promise.reject(new Error('Supabase deprecated - use Firebase')),
    insert: () => Promise.reject(new Error('Supabase deprecated - use Firebase')),
    upsert: () => Promise.reject(new Error('Supabase deprecated - use Firebase')),
    delete: () => Promise.reject(new Error('Supabase deprecated - use Firebase'))
  })
};

export default supabase;