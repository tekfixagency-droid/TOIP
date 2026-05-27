// ============================================================
// TEKFIX OUTLET INTELLIGENCE PLATFORM — Auth Module v2.0
// ============================================================

import { supabase, getMyProfile } from './supabase-client.js';

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

export async function requireAuth(allowedRoles) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }

  let profile;
  try {
    profile = await getMyProfile();
  } catch (e) {
    window.location.href = '/index.html';
    return null;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    window.location.href = profile?.role === 'admin'
      ? '/admin/dashboard.html'
      : '/supervisor/dashboard.html';
    return null;
  }

  // Populate topbar if elements exist
  const nameEl    = document.getElementById('user-name');
  const initEl    = document.getElementById('user-initials');
  if (nameEl) nameEl.textContent = profile.full_name;
  if (initEl) initEl.textContent = profile.full_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return profile;
}

export async function touchLastLogin(userId) {
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}