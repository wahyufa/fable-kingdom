/*
 * Fable Kingdom — runtime config.
 * Fill in your Supabase project credentials to enable the online leaderboard.
 * Leave both empty and the game runs fully offline (leaderboard UI hidden).
 *
 * Setup guide: docs/leaderboard-setup.md
 * The anon key is safe to expose in client code — table access is limited
 * by Row Level Security policies (insert + read only).
 */
window.FK_CONFIG = {
  supabaseUrl: 'https://pzhupderkpmbufvcznqf.supabase.co',      // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aHVwZGVya3BtYnVmdmN6bnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODM1NTMsImV4cCI6MjA5Njg1OTU1M30.PNS-786j6gus_ukAOKSzisZ6YHZ1tVTDP3ZsC5Amb64',  // 'eyJ...' anon/public key from Project Settings > API
};
