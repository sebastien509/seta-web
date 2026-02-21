import config from "../config/config";

export function getToken() {
  return localStorage.getItem("seta_access_token") || "";
}

export async function apiFetch(path, options = {}) {
  const url = `${config.API.BASE_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), config.API.TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : {};

    if (!res.ok || json?.success === false) {
      const msg = json?.error || json?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return json;
  } finally {
    clearTimeout(t);
  }
}
