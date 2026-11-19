const OFFLINE = 'Could not reach Giftory. Check your connection and try again.';

async function request(method, url, body, config = {}) {
  const token = localStorage.getItem('giftory_token');
  const raw = body instanceof Blob;
  let res;
  try {
    res = await fetch(`/api${url}`, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body !== undefined && !raw && { 'Content-Type': 'application/json' }),
        ...config.headers,
      },
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
  } catch {
    throw Object.assign(new Error(OFFLINE), { isApiError: true });
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw Object.assign(new Error(data?.message || OFFLINE), { isApiError: true, response: { status: res.status, data } });
  return { data, status: res.status };
}

export const errorText = (e) => e?.response?.data?.message || OFFLINE;

export default {
  get: (url, config) => request('GET', url, undefined, config),
  delete: (url, config) => request('DELETE', url, undefined, config),
  post: (url, body, config) => request('POST', url, body, config),
  put: (url, body, config) => request('PUT', url, body, config),
  patch: (url, body, config) => request('PATCH', url, body, config),
};
