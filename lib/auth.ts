// lib/auth.ts
// Helper functions for dealing with authentication using Supabase.
// We keep this logic in a separate file so it can be reused across pages.

import { supabase } from "./supabase";

// Get the current authenticated user (client-side).
// This function returns a Promise that resolves to the user or null.
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Sign out the currently logged-in user.
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error.message);
    throw error;
  }
}


