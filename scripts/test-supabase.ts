import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing!');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('lottery_results')
      .select('id')
      .limit(1);
    if (error) {
      console.error('Error fetching data:', error.message);
      process.exit(1);
    }
    console.log('Connection successful:', data);
    process.exit(0);
  } catch (err) {
    console.error('Error during connection test:', err.message);
    process.exit(1);
  }
}

testConnection();
