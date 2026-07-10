/* =========================================================
   Tiny API client.
   - Sends/receives httpOnly cookies (credentials: 'include')
   - Attaches CSRF token on unsafe methods
   - Normalizes error handling
   Configure API_BASE to point at your deployed backend.
   ========================================================= */
const API_BASE = window.__API_BASE__ || 'https://inspei-gala-production.up.railway.app';

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') {
    const token = getCsrfToken();
    if (token) headers['X-CSRF-Token'] = token;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const message = (data && data.message) || `Erreur (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  postForm: (path, formData, onProgress) => {
    // Uses XHR instead of fetch to get upload progress events.
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}${path}`);
      xhr.withCredentials = true;
      const token = getCsrfToken();
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);

      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch (_) {}
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const err = new Error((data && data.message) || `Erreur (${xhr.status})`);
          err.status = xhr.status;
          err.data = data;
          reject(err);
        }
      };
      xhr.onerror = () => reject(new Error('Erreur réseau, réessayez.'));
      xhr.send(formData);
    });
  },
};
window.api = api;
