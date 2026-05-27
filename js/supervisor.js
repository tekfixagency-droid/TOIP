// ============================================================
// TEKFIX OUTLET INTELLIGENCE PLATFORM — Supervisor Helpers
// ============================================================

import { supabase } from './supabase-client.js';

// ── Score Calculation ───────────────────────────────────────

export function calcQualityScore(csatScore, teamScore, cleanlinessScore) {
  if (!csatScore || !teamScore || !cleanlinessScore) return null;
  return Math.round((csatScore * 0.4 + teamScore * 0.3 + cleanlinessScore * 0.3) * 20);
}

export function scoreBadgeColor(score) {
  if (score === null || score === undefined) return '#718096';
  if (score >= 80) return '#68D391';
  if (score >= 60) return '#C9A84C';
  return '#FC8181';
}

export function starDisplay(score) {
  if (!score) return '—';
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

// ── Report Edit Window Check ────────────────────────────────

export function canEditReport(createdAt) {
  const diffHours = (Date.now() - new Date(createdAt).getTime()) / 1000 / 3600;
  return diffHours <= 24;
}

export function timeUntilLocked(createdAt) {
  const diffHours = (Date.now() - new Date(createdAt).getTime()) / 1000 / 3600;
  const remaining = 24 - diffHours;
  if (remaining <= 0) return 'Locked';
  if (remaining < 1) return `${Math.round(remaining * 60)}m remaining`;
  return `${Math.round(remaining)}h remaining`;
}

// ── Supervisor Stats ────────────────────────────────────────

export async function getSupervisorStats(profileId) {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const weekStart  = new Date(now - 6 * 864e5).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('shift_reports')
    .select('id, reporting_date, balance_status, csat_score, team_relationship_score, cleanliness_score, unprofessional_behavior, created_at')
    .eq('submitted_by', profileId)
    .eq('is_deleted', false)
    .order('reporting_date', { ascending: false });

  if (error) throw error;

  const total      = data.length;
  const thisMonth  = data.filter(r => r.reporting_date >= monthStart).length;
  const thisWeek   = data.filter(r => r.reporting_date >= weekStart).length;
  const incidents  = data.filter(r => r.unprofessional_behavior).length;
  const balanced   = data.filter(r => r.balance_status === 'Balanced').length;
  const balanceRate = total ? Math.round((balanced / total) * 100) : 0;

  const scores = data
    .map(r => calcQualityScore(r.csat_score, r.team_relationship_score, r.cleanliness_score))
    .filter(Boolean);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  return { total, thisMonth, thisWeek, incidents, balanceRate, avgScore, reports: data };
}

// ── Duplicate Check ─────────────────────────────────────────

export async function checkDuplicateReport(profileId, agentId, reportingDate, shiftId) {
  const { data, error } = await supabase
    .from('shift_reports')
    .select('id')
    .eq('submitted_by', profileId)
    .eq('agent_id', agentId)
    .eq('reporting_date', reportingDate)
    .eq('shift_definition_id', shiftId)
    .eq('is_deleted', false)
    .limit(1);

  if (error) throw error;
  return data.length > 0;
}

// ── Hamburger / Sidebar Toggle ──────────────────────────────

export function initSidebar() {
  const hamburger   = document.getElementById('hamburger');
  const sidebar     = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');

  if (hamburger) {
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  if (mainContent) {
    mainContent.addEventListener('click', () => sidebar.classList.remove('open'));
  }
}

// ── Form Helpers ────────────────────────────────────────────

export function setStarRating(name, value) {
  if (!value) return;
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

export function getStarRating(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? parseInt(checked.value) : null;
}

export function setRadioValue(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

export function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
}

// ── Date Helpers ────────────────────────────────────────────

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function monthStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}