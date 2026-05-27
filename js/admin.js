// ============================================================
// TEKFIX OUTLET INTELLIGENCE PLATFORM — Admin Helpers
// ============================================================

import { supabase } from './supabase-client.js';

// ── Chart Defaults ──────────────────────────────────────────

export function applyChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color       = '#A0AEC0';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';
  Chart.defaults.font.family = 'Inter, sans-serif';
}

export const CHART_COLORS = {
  gold:   '#C9A84C',
  blue:   '#2B6CB0',
  green:  '#38A169',
  red:    '#E53E3E',
  purple: '#9F7AEA',
  orange: '#ED8936',
  teal:   '#38B2AC',
  pink:   '#F687B3',
};

export const PALETTE = Object.values(CHART_COLORS);

// ── Score Utilities ─────────────────────────────────────────

export function calcQualityScore(csatScore, teamScore, cleanlinessScore) {
  if (!csatScore || !teamScore || !cleanlinessScore) return null;
  return Math.round((csatScore * 0.4 + teamScore * 0.3 + cleanlinessScore * 0.3) * 20);
}

export function scoreColor(score) {
  if (score === null || score === undefined) return '#718096';
  if (score >= 80) return '#68D391';
  if (score >= 60) return '#C9A84C';
  return '#FC8181';
}

export function scoreBgColor(score) {
  if (score === null || score === undefined) return 'rgba(160,174,192,0.3)';
  if (score >= 80) return 'rgba(56,161,105,0.75)';
  if (score >= 60) return 'rgba(201,168,76,0.75)';
  return 'rgba(229,62,62,0.75)';
}

export function avg(arr) {
  const clean = arr.filter(Boolean);
  return clean.length
    ? (clean.reduce((a, b) => a + b, 0) / clean.length).toFixed(1)
    : null;
}

// ── Platform-wide Stats ─────────────────────────────────────

export async function getPlatformStats() {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const [
    { data: reports,  error: e1 },
    { data: outlets,  error: e2 },
    { data: agents,   error: e3 },
    { data: profiles, error: e4 },
  ] = await Promise.all([
    supabase.from('shift_reports')
      .select('id, reporting_date, balance_status, csat_score, team_relationship_score, cleanliness_score, unprofessional_behavior')
      .eq('is_deleted', false),
    supabase.from('outlets').select('id').eq('is_active', true),
    supabase.from('agents').select('id').eq('is_active', true),
    supabase.from('profiles').select('id').eq('is_active', true),
  ]);

  if (e1) throw e1;

  const monthReports = (reports || []).filter(r => r.reporting_date >= monthStart);
  const incidents    = monthReports.filter(r => r.unprofessional_behavior).length;
  const balanced     = (reports || []).filter(r => r.balance_status === 'Balanced').length;
  const balanceRate  = reports?.length ? Math.round((balanced / reports.length) * 100) : 0;

  const scores = (reports || [])
    .map(r => calcQualityScore(r.csat_score, r.team_relationship_score, r.cleanliness_score))
    .filter(Boolean);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  return {
    totalReports:   reports?.length   ?? 0,
    monthReports:   monthReports.length,
    incidents,
    balanceRate,
    avgScore,
    activeOutlets:  outlets?.length   ?? 0,
    activeAgents:   agents?.length    ?? 0,
    activeSupervisors: profiles?.length ?? 0,
  };
}

// ── CSV Export ──────────────────────────────────────────────

export function exportToCSV(headers, rows, filename) {
  const csv  = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sidebar / Hamburger ─────────────────────────────────────

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

// ── Pagination Helper ───────────────────────────────────────

export function renderPagination(currentPage, totalItems, pageSize) {
  const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    maxPage,
    hasPrev: currentPage > 1,
    hasNext: currentPage < maxPage,
    label:   `Page ${currentPage} of ${maxPage}`,
    start:   (currentPage - 1) * pageSize,
    end:     currentPage * pageSize,
  };
}

// ── Escape for inline onclick attributes ───────────────────

export function escStr(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── Date Helpers ────────────────────────────────────────────

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

export function daysAgoISO(days) {
  return new Date(Date.now() - days * 864e5).toISOString().split('T')[0];
}