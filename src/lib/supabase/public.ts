import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for public page reads (no auth).
 * Use this in video/category/homepage pages so they stay
 * eligible for ISR instead of being forced to SSR by cookies().
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
