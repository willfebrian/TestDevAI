// FRONTEND API CLIENT EXAMPLE
//
// This file is intentionally commented out.
// Use it later when product data no longer comes from mockData.js and is served by a backend API.
//
// Recommended flow:
// 1. Keep PostgreSQL credentials only in the backend.
// 2. Frontend calls backend endpoints such as /api/products and /api/products/:id.
// 3. Backend reads PostgreSQL and returns JSON in the same shape the current views already use.

// const API_BASE_URL = "http://localhost:3000/api";
//
// async function requestJson(path, options = {}) {
//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     headers: {
//       "Content-Type": "application/json",
//       ...options.headers,
//     },
//     ...options,
//   });
//
//   if (!response.ok) {
//     const errorBody = await response.json().catch(() => ({}));
//     throw new Error(errorBody.message || "Request ke server gagal.");
//   }
//
//   return response.json();
// }
//
// export async function login(username, password) {
//   return requestJson("/login", {
//     method: "POST",
//     body: JSON.stringify({ username, password }),
//   });
// }
//
// export async function getProducts({ query = "", type = "All", limit, offset } = {}) {
//   const params = new URLSearchParams();
//
//   if (query) params.set("q", query);
//   if (type) params.set("type", type);
//   if (limit) params.set("limit", String(limit));
//   if (offset) params.set("offset", String(offset));
//
//   const queryString = params.toString();
//   return requestJson(`/products${queryString ? `?${queryString}` : ""}`);
// }
//
// export async function getProductDetail(productId) {
//   return requestJson(`/products/${encodeURIComponent(productId)}`);
// }
//
// export async function getProductionTrend(period = "day") {
//   return requestJson(`/reports/production-trend?period=${encodeURIComponent(period)}`);
// }
//
// Example integration idea for the current app:
//
// async function loadInitialData() {
//   try {
//     const products = await getProducts();
//     window.RollTraceMockData.products = products;
//     window.RollTraceApp.render();
//   } catch (error) {
//     window.RollTraceUi.showModal({
//       title: "Data gagal dimuat",
//       message: error.message,
//     });
//   }
// }
