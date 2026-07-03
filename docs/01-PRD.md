# 01 — Mahsulot talablari (PRD)

> Nima quramiz va nima uchun. Barcha keyingi hujjatlar shu yerdagi talablarga tayanadi.

## 1. Maqsad va kontekst

**Lingo Bridge** — UrDPI huzuridagi til markazining raqamli platformasi. Maqsad: markazning mavjud (offlayn) xizmatlarini onlayn qilib, mijozlar uchun bir joyda yig'ish va AI yordamida tezlashtirish.

Platforma korxona NIZOMi bilan huquqiy jihatdan mustahkamlangan:

- **§4.2** — diplom, sertifikat, dissertatsiya, avtoreferat va rasmiy hujjatlarni o'zbek–ingliz–rus tillarida tarjima qilish, tahrir (editing/proofreading).
- **§4.1 / §3.3** — o'quv materiallari va metodik qo'llanmalar ishlab chiqish, IELTS/CEFR tayyorgarligi.
- **§4.3** — onlayn platformalar va AI vositalarini joriy etish.

## 2. Foydalanuvchilar va rollar

| Rol | Kim | Nima qila oladi |
|---|---|---|
| **Mijoz** (client) | Talaba, o'qituvchi, tashqi buyurtmachi | Hujjat yuklaydi, tarjima buyuradi, tezkor tarjima va material yaratadi, o'z tarixini ko'radi. |
| **Tarjimon** (translator) | Markaz xodimi | Notarial/professional buyurtmalarni ko'rib chiqadi, AI qoralamasini tahrirlaydi, tasdiqlaydi. |
| **Admin** | Markaz rahbari/IT | Foydalanuvchilar, narxlar, buyurtmalar, statistikani boshqaradi. |

MVP'da faqat **Mijoz** roli to'liq ishlaydi; **Tarjimon** oqimi Phase 3'da qo'shiladi.

## 3. Asosiy modullar

### 3.1 Hujjat tarjimasi (Document Translation)

**Muammo:** mijoz diplom/transkriptni tarjima qildirishi kerak, lekin format (jadval, muhr joyi, tuzilma) saqlanishi shart.

**Oqim:**
1. Mijoz bir yoki bir nechta fayl yuklaydi (PDF, DOCX, JPG/PNG).
2. Hujjat turini tanlaydi (diplom / transkript / sertifikat / dissertatsiya / boshqa).
3. Til yo'nalishi (dan → ga) va opsiyalar: **Notarial tasdiq**, **Original formatni saqlash**, **Shoshilinch**.
4. Buyurtma yaratiladi → holat kartasi paydo bo'ladi (`Navbatda` → `Tarjima qilinmoqda` → `Tayyor` / `Tekshiruvda`).
5. Tayyor bo'lgach mijoz natijani yuklab oladi.

**User stories:**
- Mijoz sifatida skan qilingan PDF diplomni yuklab, ingliz tiliga tarjimasini olishni xohlayman.
- Notarial tasdiq belgilaganimda, natija avtomatik emas — tarjimon tekshirib tasdiqlaganidan keyin beriladi.
- Bir nechta faylni birato'la yuborib, har birining holatini alohida kuzatishni xohlayman.

**Muhim:** bu eng murakkab modul. OCR (skan uchun) + formatni saqlagan tarjima kerak. Batafsil `docs/02-ARCHITECTURE.md`.

### 3.2 Tezkor tarjima (Quick Translate)

**Muammo:** mijozga bir zumda so'z yoki qisqa matn tarjimasi kerak, fayl yuklamasdan.

**Xususiyatlar:**
- Ikki panelli tarjimon oynasi, o'rtada yo'nalishni almashtirish.
- Til avto-aniqlash.
- **Akademik atamalar rejimi** — ilmiy/rasmiy uslubni saqlaydi.
- Tinglash (TTS), nusxalash, belgi hisoblagich.
- So'nggi tarjimalar tarixi (tez qayta ishlatish uchun).

**User stories:**
- O'qituvchi sifatida atamani tez tarjima qilib, akademik variantini olishni xohlayman.
- Tarjimani ovoz bilan tinglab, talaffuzni tekshirishni xohlayman.

### 3.3 O'quv materiali (Learning Material)

**Muammo:** o'qituvchiga muayyan fan va mavzu bo'yicha, muayyan darajaga mos tayyor material kerak.

**Kirish:** fan, mavzu, **CEFR daraja (A1–C2)**, material turi (dars rejasi / mashqlar / taqdimot tezislari / o'qish matni / test / lug'at), material tili, qo'shimcha izoh.

**Chiqish:** tayyor material — ko'chirish/yuklab olish mumkin; tarixga saqlanadi.

**User stories:**
- O'qituvchi sifatida "Ingliz tili, Present Perfect, B1, mashqlar" deb kiritib, tayyor mashqlar to'plamini olishni xohlayman.
- Yaratilgan materialni keyin qayta topish uchun tarixdan ko'rishni xohlayman.

### 3.4 Yordamchi modullar

- **Bosh sahifa (Dashboard):** statistika (buyurtmalar soni, tayyor/jarayonda), tezkor amallar, so'nggi faoliyat.
- **Tarix:** barcha xizmatlar bo'yicha yagona ro'yxat, filtrlash/qidiruv.
- **Auth:** ro'yxatdan o'tish, kirish (login-parol), rollar, sessiya.
- **(Opsional) To'lov/buyurtma:** ustavda pullik xizmatlar bor — kerak bo'lsa narx va to'lov qo'shiladi (Phase 3+).

## 4. Funksional bo'lmagan talablar

| Talab | Maqsad |
|---|---|
| **Xavfsizlik** | JWT auth, parollar `argon2`/`bcrypt` bilan hash. Fayllar faqat egasiga ochiq. AI kaliti faqat serverda. |
| **Maxfiylik** | Yuklangan hujjatlar shaxsiy; loglarga hujjat matni yozilmaydi. Ma'lum muddatdan keyin fayllarni tozalash siyosati. |
| **Ishlash (performance)** | Tezkor tarjima < 3s (AI javobiga bog'liq). Hujjat ishi async — UI bloklanmaydi. |
| **i18n** | Interfeys hozircha o'zbekcha; arxitektura UZ/EN/RU qo'shishga tayyor (satrlar bir joyda). |
| **Moslashuv** | To'liq mobil-responsive (prototipda bor). Dark mode. |
| **Ishonchlilik** | Job qayta urinish (retry) bilan; AI xatosi mijozga tushunarli xabar sifatida ko'rsatiladi. |
| **Auditlik** | Muhim amallar (buyurtma, tasdiq, o'chirish) audit logga yoziladi. |

## 5. v1 doirasidan tashqarida (hozircha emas)

- To'liq to'lov shlyuzi integratsiyasi (Payme/Click) — Phase 3+.
- Mobil (native) ilova — web MVP'dan keyin.
- Ko'p tilli interfeys (faqat arxitektura tayyorlanadi, implementatsiya Phase 4).
- Real vaqtli hamkorlik/chat.

## 6. Muvaffaqiyat mezoni (MVP)

- Mijoz ro'yxatdan o'tib kira oladi.
- Tezkor tarjima va o'quv materiali AI orqali real ishlaydi.
- Hujjat yuklab, hech bo'lmasa matnli (DOCX) hujjat uchun tarjima olib, yuklab olish mumkin.
- Barcha faoliyat tarixda ko'rinadi.
- Platforma prototipdagi dizayn va o'zbek interfeysiga mos.
