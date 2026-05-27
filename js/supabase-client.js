// ============================================================
// TEKFIX OUTLET INTELLIGENCE PLATFORM — Supabase Client v2.0
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://lrjrcynbrkqudngvzodn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyanJjeW5icmtxdWRuZ3Z6b2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTk1NTIsImV4cCI6MjA5NTQ3NTU1Mn0.EOxRuaEWDbDAfG9IjYvu2URGcZlLC-itTodkjichEc4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Reference data loaders ──────────────────────────────────

export async function getOutlets(activeOnly = true) {
  let q = supabase.from('outlets').select('id, name, location, is_active').order('name');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getAgents(activeOnly = true, outletId = null) {
  let q = supabase.from('agents')
    .select('id, full_name, outlet_id, is_active, outlets(name)')
    .order('full_name');
  if (activeOnly) q = q.eq('is_active', true);
  if (outletId)   q = q.eq('outlet_id', outletId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getShiftDefinitions(activeOnly = true) {
  let q = supabase.from('shift_definitions')
    .select('id, name, start_time, end_time')
    .order('start_time');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getKpiDefinitions(activeOnly = true) {
  let q = supabase.from('kpi_definitions')
    .select('id, name, description, category, input_type, min_value, max_value, weight_pct, is_required, display_order')
    .order('display_order');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

// ── Audit logger ────────────────────────────────────────────

export async function logAction(action, targetTable = null, targetId = null, oldValues = null, newValues = null) {
  try {
    const profile = await getMyProfile();
    if (!profile) return;
    await supabase.from('audit_log').insert({
      actor_id:     profile.id,
      action,
      target_table: targetTable,
      target_id:    targetId,
      old_values:   oldValues,
      new_values:   newValues
    });
  } catch (e) {
    console.warn('Audit log failed:', e);
  }
}

// ── UI Helpers ──────────────────────────────────────────────

export function showToast(message, type = 'info') {
  const t = document.createElement('div');
  t.className = `alert alert-${type}`;
  t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;min-width:280px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

export function populateSelect(el, items, valueProp, labelProp, placeholder = 'Select...') {
  el.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(item => {
    const o = document.createElement('option');
    o.value = item[valueProp];
    o.textContent = item[labelProp];
    el.appendChild(o);
  });
}

export function showLoading(tbodyId, colSpan = 6) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML =
    `<tr><td colspan="${colSpan}" style="text-align:center;padding:2rem"><div class="spinner"></div></td></tr>`;
}

export function showEmpty(tbodyId, colSpan = 6, msg = 'No records found') {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML =
    `<tr><td colspan="${colSpan}"><div class="empty-state"><p>${msg}</p></div></td></tr>`;
}

export const scoreToPct = (score) => score ? `${Math.round(score * 20)}%` : 'N/A';