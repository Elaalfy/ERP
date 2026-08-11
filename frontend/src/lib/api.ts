import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// عند فشل أي طلب، نستخرج رسالة الخطأ العربية القادمة من الباك اند لعرضها مباشرة
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join('، ');
    if (data?.message) return data.message;
  }
  return 'حدث خطأ غير متوقع';
}
