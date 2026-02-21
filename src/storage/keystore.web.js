// src/storage/keystore.web.js
// Encrypted private key in IndexedDB using WebCrypto AES-GCM + PBKDF2(PIN)

const DB_NAME = "seta_wallet_db";
const DB_STORE = "wallet";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function dbDel(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

function b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function unb64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function unhex(h) {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function deriveKEK(pin, saltB64) {
  const enc = new TextEncoder();
  const salt = new Uint8Array(unb64(saltB64));
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveKey",
  ]);

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 310000 },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function aesEncrypt(kek, plaintextBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, plaintextBytes);
  return { ivB64: b64(iv), ctB64: b64(ct) };
}

async function aesDecrypt(kek, ivB64, ctB64) {
  const iv = new Uint8Array(unb64(ivB64));
  const ct = unb64(ctB64);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, kek, ct);
  return new Uint8Array(pt);
}

export async function walletExists() {
  const blob = await dbGet("wallet_blob");
  return !!blob;
}

export async function createWalletWithPin(privateKeyHex, pin) {
  if (!pin || pin.length < 4) throw new Error("PIN must be at least 4 digits");

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = b64(salt);

  const kek = await deriveKEK(pin, saltB64);

  const pkBytes = unhex(privateKeyHex.replace(/^0x/, ""));
  const { ivB64, ctB64 } = await aesEncrypt(kek, pkBytes);

  await dbSet("wallet_blob", {
    v: 1,
    saltB64,
    ivB64,
    ctB64,
    createdAt: new Date().toISOString(),
  });

  return true;
}

export async function loadWalletPrivateKeyWithPin(pin) {
  const blob = await dbGet("wallet_blob");
  if (!blob) return null;

  const kek = await deriveKEK(pin, blob.saltB64);
  const pkBytes = await aesDecrypt(kek, blob.ivB64, blob.ctB64);
  return "0x" + hex(pkBytes);
}

export async function deleteWallet() {
  await dbDel("wallet_blob");
  return true;
}
