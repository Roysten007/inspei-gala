/* =========================================================
   Dashboard: guarded page. Redirects to login if the session
   cookie is missing/expired (server is the real authority —
   every API call below is re-checked server-side too).
   ========================================================= */

const MAX_FILE_MB = 100;
const ALLOWED_EXT = ['.zip', '.rar', '.7z'];
let selectedFile = null;
let currentMethod = 'link';

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function showAlert(message, type = 'error') {
  const box = document.getElementById('alertBox');
  if (!box) return;
  const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
  box.innerHTML = `<div class="alert alert-${type}"><i class="fa-solid ${icon}"></i><span>${message}</span></div>`;
}
function clearAlert() {
  const box = document.getElementById('alertBox');
  if (box) box.innerHTML = '';
}
function setFieldError(fieldEl, hasError) {
  fieldEl.classList.toggle('has-error', hasError);
}

async function guardAndLoad() {
  try {
    const { user } = await api.get('/api/auth/me');
    document.getElementById('userName').textContent = user.name;
    document.getElementById('avatarInitial').textContent = user.name.trim()[0].toUpperCase();
  } catch (err) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const { submission } = await api.get('/api/submissions/me');
    const statusSlot = document.getElementById('statusSlot');
    if (submission) {
      statusSlot.innerHTML = `<span class="status-badge submitted"><i class="fa-solid fa-check"></i> Soumission enregistrée</span>`;
      document.getElementById('title').value = submission.title || '';
      document.getElementById('team').value = submission.team || '';
      document.getElementById('description').value = submission.description || '';
      document.getElementById('link').value = submission.projectLink || '';
      if (submission.hasFile) {
        document.getElementById('fileChipSlot').innerHTML = `
          <div class="file-chip"><i class="fa-solid fa-file-zipper"></i> ${submission.fileOriginalName || 'Fichier déjà envoyé'}
          <span style="color:var(--ivory-dim)">(déjà en ligne — sélectionnez un nouveau fichier pour le remplacer)</span></div>`;
      }
      if (submission.projectLink && submission.hasFile) selectMethod('both');
      else if (submission.hasFile) selectMethod('file');
      else selectMethod('link');
    } else {
      statusSlot.innerHTML = `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Aucune soumission pour le moment</span>`;
    }
  } catch (err) {
    // No submission yet is not an error state worth blocking the form for.
  }
}

function selectMethod(method) {
  currentMethod = method;
  document.querySelectorAll('.method-toggle button').forEach(b => b.classList.toggle('active', b.dataset.method === method));
  document.getElementById('f-link').style.display = (method === 'link' || method === 'both') ? 'block' : 'none';
  document.getElementById('f-file').style.display = (method === 'file' || method === 'both') ? 'block' : 'none';
}

document.querySelectorAll('.method-toggle button').forEach(btn => {
  btn.addEventListener('click', () => selectMethod(btn.dataset.method));
});

// ---------- Dropzone ----------
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

function handleFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    Toast.show('Format non accepté. Utilisez .zip, .rar ou .7z.', 'error');
    return;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    Toast.show(`Fichier trop volumineux (max ${MAX_FILE_MB} Mo).`, 'error');
    return;
  }
  selectedFile = file;
  document.getElementById('fileChipSlot').innerHTML = `
    <div class="file-chip">
      <i class="fa-solid fa-file-zipper"></i> ${file.name} <span style="color:var(--ivory-dim)">(${fmtSize(file.size)})</span>
      <button type="button" id="removeFile"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  document.getElementById('removeFile').addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    document.getElementById('fileChipSlot').innerHTML = '';
  });
}

if (dropzone) {
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); })
  );
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

// ---------- Submit ----------
const submissionForm = document.getElementById('submissionForm');
if (submissionForm) {
  submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const title = document.getElementById('title').value.trim();
    const team = document.getElementById('team').value.trim();
    const description = document.getElementById('description').value.trim();
    const link = document.getElementById('link').value.trim();

    let valid = true;
    setFieldError(document.getElementById('f-title'), title.length < 3); if (title.length < 3) valid = false;
    setFieldError(document.getElementById('f-description'), description.length < 30); if (description.length < 30) valid = false;

    const needsLink = currentMethod === 'link' || currentMethod === 'both';
    const needsFile = currentMethod === 'file' || currentMethod === 'both';
    const urlOk = !needsLink || /^https?:\/\/.+/i.test(link);
    setFieldError(document.getElementById('f-link'), needsLink && !urlOk); if (needsLink && !urlOk) valid = false;

    if (needsFile && !selectedFile) {
      Toast.show('Ajoutez un fichier ou changez de méthode de soumission.', 'error');
      valid = false;
    }
    if (!valid) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('team', team);
    formData.append('description', description);
    if (needsLink) formData.append('projectLink', link);
    if (needsFile && selectedFile) formData.append('file', selectedFile);

    const btn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progressBar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner"></i> Envoi en cours…';
    progressBar.style.display = 'block';

    try {
      await api.postForm('/api/submissions', formData, (pct) => {
        progressBar.querySelector('span').style.width = pct + '%';
      });
      Toast.show('Projet soumis avec succès !', 'success');
      showAlert('Votre projet a bien été enregistré. Vous pouvez le modifier à tout moment tant que la soumission reste ouverte.', 'success');
      document.getElementById('statusSlot').innerHTML = `<span class="status-badge submitted"><i class="fa-solid fa-check"></i> Soumission enregistrée</span>`;
    } catch (err) {
      showAlert(err.message || "Échec de l'envoi. Réessayez.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Envoyer ma soumission';
      setTimeout(() => { progressBar.style.display = 'none'; progressBar.querySelector('span').style.width = '0%'; }, 1200);
    }
  });
}

// ---------- Logout ----------
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try { await api.post('/api/auth/logout'); } catch (_) {}
    window.location.href = 'index.html';
  });
}

selectMethod('link');
guardAndLoad();
