import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// إرفاق رمز CSRF (نمط double-submit cookie) مع أي طلب معدِّل للبيانات
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = readCookie('csrf_token');
    if (csrfToken) {
      config.headers = config.headers ?? {};
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

// عند انتهاء صلاحية access token (401)، نحاول تحديثه مرة واحدة عبر refresh_token، وإن فشل نُعيد التوجيه لصفحة الدخول
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');
    if (axios.isAxiosError(error) && error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const refreshed = await tryRefresh();
      if (refreshed) {
        return api(originalRequest);
      }
      // فشل التحديث نهائياً: مسح الحالة وإعادة التوجيه الفوري لصفحة الدخول
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  },
);

// عند فشل أي طلب، نستخرج رسالة الخطأ العربية القادمة من الباك اند لعرضها مباشرة
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join('، ');
    if (data?.message) return data.message;
  }
  return 'حدث خطأ غير متوقع';
}
