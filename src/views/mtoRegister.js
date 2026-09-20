import { db } from '../config/supabase.js';
import { formatDateDisplay, escapeHtml } from '../utils/dateUtils.js';

export const MTO_COLS = [
  { key: 'Spool_number', label: 'Spool No' },
  { key: 'Drawing_no', label: 'Drawing No' },
  { key: 'MAT_SAP_CODE', label: 'SAP Code' },
  { key: 'Size_1', label: 'Size 1' },
  { key: 'Size_2', label: 'Size 2' },
  { key: 'Unit', label: 'Unit' },
  { key: 'MAT_Description', label: 'Material Description' },
  { key: 'MIN_No', label: 'MIN No' },
  { key: 'MIN_Date', label: 'MIN Date' },
  { key: 'MIN_qty', label: 'MIN Qty' },
  { key: 'Issued_qty', label: 'Issued Qty' },
  { key: 'IGP_No', label: 'IGP No' },
  { key: 'IGP_Date', label: 'IGP Date' },
  { key: 'Heat_number', label: 'Heat No' },
  { key: 'Bend_date', label: 'Bend Date' },
  { key: 'Fit_up_date', label: 'Fit Up Date' }
];

export async function renderMtoRegister(container) {
  container.innerHTML = `
    <div class="card" style="padding: 10px 14px; margin-top: 4px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 8px; padding-bottom: 6px;">
        <h3 style="margin:0; border:none; color:#0f766e;">📋 MTO Register (<span id="mtoTotalCount">0</span>)</h3>
        <div style="display:flex; gap:8px;">
          <input type="text" id="mtoSearch" placeholder="Search Spool / Drawing..." style="padding:4px 8px; width:220px; font-size:12px;">
          <button type="button" class="sub-filter-btn" id="btnRefreshMto">🔄 Refresh</button>
        </div>
      </div>
      <div class="master-table-container">
        <table>
          <thead>
            <tr style="background:#0f766e; color:white;">
              ${MTO_COLS.map(c => `<th>${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody id="mtoTableBody">
            <tr><td colspan="${MTO_COLS.length}" style="text-align:center; padding:20px;">⏳ Loading MTO Data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnRefreshMto').addEventListener('click', loadMtoData);
  document.getElementById('mtoSearch').addEventListener('input', filterMtoData);
  await loadMtoData();
}

let mtoCache = [];

async function loadMtoData() {
  const tbody = document.getElementById('mtoTableBody');
  tbody.innerHTML = `<tr><td colspan="${MTO_COLS.length}" style="text-align:center; padding:20px;">⏳ Loading MTO Data...</td></tr>`;

  const { data, error } = await db.from('mto').select('*').order('id', { ascending: true }).limit(5000);
  if (error) {
    tbody.innerHTML = `<tr><td colspan="${MTO_COLS.length}" style="text-align:center; color:red; padding:15px;">Error: ${error.message}</td></tr>`;
    return;
  }

  mtoCache = data || [];
  renderMtoRows(mtoCache);
}

function filterMtoData(e) {
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    renderMtoRows(mtoCache);
    return;
  }
  const filtered = mtoCache.filter(r => 
    String(r.Spool_number || '').toLowerCase().includes(term) ||
    String(r.Drawing_no || '').toLowerCase().includes(term) ||
    String(r.MAT_SAP_CODE || '').toLowerCase().includes(term)
  );
  renderMtoRows(filtered);
}

function renderMtoRows(rows) {
  const tbody = document.getElementById('mtoTableBody');
  const countEl = document.getElementById('mtoTotalCount');
  if (countEl) countEl.innerText = rows.length;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${MTO_COLS.length}" style="text-align:center; padding:15px; color:#64748b;">No MTO records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      ${MTO_COLS.map(c => {
        let val = r[c.key] ?? '';
        const isDate = c.key.toLowerCase().includes('date');
        return `<td>${isDate ? formatDateDisplay(val) : escapeHtml(val || '-')}</td>`;
      }).join('')}
    </tr>
  `).join('');
}
