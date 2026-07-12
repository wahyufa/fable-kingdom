/*
 * Fable Kingdom — runtime config.
 * Fill in your Supabase project credentials to enable the online leaderboard.
 * Leave both empty and the game runs fully offline (leaderboard UI hidden).
 *
 * Setup guide: ../../docs/leaderboard-setup.md
 * The anon key is safe to expose in client code — table access is limited
 * by Row Level Security policies (insert + read only).
 */
window.FK_CONFIG = {
  supabaseUrl: 'https://pzhupderkpmbufvcznqf.supabase.co',      // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aHVwZGVya3BtYnVmdmN6bnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODM1NTMsImV4cCI6MjA5Njg1OTU1M30.PNS-786j6gus_ukAOKSzisZ6YHZ1tVTDP3ZsC5Amb64',  // 'eyJ...' anon/public key from Project Settings > API
  // Robinhood Chain mainnet (Arbitrum Orbit L2, live 2026-07-01). Used at
  // sign-in to offer adding/switching the network in the player's wallet —
  // shaped exactly like a wallet_addEthereumChain params object.
  chain: {
    chainId: '0x1237',   // 4663
    chainName: 'Robinhood Chain',
    rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://robinhoodchain.blockscout.com'],
  },
  // $FADOM utility (Knight's Crest). Leave address empty and every crest
  // feature stays hidden — fill it once the token is live on Robinhood Chain.
  // The client only uses this to decide what UI to show; the actual balance
  // check runs server-side in the verify-holdings Edge Function (its own
  // FADOM_TOKEN_ADDRESS / FADOM_CREST_THRESHOLD secrets are the source of
  // truth). See docs/token-utility-setup.md.
  token: {
    address: '',   // $FADOM ERC-20 contract on Robinhood Chain
  },
};
