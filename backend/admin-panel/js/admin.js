let ALL_SUBMISSIONS = [];

const ADMIN_TOKEN_KEY = 'inspeiGalaAdminToken';
function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}api/${path}`, { headers, ...opts });
  if (res.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.href = 'login.html';
    throw new Error('Non authentifié');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur');
  return data;
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderStats(list) {
  document.getElementById('statTotal').textContent = list.length;
  document.getElementById('statLink').textContent = list.filter(s => s.projectLink).length;
  document.getElementById('statFile').textContent = list.filter(s => s.fileStoredName).length;
  document.getElementById('statSelected').textContent = list.filter(s => s.status === 'selected').length;
}

function renderTable(list) {
  const wrap = document.getElementById('tableWrap');
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox" style="font-size:1.8rem;"></i><p>Aucune soumission ne correspond.</p></div>`;
    return;
  }

  const rows = list.map(s => `
    <tr>
      <td data-label="Projet"><b>${esc(s.title)}</b><br><span style="color:var(--ivory-dim);font-size:.8rem;">${esc(s.team || '')}</span></td>
      <td data-label="Participant">${esc(s.user?.name || '—')}<br><span style="color:var(--ivory-dim);font-size:.8rem;">${esc(s.user?.email || '')} · ${esc(s.user?.phone || '')}</span></td>
      <td data-label="Lien" class="link-cell">${s.projectLink ? `<a href="${esc(s.projectLink)}" target="_blank" rel="noopener noreferrer">Ouvrir <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '—'}</td>
      <td data-label="Fichier">${s.fileStoredName ? `<button class="mini-btn" data-action="download" data-id="${s.id}" data-filename="${esc(s.fileOriginalName || 'fichier')}"><i class="fa-solid fa-download"></i> ${esc(s.fileOriginalName || 'fichier')}</button>` : '—'}</td>
      <td data-label="Statut">
        <select class="status-select" data-action="status" data-id="${s.id}">
          <option value="submitted" ${s.status === 'submitted' ? 'selected' : ''}>Soumis</option>
          <option value="reviewed" ${s.status === 'reviewed' ? 'selected' : ''}>Examiné</option>
          <option value="selected" ${s.status === 'selected' ? 'selected' : ''}>Sélectionné</option>
        </select>
      </td>
      <td data-label="Reçu le">${new Date(s.createdAt).toLocaleString('fr-FR')}</td>
    </tr>
  `).join('');

  wrap.innerHTML = `
    <table>
      <thead><tr><th>Projet</th><th>Participant</th><th>Lien</th><th>Fichier</th><th>Statut</th><th>Reçu le</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function applyFilters() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = ALL_SUBMISSIONS.filter(s => {
    const matchesQuery = !q || [s.title, s.user?.name, s.user?.email].some(f => (f || '').toLowerCase().includes(q));
    const matchesStatus = !status || s.status === status;
    return matchesQuery && matchesStatus;
  });
  renderTable(filtered);
}

async function loadSubmissions() {
  try {
    const data = await api('submissions');
    ALL_SUBMISSIONS = data.submissions;
    renderStats(ALL_SUBMISSIONS);
    renderTable(ALL_SUBMISSIONS);
  } catch (err) {
    document.getElementById('tableWrap').innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

async function updateStatus(id, status) {
  try {
    await api(`submissions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const item = ALL_SUBMISSIONS.find(s => s.id === id);
    if (item) item.status = status;
    renderStats(ALL_SUBMISSIONS);
  } catch (err) {
    alert(err.message);
  }
}

async function downloadFile(id, filename) {
  try {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE}api/submissions/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Téléchargement impossible.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'projet.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try { await api('logout', { method: 'POST' }); } catch (_) {}
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.location.href = 'login.html';
});

// Event delegation for dynamically rendered table actions (CSP blocks inline onclick/onchange).
document.getElementById('tableWrap').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="download"]');
  if (btn) downloadFile(btn.dataset.id, btn.dataset.filename);
});
document.getElementById('tableWrap').addEventListener('change', (e) => {
  const select = e.target.closest('[data-action="status"]');
  if (select) updateStatus(select.dataset.id, select.value);
});

loadSubmissions();
