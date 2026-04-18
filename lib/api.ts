import type {
  AdminDashboardStats,
  AdminDbStats,
  AdminOrdersResponse,
  AdminUser,
  AuthResponse,
  Bookmark,
  Category,
  Ebook,
  EbookAccess,
  EbookRating,
  EbookRatingSummary,
  Note,
  Order,
  RazorpayOrderResponse,
  RazorpayVerifyPayload,
  ReadingProgress,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type FetchOptions = {
  method?: string;
  body?: BodyInit | null;
  token?: string | null;
  isJson?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiRequest<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers();

  if (options.isJson !== false) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ?? null,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(payload.message || "Request failed", response.status);
  }

  return payload as T;
}

// ═══════ Auth ═══════

export function registerUser(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginUser(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginAdmin(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token: string) {
  return apiRequest<{ user: AuthResponse["user"] }>("/api/auth/me", {
    token,
  });
}

// ═══════ Ebooks ═══════

export function listEbooks(filters?: { q?: string; category?: string; tag?: string; free?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.tag) params.set("tag", filters.tag);
  if (filters?.free) params.set("free", "true");

  const query = params.toString();
  return apiRequest<Ebook[]>(`/api/ebooks${query ? `?${query}` : ""}`);
}

export function listTrendingEbooks() {
  return apiRequest<Ebook[]>("/api/ebooks/trending");
}

export function trackEbookView(id: string | number) {
  return apiRequest<{ message: string }>(`/api/ebooks/${id}/view`, { method: "POST" });
}

export function getEbook(id: string | number, token?: string | null) {
  return apiRequest<Ebook>(`/api/ebooks/${id}`, { token: token || undefined });
}

export function getEbookAccess(id: string | number, token: string) {
  return apiRequest<EbookAccess>(`/api/ebooks/${id}/access`, {
    token,
  });
}

export function getEbookDownload(id: string | number, token: string) {
  return apiRequest<{ downloadUrl: string }>(`/api/ebooks/${id}/download`, {
    token,
  });
}

export async function downloadEbookFile(id: string | number, token: string) {
  const response = await fetch(`${API_BASE}/api/ebooks/${id}/download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload.message || "Download failed", response.status);
  }

  return response.blob();
}

// ═══════ Purchases ═══════

export function purchaseEbook(id: string | number, token: string) {
  return apiRequest<{ message: string }>(`/api/purchase/${id}`, {
    method: "POST",
    token,
  });
}

export function createRazorpayOrder(id: string | number, token: string) {
  return apiRequest<RazorpayOrderResponse>(`/api/purchase/${id}/create-order`, {
    method: "POST",
    token,
  });
}

export function verifyRazorpayPayment(id: string | number, payload: RazorpayVerifyPayload, token: string) {
  return apiRequest<{ message: string; verified: boolean }>(`/api/purchase/${id}/verify`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function submitAlreadyPaid(id: string | number, token: string) {
  return apiRequest<{ message: string; success: boolean }>(`/api/purchase/${id}/already-paid`, {
    method: "POST",
    token,
  });
}

export function getPurchaseSettings() {
  return apiRequest<{ allowAlreadyPaid: boolean }>("/api/purchase/settings");
}

// ═══════ Library ═══════

export function listLibrary(token: string) {
  return apiRequest<Ebook[]>("/api/library", {
    token,
  });
}

// ═══════ Admin: Ebooks ═══════

export function uploadEbook(formData: FormData, token: string) {
  return apiRequest<{ message: string; ebook: Ebook }>("/api/ebooks/upload", {
    method: "POST",
    body: formData,
    token,
    isJson: false,
  });
}

export function deleteEbook(id: string | number, token: string) {
  return apiRequest<{ message: string }>(`/api/ebooks/${id}`, {
    method: "DELETE",
    token,
  });
}

// ═══════ Admin: Users ═══════

export function listAdminUsers(token: string) {
  return apiRequest<AdminUser[]>("/api/admin/users", { token });
}

export function setUserBlocked(userId: number, isBlocked: boolean, token: string) {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}/block`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ isBlocked }),
  });
}

export function setUserActive(userId: number, isActive: boolean, token: string) {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}/active`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ isActive }),
  });
}

// ═══════ Admin: Dashboard ═══════

export function getAdminDashboardStats(token: string) {
  return apiRequest<AdminDashboardStats>("/api/admin/dashboard", { token });
}

// ═══════ Reading Progress ═══════

export function updateReadingProgress(
  payload: { ebookId: number; lastPage: number; progressPercent?: number },
  token: string,
) {
  return apiRequest<{ message: string; progress: ReadingProgress }>("/api/progress/update", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getReadingProgress(ebookId: number, token: string) {
  return apiRequest<{ progress: ReadingProgress }>(`/api/progress/${ebookId}`, { token });
}

export function listReadingProgress(token: string) {
  return apiRequest<ReadingProgress[]>("/api/progress", { token });
}

// ═══════ Bookmarks ═══════

export function addBookmark(payload: { ebookId: number; pageNumber: number }, token: string) {
  return apiRequest<{ message: string; bookmark: Bookmark }>("/api/bookmarks", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listBookmarks(ebookId: number, token: string) {
  return apiRequest<Bookmark[]>(`/api/bookmarks/${ebookId}`, { token });
}

export function deleteBookmark(bookmarkId: number, token: string) {
  return apiRequest<{ message: string }>(`/api/bookmarks/${bookmarkId}`, {
    method: "DELETE",
    token,
  });
}

// ═══════ Notes ═══════

export function addNote(payload: { ebookId: number; pageNumber: number; content: string }, token: string) {
  return apiRequest<{ message: string; note: Note }>("/api/notes", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listNotes(ebookId: number, token: string) {
  return apiRequest<Note[]>(`/api/notes/${ebookId}`, { token });
}

export function deleteNote(noteId: number, token: string) {
  return apiRequest<{ message: string }>(`/api/notes/${noteId}`, {
    method: "DELETE",
    token,
  });
}

// ═══════ Ratings ═══════

export function getEbookRatings(ebookId: number) {
  return apiRequest<EbookRatingSummary>(`/api/ratings/${ebookId}`);
}

export function getMyEbookRating(ebookId: number, token: string) {
  return apiRequest<{ rating: EbookRating | null }>(`/api/ratings/${ebookId}/me`, { token });
}

export function upsertEbookRating(payload: { ebookId: number; rating: number; review?: string }, token: string) {
  return apiRequest<{ message: string; rating: EbookRating }>(`/api/ratings/${payload.ebookId}`, {
    method: "POST",
    token,
    body: JSON.stringify({ rating: payload.rating, review: payload.review || "" }),
  });
}

// ═══════ Orders ═══════

export function listOrders(token: string) {
  return apiRequest<Order[]>("/api/orders", { token });
}

export function listAdminOrders(
  token: string,
  statusOrFilters?: string | { status?: string; q?: string; page?: number; pageSize?: number },
) {
  const filters = typeof statusOrFilters === "string"
    ? { status: statusOrFilters }
    : (statusOrFilters || {});

  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (typeof filters.page === "number" && Number.isFinite(filters.page)) {
    params.set("page", String(filters.page));
  }
  if (typeof filters.pageSize === "number" && Number.isFinite(filters.pageSize)) {
    params.set("pageSize", String(filters.pageSize));
  }
  const query = params.toString();
  return apiRequest<AdminOrdersResponse>(`/api/admin/orders${query ? `?${query}` : ""}`, { token });
}

export function updateOrderStatus(orderId: number, status: string, token: string) {
  return apiRequest<{ message: string; order: { id: number; status: string } }>(`/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}

export function deleteAdminOrder(orderId: number, token: string) {
  return apiRequest<{ message: string; order: { id: number } }>(`/api/admin/orders/${orderId}`, {
    method: "DELETE",
    token,
  });
}

// ═══════ Admin: DB Management ═══════

export function getAdminDbStats(token: string) {
  return apiRequest<AdminDbStats>("/api/admin/db/stats", { token });
}

export function deleteAdminUser(userId: number, token: string) {
  return apiRequest<{ message: string; user: { id: number; email: string } }>(`/api/admin/db/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

export async function downloadUsersPdf(token: string) {
  const response = await fetch(`${API_BASE}/api/admin/db/users-export.pdf`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload.message || "Failed to download users PDF", response.status);
  }

  return response.blob();
}

export function clearOrderHistory(token: string, beforeDate?: string) {
  return apiRequest<{ message: string; deleted: { purchases: number; paymentTransactions: number } }>("/api/admin/db/orders", {
    method: "DELETE",
    token,
    body: JSON.stringify(beforeDate ? { beforeDate } : {}),
  });
}

export function clearDbLogs(
  target: "readingProgress" | "bookmarks" | "notes" | "all",
  token: string,
) {
  return apiRequest<{ message: string; deleted: Record<string, number> }>("/api/admin/db/logs", {
    method: "DELETE",
    token,
    body: JSON.stringify({ target }),
  });
}

// ═══════ Categories ═══════

export function listCategories() {
  return apiRequest<Category[]>("/api/categories");
}

export function createCategory(data: { name: string; icon?: string; description?: string }, token: string) {
  return apiRequest<{ message: string; category: Category }>("/api/categories", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: number, data: { name?: string; icon?: string; description?: string }, token: string) {
  return apiRequest<{ message: string; category: Category }>(`/api/categories/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: number, token: string) {
  return apiRequest<{ message: string }>(`/api/categories/${id}`, {
    method: "DELETE",
    token,
  });
}

// ═══════ PDF Export ═══════

export async function downloadUsersExportPdf(token: string) {
  const res = await fetch(`${API_BASE}/api/admin/users/export/pdf`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to export PDF");

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = downloadUrl;
  a.download = "users_report.pdf";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}

export async function downloadUserSpecificExportPdf(userId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/export/pdf`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to export PDF");

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = downloadUrl;
  a.download = `user_${userId}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}

// ═══════ Related Books ═══════

export function listRelatedBooks(ebookId: number, _category?: string, limit = 4) {
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  return apiRequest<Ebook[]>(`/api/ebooks/${ebookId}/related?limit=${safeLimit}`);
}

// ═══════ Admin Settings ═══════

export function getAdminSettings(token: string) {
  return apiRequest<{ allow_already_paid: boolean }>("/api/admin/settings", {
    method: "GET",
    token,
  });
}

export function updateAdminSettings(token: string, allowAlreadyPaid: boolean) {
  return apiRequest<{ message: string; settings: { allow_already_paid: boolean } }>("/api/admin/settings", {
    method: "PATCH",
    token,
    body: JSON.stringify({ allow_already_paid: allowAlreadyPaid }),
  });
}

