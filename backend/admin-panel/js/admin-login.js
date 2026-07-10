document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errBox = document.getElementById('errBox');
  const btn = document.getElementById('submitBtn');
  errBox.textContent = '';
  btn.disabled = true; btn.textContent = 'Vérification…';
  try {
    const res = await fetch(`${API_BASE}api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('password').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Échec de connexion.');
    localStorage.setItem('inspeiGalaAdminToken', data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errBox.textContent = err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Entrer';
  }
});
