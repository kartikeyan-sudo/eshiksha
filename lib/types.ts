export type UserRole = "user" | "admin";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  isBlocked?: boolean;
  isActive?: boolean;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type Ebook = {
  id: number;
  title: string;
  description: string;
  price: number;
  fileKey: string;
  coverKey: string;
  previewPages: number;
  category?: string;
  tags?: string[];
  isFree?: boolean;
  viewsCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  coverUrl: string;
  hasPurchased?: boolean;
};

export type EbookAccess = {
  hasAccess: boolean;
  isPaymentReview?: boolean;
  previewPages: number;
  pdfUrl: string;
};

export type ReadingProgress = {
  id?: number;
  userId: number;
  ebookId: number;
  lastPage: number;
  progressPercent: number;
  updatedAt: string | null;
};

export type Bookmark = {
  id: number;
  userId: number;
  ebookId: number;
  pageNumber: number;
  createdAt: string;
};

export type Note = {
  id: number;
  userId: number;
  ebookId: number;
  pageNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: number;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  isActive: boolean;
  purchasedBooks?: { id: number; title: string; price: string; date: string }[];
};

export type RecentTransaction = {
  amount: number;
  userEmail: string;
  ebookTitle: string;
  createdAt: string;
};

export type OrderStatus = "pending" | "payment_review" | "completed" | "delivered";

export type AdminDashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalEbooks: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
  todayRevenue: number;
  totalSales: number;
  topSellingEbooks: Array<{
    id: number;
    title: string;
    purchasesCount: number;
  }>;
  recentTransactions: RecentTransaction[];
};

export type EbookRating = {
  id: number;
  userId: number;
  ebookId: number;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
};

export type EbookRatingSummary = {
  averageRating: number;
  totalRatings: number;
  reviews: EbookRating[];
};

export type RazorpayOrderResponse = {
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  alreadyPurchased?: boolean;
  isFree?: boolean;
  message?: string;
  ebook?: {
    id: number;
    title: string;
    price: number;
  };
};

export type RazorpayVerifyPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type Order = {
  id: number;
  ebookId: number;
  ebookTitle: string;
  amount: number;
  status: OrderStatus;
  paymentId: string | null;
  razorpayOrderId: string | null;
  coverUrl?: string;
  createdAt: string;
};

export type AdminOrder = Order & {
  userId: number;
  userEmail: string;
};

export type AdminOrdersResponse = {
  items: AdminOrder[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type Category = {
  id: number;
  name: string;
  icon: string;
  description: string;
  ebookCount: number;
  createdAt: string;
};

export type AdminDbStats = {
  users: number;
  purchases: number;
  paymentTransactions: number;
  readingProgress: number;
  bookmarks: number;
  notes: number;
};
