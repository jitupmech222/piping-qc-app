import { renderDashboard } from './views/dashboard.js';
import { renderStage } from './views/stageView.js';
import { renderProgressDashboard } from './views/progressDashboard.js';
import { renderSpoolTracking } from './views/spoolTracking.js';
import { renderProgressReport } from './views/progressReport.js';
import { renderMasterRegister } from './views/masterRegister.js';
// ૧. MTO વ્યૂ ફાઇલને અહીં ઇમ્પોર્ટ કરો
import { renderMtoRegister } from './views/mtoRegister.js';

export function navigateTo(path) {
  window.location.hash = path;
}

export function handleRoute() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const container = document.getElementById('appView');
  const btnTopDashboard = document.getElementById('btnTopDashboard');

  if (!container) return;

  // જો 01 થી 11 સ્ટેજમાંથી કોઈ સ્ટેજ ખૂલતો હોય
  if (hash.startsWith('stage/')) {
    const stageName = hash.split('/')[1];
    btnTopDashboard.style.display = 'inline-flex';
    document.getElementById('navSubTitle').innerText = `| Stage: ${stageName.toUpperCase()}`;
    renderStage(container, stageName);
    return;
  }

  // જો ડેશબોર્ડ સિવાયનું કોઈ પેજ હોય તો ઉપર Dashboard બટન બતાવવું
  btnTopDashboard.style.display = (hash === '' || hash === 'dashboard') ? 'none' : 'inline-flex';

  // ૨. રૂટ ચેકિંગ શરતો (Routing Conditions)
  if (hash === 'progress-dashboard') {
    document.getElementById('navSubTitle').innerText = '| 📈 Progress Dashboard';
    renderProgressDashboard(container);
  } else if (hash === 'spool-tracking') {
    document.getElementById('navSubTitle').innerText = '| 🔍 Spool Tracking';
    renderSpoolTracking(container);
  } else if (hash === 'progress-report') {
    document.getElementById('navSubTitle').innerText = '| 📅 Progress Report';
    renderProgressReport(container);
  } else if (hash === 'master-register') {
    document.getElementById('navSubTitle').innerText = '| 📊 Master Live Register';
    renderMasterRegister(container);
  } else if (hash === 'mto-register') {
    // 👉 અહીં MTO માટેની શરત ઉમેરાઈ:
    document.getElementById('navSubTitle').innerText = '| 📋 MTO Register';
    renderMtoRegister(container);
  } else {
    // ડિફોલ્ટ: મુખ્ય ડેશબોર્ડ દર્શાવવું
    document.getElementById('navSubTitle').innerText = '| Progress Tracking';
    renderDashboard(container);
  }
}
