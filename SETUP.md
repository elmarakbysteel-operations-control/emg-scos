# EMG-SCOS Setup Guide

## المتطلبات (Requirements)

- Node.js >= 18.0.0
- MySQL >= 8.0.0
- pnpm >= 10.0.0
- Git

## خطوات التثبيت (Installation Steps)

### 1. استنساخ المشروع (Clone Repository)

```bash
git clone https://github.com/elmarakbysteel-operations-control/emg-scos.git
cd emg-scos
```

### 2. تثبيت الاعتماديات (Install Dependencies)

```bash
pnpm install
```

### 3. إعداد متغيرات البيئة (Setup Environment Variables)

انسخ `.env.example` إلى `.env` وحدّث القيم:

```bash
cp .env.example .env
```

ثم عدّل الملف:
```env
# قاعدة البيانات (MySQL)
DATABASE_URL=mysql://root:password@localhost:3306/emg_scos

# المصادقة (Authentication)
JWT_SECRET=your_secure_random_key
OWNER_OPEN_ID=your_owner_id

# الخادم
NODE_ENV=development
PORT=3000
```

### 4. إعداد قاعدة البيانات (Database Setup)

#### أ) إنشاء قاعدة البيانات:

```bash
# استخدم MySQL CLI
mysql -u root -p
```

ثم نفّذ:
```sql
CREATE DATABASE emg_scos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emg_scos;
```

#### ب) تطبيق الهجرات (Run Migrations):

```bash
pnpm run db:push
```

### 5. تشغيل المشروع (Run Development Server)

```bash
pnpm run dev
```

سيبدأ الخادم على `http://localhost:3000`

## الأوامر المتاحة (Available Commands)

```bash
# تطوير (Development)
pnpm run dev          # بدء خادم التطوير مع Hot Reload

# الاختبارات (Testing)
pnpm run test         # تشغيل جميع الاختبارات
pnpm run check        # التحقق من أنواع TypeScript

# البناء (Build)
pnpm run build        # بناء المشروع للإنتاج
pnpm run start        # تشغيل النسخة المُنتجة

# قاعدة البيانات (Database)
pnpm run db:push      # تطبيق الهجرات

# الترميز (Code Quality)
pnpm run format       # تنسيق الكود مع Prettier
```

## البيانات الأولية (Seed Data)

لملء قاعدة البيانات بـ بيانات تجريبية:

```bash
node seed-freetime.mjs
```

هذا سيضيف:
- 30+ شحنة مع حالات مختلفة
- 8 تتبعات اعتماد مستندي (LC)
- ~24 فحص تناقضات مستندية
- 9 مستندات تجريبية

## استكشاف الأخطاء (Troubleshooting)

### خطأ: "DATABASE_URL is required"

تأكد من وجود متغير `DATABASE_URL` في ملف `.env`

```bash
# تحقق
echo $DATABASE_URL

# أو استخدم:
source .env && echo $DATABASE_URL
```

### خطأ: "Connection refused" على MySQL

تأكد من تشغيل MySQL:

```bash
# على Windows
net start MySQL80

# على macOS
brew services start mysql

# على Linux
sudo systemctl start mysql
```

### خطأ: "Port 3000 is in use"

تغيير المنفذ:

```bash
PORT=3001 pnpm run dev
```

### خطأ: "ENOENT: no such file or directory"

تأكد من تثبيت الاعتماديات:

```bash
pnpm install --force
```

## الإنتاج (Production Deployment)

### 1. البناء:

```bash
pnpm run build
```

### 2. تشغيل:

```bash
NODE_ENV=production pnpm run start
```

### 3. متغيرات البيئة الإنتاجية:

```env
NODE_ENV=production
DATABASE_URL=mysql://prod_user:prod_password@prod_host:3306/emg_scos
JWT_SECRET=your_production_secret_key
OWNER_OPEN_ID=production_owner_id
PORT=80
```

## هيكل قاعدة البيانات (Database Schema)

```
جداول أساسية:
├── users              المستخدمين
├── shipments          الشحنات
├── procurement        المشتريات
├── freight            الشحن
├── customs            الجمارك
├── costs              التكاليف
├── documents          المستندات
├── tasks              المهام
├── suppliers          الموردين
├── bank_lc            الاعتماد المستندي
├── doc_check          فحص المستندات
├── alert_log          سجل التنبيهات
├── audit_log          سجل التدقيق
└── settings           الإعدادات
```

## المساعدة (Help)

للمزيد من المعلومات:
- 📖 [Documentation](./docs)
- 🐛 [Issues](https://github.com/elmarakbysteel-operations-control/emg-scos/issues)
- 📧 Contact: support@emg-scos.com
