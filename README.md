# Malines Community — صفحة الانتظار

صفحة انتظار داكنة لمشروع **Malines Community** (منصة حروب استراتيجية وتاريخ بديل).
المنصة لم تُطلق بعد، والصفحة تعرض مكتبة نماذج ثلاثية الأبعاد إجرائية كعيّنة أولية من أصول المشروع.

## المكوّنات

| المجلد | الوصف |
|---|---|
| `src/`، `index.html` | صفحة الانتظار (Vite + three.js) |
| `server/` | سيرفر اللعبة: قاعدة البيانات، دورة الزمن، `SAR.json` الموقّع، لوحة `/console`، البث اللحظي |
| `android/` | تطبيق الأندرويد (Kotlin + Compose، خريطة 2D تفاعلية) |
| `shared/` | مخططات JSON لعقود `SAR` و`nDSV` |
| `docs/design.md` | وثيقة التصميم الكاملة |

للتشغيل راجع `server/README.md` و`android/README.md`.

## التشغيل

```bash
npm install
npm run dev
```

## البناء للنشر

```bash
npm run build
```

الناتج في `dist/` — ملفات ثابتة بالكامل، تُنشر على Vercel أو GitHub Pages أو أي استضافة.

## البنية

```
index.html                 الواجهة (RTL عربية)
src/main.ts                نقطة الدخول
src/style.css              التنسيق والهوية البصرية
src/scene/showroom.ts      المشهد: أرضية، إضاءة، منصات، حركة
src/scene/models/          النماذج الإجرائية (دبابة، مدفعية، مقاتلة، مدمرة، مروحية، مشاة)
```

## ملاحظات

- كل النماذج مبنية بـ three.js هندسياً — لا ملفات GLB ولا أصول خارجية.
- لإضافة نموذج جديد: أنشئ ملفاً في `src/scene/models/` ثم سجّله في `src/scene/models/index.ts`.
- الحركة تحترم `prefers-reduced-motion`.
- الألوان: خلفية `#050505`، أحمر `#c0392b`، ذهبي `#d4af37`، خط Cairo.
