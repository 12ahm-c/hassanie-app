# خطوات تشغيل التطبيق لأول مرة

## المتطلبات
- Node.js v18+ (مثبت ✓)
- حساب مجاني على Neon (قاعدة بيانات PostgreSQL سحابية)

---

## الخطوة 1: إنشاء قاعدة بيانات مجانية

1. اذهب إلى https://neon.tech
2. أنشئ حساب مجاني (باستخدام GitHub أو البريد)
3. أنشئ database جديد باسم `hassaniya`
4. انسخ الـ connection string

---

## الخطوة 2: إعداد ملف .env

أنشئ ملف `.env` في根目录 المشروع:

```
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/hassaniya?sslmode=require
HUGGINGFACE_TOKEN=hf_...
HUGGINGFACE_REPO=ahmed200512/hassanie_claude-translation
NODE_ENV=development
```

---

## الخطوة 3: تثبيت المكتبات

```bash
npm install
```

---

## الخطوة 4: إنشاء قاعدة البيانات

```bash
npx prisma db push
```

---

## الخطوة 5: تشغيل التطبيق

```bash
npm run dev
```

افتح المتصفح: http://localhost:3000

---

## الاختبار

1. **إضافة جمل** - اذهب إلى /sentences/add
2. **عرض القائمة** - اذهب إلى /sentences
3. **إضافة ترجمة** - اضغط Edit على أي جملة
4. **لوحة التحكم** - اذهب إلى /dashboard
5. **التصدير** - اذهب إلى /export

---

## أوامر مفيدة

```bash
npm run test          # تشغيل الاختبارات (73 اختبار)
npm run typecheck     # فحص TypeScript
npm run db:studio     # فتح Prisma Studio (عرض البيانات)
```
