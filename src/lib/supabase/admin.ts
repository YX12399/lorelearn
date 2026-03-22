import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Only import from src/app/api/** routes.
// NEVER import this in client components or expose the service role key to the browser.
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
