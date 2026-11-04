# تطبيق مالينز (Android)

نسخة `1.1.0.13-beta` — هيكل أولي قابل للبناء والتشغيل.

## المتطلبات

- JDK 17 أو أحدث (على هذا الجهاز: `/home/mollok/.jdks/jdk25`).
- Android SDK مع platform 37 وbuild-tools 37.0.0.
- Gradle wrapper مرفق (9.4.1)، لا حاجة لتثبيت Gradle.

## البناء

```bash
cd android
JAVA_HOME=/home/mollok/.jdks/jdk25 ./gradlew :app:assembleDebug
```

الناتج:

```
app/build/outputs/apk/debug/app-debug.apk
```

## التثبيت

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## الاتصال بالسيرفر

- المحاكي (emulator): العنوان الافتراضي `http://10.0.2.2:4000` (يشير إلى جهاز التطوير).
- جهاز حقيقي: ضع عنوان الجهاز في الشبكة من شاشة الإعدادات، مثل `http://192.168.1.20:4000`.
- يمكن دائماً استيراد `SAR.json` من الإعدادات واللعب دون اتصال.

## الخريطة

- تُحمَّل من `app/src/main/assets/map/region4.geojson` (منطقة الشرق الأوسط التجريبية).
- لتوليد ملف منطقة من قاعدة بيانات السيرفر:

```bash
cd ../server
npx tsx src/export-geojson.ts 4 ../android/app/src/main/assets/map/region4.geojson
```

## الشاشات الحالية

الخريطة · الدولة · الجيش · الاقتصاد · الدبلوماسية · القرارات · الأخبار · الإعدادات.

## حدود النسخة الحالية

- الخريطة 2D تفاعلية (سحب، تكبير، اختيار مقاطعة) لكن الرسم الأولي بسيط.
- لا يوجد توقيع رقمي لملف `nDSV` من التطبيق بعد (الحقل موجود وفارغ).
- لا يوجد بث لحظي (WebSocket) ولا مصادقة لاعبين.
