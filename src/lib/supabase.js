import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xrvxwujwwemzjuifwqyk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhydnh3dWp3d2Vtemp1aWZ3cXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTk3ODIsImV4cCI6MjA2OTM3NTc4Mn0.3wPszKU79radjOA9egw_KYx5LyXtGRlDYaaaVMe4nNg'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>'){
  throw new Error('Missing Supabase variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export default supabase