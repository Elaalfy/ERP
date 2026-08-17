# نظام إدارة المجموعة (ERP)

نظام محاسبة وإدارة موحد لمجموعة شركات، يشمل: المحاسبة، المبيعات والمخزون (FIFO)، إغلاق الكاشير، المشتريات، الموارد البشرية والرواتب، والتقارير الموحدة.

## البنية

- `backend/` — NestJS + PostgreSQL + TypeORM
- `frontend/` — React + Vite + TypeScript + Tailwind
- `docker-compose.yml` — تشغيل قاعدة البيانات (وجاهز لاحقاً لتشغيل الباك اند كحاوية)

## التشغيل المحلي

### المتطلبات
- Node.js 20+ 
- Docker و Docker Compose (لتشغيل PostgreSQL)

### 1) تشغيل قاعدة البيانات

```bash
docker-compose up -d postgres
```

### 2) الباك اند

```bash
cd backend
cp .env.example .env   # يجب تعيين JWT_ACCESS_SECRET و JWT_REFRESH_SECRET بقيمتين حقيقيتين — الخادم يرفض الإقلاع بدونهما
npm install
npm run migration:run  # تطبيق كل الجداول على قاعدة البيانات
npm run start:dev
```

يعمل على: `http://localhost:3000`

### 3) الفرونت اند

```bash
cd frontend
cp .env.example .env   # عدّل VITE_API_URL إذا كان الباك اند على رابط مختلف
npm install
npm run dev
```

يعمل على: `http://localhost:5173`

## ملاحظات مهمة

- **المصادقة (تسجيل الدخول) مُفعَّلة بالكامل** — `JWT` مخصص (`access` + `refresh token` في `httpOnly cookies`) مع حماية `CSRF`، وصلاحية `isGroupManager` منفصلة للوصول الكامل لكل الشركات. أول مستخدم (`admin@elaalfy.local`) يُزرع تلقائياً بكلمة مرور مؤقتة ويُجبر على تغييرها فوراً عند أول دخول قبل أي استخدام آخر للنظام.
- `JWT_ACCESS_SECRET` و`JWT_REFRESH_SECRET` إلزاميان في بيئة الباك اند بلا أي قيمة افتراضية بديلة (`fallback`) — أي محاولة إقلاع بدونهما تفشل صراحة.
- رابط الـ `API` في الفرونت اند يُقرأ من `VITE_API_URL` (راجع `frontend/.env.example`) بدل قيمة ثابتة بالكود.
- بعض النماذج (كالقيد اليدوي) تستخدم مؤقتاً معرّفات ثابتة (`periodId`, `createdById`) لحين بناء شاشات إدارة الفترات المالية والمستخدمين.
- CORS مفعّل بشكل مفتوح (`origin: true`) للتطوير فقط — يجب تقييده قبل أي نشر فعلي (production).
