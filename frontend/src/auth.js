// Simple client-side auth helper: token and user storage
export function getToken() {
  if (typeof window !== 'undefined' && window.__authTemp && window.__authTemp.token) return window.__authTemp.token;
  return sessionStorage.getItem('token') || localStorage.getItem('token') || null;
}

export function isRemembered() {
  return !!localStorage.getItem('token');
}

export function getUser() {
  if (typeof window !== 'undefined' && window.__authTemp && window.__authTemp.user) return window.__authTemp.user;
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

export function setAuth(token, user, remember = false) {
  if (remember) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    // keep in-memory only so a page refresh clears the session (per request)
    if (typeof window !== 'undefined') window.__authTemp = { token, user };
    // ensure session/local storage cleared for safety
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export function clearAuth() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined' && window.__authTemp) delete window.__authTemp;
}

export function isLoggedIn() { return !!getToken(); }
export function isAdmin() { const u = getUser(); return u && (u.role === 'admin' || u.role === 'super_admin'); }
export function isSuperAdmin() { const u = getUser(); return u && u.role === 'super_admin'; }
