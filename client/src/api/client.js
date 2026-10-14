const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'mybox_token';
export const USER_KEY = 'mybox_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

// Wipes the entire client-side session (token + cached profile). Used on
// sign-out, and also run on every fresh load of index.html and whenever the
// tab/window is closing, so a session never survives a reload or a closed tab.
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
      ...(!options.authToken && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let body;
  try {
    body = await res.json();
  } catch (e) {
    body = {};
  }

  if (!res.ok) {
    throw body.error || { code: 'INTERNAL_ERROR', message: 'Something went wrong.' };
  }
  return body.data;
}

export const api = {
  sendOtp: (mobile) => request('/auth/otp/send', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOtp: (mobile, otp) => request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ mobile, otp }) }),
  createProfile: (payload, verificationToken) =>
    request('/profile', { method: 'POST', body: JSON.stringify(payload), authToken: verificationToken }),
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getFamilyMembers: () => request('/family-members'),
  saveFamilyMembers: (familyMembers) =>
    request('/family-members', { method: 'PUT', body: JSON.stringify({ familyMembers }) }),
  getPolicies: () => request('/policies'),
  savePolicies: (policies) => request('/policies', { method: 'PUT', body: JSON.stringify({ policies }) }),
  getVehicles: () => request('/vehicles'),
  saveVehicles: (vehicles) => request('/vehicles', { method: 'PUT', body: JSON.stringify({ vehicles }) }),
  getDashboardSummary: () => request('/dashboard/summary'),
};
