/**
 * 后端 API 客户端工具
 * 默认测试服: http://xhsapitest.powermatrix.tech/client
 */
import { getBackendApiBaseUrl } from "@/lib/backendApi";

const API_BASE_URL = getBackendApiBaseUrl();

/* ---------- 类型定义 ---------- */

export interface LoginResponse {
  uid: number;
  name: string;
  avatarUrl: string;
  role: string;
  signature: string;
  signatureNearExpired: number;
}

export interface ApiResponse<T = unknown> {
  status: boolean;
  data: T;
  message: string;
  code: string;
}

export interface BackendAccountListItem {
  id: number;
  name: string;
  accountParam: string;
  accountType: string;
  stage: string;
  personaBase: string;
  city: string;
  status: string;
  createdAt: string;
}

export interface BackendAccountDetail {
  id: number;
  name: string;
  accountParam: string;
  accountType: string;
  stage: string;
  personaBase: string;
  city: string;
  targetUsers: string;
  painPoints: string;
  contentDirections: string;
  businessGoals: string;
  monetization: string;
  referenceAccounts: string;
  materialCondition: string;
  taboos: string;
  profilePath: string;
  assetsPath: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- localStorage 存储工具 ---------- */

const TOKEN_KEY = "xhs_token";
const USER_KEY = "xhs_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): LoginResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    return null;
  }
}

export function setAuth(data: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, data.signature);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function buildAuthHeaders() {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    throw new Error("未登录");
  }

  return {
    "Content-Type": "application/json",
    "Xhs-Language": "zh-cn",
    "Xhs-Sign": token,
    "Xhs-Person": String(user.uid),
    "Xhs-Time": Math.floor(Date.now() / 1000).toString(),
    "Xhs-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    "Xhs-Test": "1"
  };
}

/* ---------- 通用请求函数 ---------- */

/**
 * 发送无需签名的请求 (登录/注册)
 */
async function publicRequest<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Xhs-Language": "zh-cn"
    },
    body: JSON.stringify(body)
  });
  return res.json() as Promise<ApiResponse<T>>;
}

/**
 * 发送需要签名的请求
 * 自动携带 JWT Token 和签名头
 *
 * 注意: 本地开发环境通过 Xhs-Test: 1 跳过签名校验
 * 生产环境需通过 Next.js API Route 在服务端计算 MD5 签名
 */
export async function authRequest<T = unknown>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body } = options;
  const bodyStr = body ? JSON.stringify(body) : "";
  const headers = buildAuthHeaders();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: bodyStr || undefined
  });
  return res.json() as Promise<ApiResponse<T>>;
}

/* ---------- 业务接口 ---------- */

/**
 * 登录
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await publicRequest<LoginResponse>("/login/v1/login", { email, password });
  if (!res.status) {
    throw new Error(res.message || "登录失败");
  }
  setAuth(res.data);
  return res.data;
}

/**
 * 注册
 */
export async function register(email: string, name: string, password: string): Promise<LoginResponse> {
  const res = await publicRequest<LoginResponse>("/login/v1/register", { email, name, password });
  if (!res.status) {
    throw new Error(res.message || "注册失败");
  }
  setAuth(res.data);
  return res.data;
}

/**
 * 自动登录 (使用已有 token 刷新)
 */
export async function autoLogin(): Promise<LoginResponse> {
  const res = await authRequest<LoginResponse>("/login/v1/autoLogin", { method: "POST" });
  if (!res.status) {
    throw new Error(res.message || "登录已过期");
  }
  setAuth(res.data);
  return res.data;
}

/**
 * 获取用户资料
 */
export async function getProfile() {
  return authRequest("/user/v1/profile");
}

export async function fetchBackendAccounts(): Promise<BackendAccountDetail[]> {
  const listRes = await authRequest<{ accounts?: BackendAccountListItem[] }>("/account/v1/list");
  if (!listRes.status) {
    throw new Error(listRes.message || "获取账号列表失败");
  }

  const accounts = listRes.data?.accounts || [];
  const details: BackendAccountDetail[] = [];

  for (const item of accounts) {
    const detailRes = await authRequest<BackendAccountDetail>("/account/v1/detail", {
      method: "POST",
      body: { id: item.id }
    });

    if (!detailRes.status || !detailRes.data) {
      continue;
    }
    details.push(detailRes.data);
  }

  return details;
}

export async function createBackendAccount(body: Record<string, unknown>) {
  const res = await authRequest<{ id: number }>("/account/v1/create", {
    method: "POST",
    body
  });
  if (!res.status) {
    throw new Error(res.message || "创建账号失败");
  }
  return res.data;
}

export async function deleteBackendAccount(id: number) {
  const res = await authRequest("/account/v1/delete", {
    method: "POST",
    body: { id }
  });
  if (!res.status) {
    throw new Error(res.message || "删除账号失败");
  }
  return res.data;
}

export async function syncBackendAccounts() {
  const res = await fetch("/api/accounts/sync", {
    method: "POST",
    headers: buildAuthHeaders()
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    synced?: number;
    created?: number;
    updated?: number;
    skipped?: number;
    error?: string;
  };

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "同步后端账号失败");
  }

  return data;
}

/**
 * 登出
 */
export function logout() {
  clearAuth();
  window.location.href = "/login";
}
