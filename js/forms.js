/* =============================================
   BTS Client Forms – Shared JavaScript
   ============================================= */

// ---- Multi-step form navigation (BTS-40) ----
let currentStep = 1;
const TOTAL_STEPS = 4;

function goToStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
  const target = document.getElementById('step-' + n);
  if (target) target.style.display = 'block';
  currentStep = n;
  updateStepIndicator();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicator() {
  document.querySelectorAll('.step-indicator .step').forEach((el, i) => {
    const stepNum = i + 1;
    el.classList.remove('active', 'done');
    if (stepNum === currentStep) el.classList.add('active');
    if (stepNum < currentStep)  el.classList.add('done');
  });
  document.querySelectorAll('.step-indicator .connector').forEach((el, i) => {
    el.classList.toggle('done', i + 1 < currentStep);
  });
}

function nextStep() { if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1); }
function prevStep() { if (currentStep > 1) goToStep(currentStep - 1); }

// ---- Collect all form values into a plain object ----
function collectForm(formEl) {
  const data = {};
  const elements = formEl.querySelectorAll('input, select, textarea');
  elements.forEach(el => {
    if (!el.name) return;
    if (el.type === 'checkbox') {
      if (!data[el.name]) data[el.name] = [];
      if (el.checked) data[el.name].push(el.value || el.id);
    } else if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
    } else {
      data[el.name] = el.value;
    }
  });
  return data;
}

// ---- Format form data as readable email body ----
function formatEmailBody(data, formTitle) {
  const lines = [`${formTitle}`, '='.repeat(formTitle.length), ''];
  Object.entries(data).forEach(([k, v]) => {
    if (!v || (Array.isArray(v) && v.length === 0)) return;
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const value = Array.isArray(v) ? v.join(', ') : v;
    lines.push(`${label}: ${value}`);
  });
  lines.push('', '---', 'Submitted via BTS Client Forms');
  return lines.join('\n');
}

// ---- Detect whether the backend server is running ----
const API_BASE = window.location.port === '5000' || window.location.hostname !== '' && window.location.protocol !== 'file:'
  ? ''          // same origin (served by Flask)
  : null;       // opened as file:// – no API available

function apiAvailable() {
  return window.location.protocol !== 'file:';
}

// ---- Save to database then optionally email ----
async function saveToDb(formId, formName, data) {
  if (!apiAvailable()) return null;
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: formId, form_name: formName, data })
    });
    const json = await res.json();
    return json.ok ? json.id : null;
  } catch (e) {
    console.warn('Could not reach server – submission not saved to database.', e);
    return null;
  }
}

// ---- Show a brief status toast ----
function showToast(msg, type = 'success') {
  let toast = document.getElementById('bts-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bts-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      padding:12px 20px; border-radius:6px; font-size:14px; font-weight:600;
      box-shadow:0 4px 16px rgba(0,0,0,.18); transition:opacity .4s;
      max-width:320px; line-height:1.4;
    `;
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'success' ? '#2e7d32' : '#c62828';
  toast.style.color = '#fff';
  toast.style.opacity = '1';
  toast.textContent = msg;
  setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

// ---- Submit to DB then send via email ----
async function sendEmail(formId, formTitle, toEmail) {
  const form = document.getElementById(formId);
  const data = collectForm(form);

  // 1. Save to database
  const savedId = await saveToDb(formId, formTitle, data);
  if (savedId) {
    showToast(`✓ Saved to database (ID #${savedId})`);
  } else if (apiAvailable()) {
    showToast('⚠ Could not save to database — emailing only.', 'error');
  }

  // 2. Open mailto as fallback / additional copy
  const body    = formatEmailBody(data, formTitle);
  const subject = encodeURIComponent(formTitle + ' - Client Submission');
  const bodyEnc = encodeURIComponent(body);
  window.location.href = `mailto:${toEmail}?subject=${subject}&body=${bodyEnc}`;
}

// ---- Save to DB only (no email) ----
async function saveOnly(formId, formTitle) {
  const form = document.getElementById(formId);
  const data = collectForm(form);
  const savedId = await saveToDb(formId, formTitle, data);
  if (savedId) {
    showToast(`✓ Form saved (ID #${savedId})`);
  } else {
    showToast('⚠ Server not reachable. Is server.py running?', 'error');
  }
}

// ---- Print ----
function printForm() {
  window.print();
}

// ---- Init on page load ----
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('step-1')) {
    goToStep(1);
  }
});
