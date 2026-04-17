export const AUTH_COOKIE = "eshikhsha_auth";
export const ROLE_COOKIE = "eshikhsha_role";
export const TOKEN_COOKIE = "eshikhsha_token";
export const TOKEN_STORAGE = "eshikhsha-token";
export const ROLE_STORAGE = "eshikhsha-role";

export type AppRole = "user" | "admin";

export function parseCookies(cookieString: string) {
  return cookieString
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [key, ...rest] = part.split("=");
      acc[key] = rest.join("=");
      return acc;
    }, {});
}

export function getClientAuthState() {
  if (typeof document === "undefined") {
    return { isAuthenticated: false, role: "user" as AppRole, token: null as string | null };
  }

  const cookies = parseCookies(document.cookie ?? "");
  const tokenFromStorage = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE) : null;
  const token = tokenFromStorage || cookies[TOKEN_COOKIE] || null;
  const isAuthenticated = Boolean(token);
  const role = (cookies[ROLE_COOKIE] as AppRole) || "user";

  return { isAuthenticated, role, token };
}

export function setClientAuth(token: string, role: AppRole) {
  if (typeof document === "undefined") return;

  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

  try {
    localStorage.setItem(TOKEN_STORAGE, token);
    localStorage.setItem(ROLE_STORAGE, role);
  } catch {}

  window.dispatchEvent(new Event("auth-changed"));
}

export function getClientToken() {
  if (typeof document === "undefined") return null;

  const cookies = parseCookies(document.cookie ?? "");
  const tokenFromCookie = cookies[TOKEN_COOKIE];

  try {
    return localStorage.getItem(TOKEN_STORAGE) || tokenFromCookie || null;
  } catch {
    return tokenFromCookie || null;
  }
}

export function clearClientAuth() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

  try {
    localStorage.removeItem(TOKEN_STORAGE);
    localStorage.removeItem(ROLE_STORAGE);
  } catch {}

  window.dispatchEvent(new Event("auth-changed"));
}
