/* =========================================================
   Auth forms: client-side validation (defense in depth only —
   the backend re-validates everything and is the real gate).
   ========================================================= */

function setFieldError(fieldEl, hasError) {
  fieldEl.classList.toggle('has-error', hasError);
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

// Password visibility toggles
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const icon = btn.querySelector('i');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !isPass);
    icon.classList.toggle('fa-eye-slash', isPass);
  });
});

function setLoading(btn, loading, labelHtml) {
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner"></i> Un instant…`;
    btn.disabled = true;
  } else {
    btn.innerHTML = labelHtml || btn.dataset.originalHtml;
    btn.disabled = false;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Register ----------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    let valid = true;
    setFieldError(document.getElementById('f-name'), name.length < 2); if (name.length < 2) valid = false;
    setFieldError(document.getElementById('f-email'), !EMAIL_RE.test(email)); if (!EMAIL_RE.test(email)) valid = false;
    setFieldError(document.getElementById('f-phone'), phone.length < 8); if (phone.length < 8) valid = false;
    const passOk = password.length >= 8 && /\d/.test(password);
    setFieldError(document.getElementById('f-password'), !passOk); if (!passOk) valid = false;
    setFieldError(document.getElementById('f-confirm'), password !== confirm); if (password !== confirm) valid = false;

    if (!valid) return;

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);
    try {
      await api.post('/api/auth/register', { name, email, phone, password });
      Toast.show('Compte créé avec succès. Bienvenue !', 'success');
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert(err.message || "Impossible de créer le compte.");
    } finally {
      setLoading(btn, false, '<i class="fa-solid fa-user-plus"></i> Créer mon compte');
    }
  });
}

// ---------- Login ----------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    setFieldError(document.getElementById('f-email'), !EMAIL_RE.test(email)); if (!EMAIL_RE.test(email)) valid = false;
    setFieldError(document.getElementById('f-password'), password.length === 0); if (password.length === 0) valid = false;
    if (!valid) return;

    const btn = document.getElementById('submitBtn');
    setLoading(btn, true);
    try {
      await api.post('/api/auth/login', { email, password });
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(btn, false, '<i class="fa-solid fa-right-to-bracket"></i> Se connecter');
    }
  });
}
