// src/config/config.js
export default {
    API: {
      BASE_URL: import.meta.env.VITE_API_URL || "https://api.seta.app/v1",
      TIMEOUT: 30000,
    },
    NETWORK: {
      CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID || 8453),
      NAME: "Base Mainnet",
    },
    TOKEN: {
      SYMBOL: "SETA",
      DECIMALS: 18,
      ADDRESS: import.meta.env.VITE_SETA_TOKEN || "0xSETA_TOKEN_ADDRESS_HERE",
    },
  };
  