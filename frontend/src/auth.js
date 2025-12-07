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
    if (typeof window !== 'undefined') window.__authTemp = { token, user };
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
export function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }
