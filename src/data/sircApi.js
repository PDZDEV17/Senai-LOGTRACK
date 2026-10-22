
const API_URL = "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Erro na API (${response.status}): ${message}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const sircApi = {
  list(collection) {
    return request(`/${collection}`);
  },

  get(collection, id) {
    return request(
      `/${collection}/${encodeURIComponent(id)}`
    );
  },

  create(collection, item) {
    return request(`/${collection}`, {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  update(collection, id, item) {
    return request(
      `/${collection}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(item),
      }
    );
  },

  remove(collection, id) {
    return request(
      `/${collection}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
  },
};
