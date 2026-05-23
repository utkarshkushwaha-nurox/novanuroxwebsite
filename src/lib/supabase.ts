import { createClient } from "@supabase/supabase-js";

// Fallback values ensure the deployed site (e.g. on Render) works even if
// VITE_SUPABASE_* env vars aren't injected at build time. The anon key is a
// publishable key — safe to ship in client bundles.
const FALLBACK_URL = "https://cyeskvdockcojtremqqa.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXNrdmRvY2tjb2p0cmVtcXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTAwNTIsImV4cCI6MjA5MjUyNjA1Mn0.6RsXk0-OPnt_YF3skVv_hMi6nkmH4rfFdJccdDR5Ojo";

const url = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_ANON_KEY;

export const supabaseConfigured =
  !!url && !!anonKey && !url.includes("YOUR_PROJECT") && !anonKey.includes("YOUR_ANON_KEY");

export const supabase = createClient(
  supabaseConfigured ? url : "https://placeholder.supabase.co",
  supabaseConfigured ? anonKey : "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "nova-nurox-auth",
    },
  },
);

export type Signup = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string | null;
  paid: boolean;
  created_at: string;
};

export type SchoolPartnership = {
  id: string;
  school_name: string;
  principal_name: string;
  contact_person: string;
  whatsapp: string;
  preferred_start_date: string;
  agreed_payment_model: boolean;
  student_capacity: number;
  total_pay_amount: number;
  payment_paid: boolean;
  approved: boolean;
  created_at: string;
};

export type StudentEnrollment = {
  id: string;
  full_name: string;
  class_section: string;
  school_name: string;
  parent_whatsapp: string;
  paid: boolean;
  batch_number: number | null;
  created_at: string;
};
