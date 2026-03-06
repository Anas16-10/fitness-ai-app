import { createBrowserClient } from "@supabase/ssr";

// Read env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Debug logs
console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY EXISTS:", !!supabaseAnonKey);

// Create client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);