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
cp .env.example .env   # عدّل القيم إذا لزم
npm install
npm run migration:run  # تطبيق كل الجداول على قاعدة البيانات
npm run start:dev
```

يعمل على: `http://localhost:3000`

### 3) الفرونت اند

```bash
cd frontend
npm install
npm run dev
```

يعمل على: `http://localhost:5173`

## ملاحظات مهمة

- **المصادقة (تسجيل الدخول) غير مفعّلة بعد** — الشاشات تعتمد حالياً على اختيار شركة يدوي من القائمة العلوية.
- بعض النماذج (كالقيد اليدوي) تستخدم مؤقتاً معرّفات ثابتة (`periodId`, `createdById`) لحين بناء شاشات إدارة الفترات المالية والمستخدمين.
- CORS مفعّل بشكل مفتوح (`origin: true`) للتطوير فقط — يجب تقييده قبل أي نشر فعلي (production).
