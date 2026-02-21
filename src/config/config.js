// src/config/config.js (Vite-safe)
const config = {
    APP: {
      NAME: "SETA Wallet",
    },
    API: {
      BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://api.seta.app/v1",
      TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
    },
    NETWORK: {
      CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID || 8453), // Base mainnet default
    },
    TOKEN: {
      ADDRESS: (import.meta.env.VITE_SETA_TOKEN_ADDRESS || "").trim(), // set this
      DECIMALS: Number(import.meta.env.VITE_SETA_DECIMALS || 18),
      SYMBOL: "SETA",
      EIP712: { name: "SETA", version: "1" },
    },
  };
  
  export default config;
  