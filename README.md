# مساعدك المحلي — Local Browser AI

محادثة ذكاء اصطناعي تعمل **بالكامل داخل المتصفح** عبر WebGPU و[WebLLM](https://webllm.mlc.ai/). لا خادم، ولا واجهات برمجة خارجية للمحادثة، ولا تُغادر بياناتك الجهاز.

**الرابط العام:** https://o7aso1.github.io/local-browser-ai/

## المزايا (v1)

- تشغيل محلي كامل مع شريط تقدّم حقيقي لتحميل النموذج
- مستويان من نماذج Qwen2.5 Instruct (سريع 1.5B / أقوى 7B)
- واجهة عربية كاملة (`dir="rtl"`)
- محادثات وشخصيات وإعدادات في IndexedDB
- تصدير/استيراد نسخة احتياطية JSON
- إدارة التخزين ومسح الكل
- PWA قابلة للتثبيت مع عمل دون اتصال بعد التحميل الأول

## التطوير

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
npm run preview
```

`vite.config.ts` مضبوط على `base: '/local-browser-ai/'` لاستضافة GitHub Pages كصفحة مشروع.

## النشر

النشر الحالي يتم عبر فرع `gh-pages`. ملف `.github/workflows/deploy.yml` جاهز للنشر التلقائي من `main` بعد منح توكن GitHub صلاحية `workflow`.
