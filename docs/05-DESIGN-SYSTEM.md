# 05 — Dizayn tizimi (Design System)

> Prototipdan (`prototype/lingo-bridge.html`) olingan token'lar. React'da Tailwind config yoki CSS o'zgaruvchilari sifatida ishlatiladi. **Yangi rang/shrift o'ylab topmang** — shu yerdagilardan foydalaning.

## 1. Brend g'oyasi

**Lingo Bridge = «Til ko'prigi»** — nom so'zma-so'z *tillar orasidagi ko'prik*. Butun vizual til shu metaforadan chiqadi:
- Login ekranida uchta tildagi so'z (**Salom / Hello / Привет**) ko'prik ustidan "o'tib" turadi.
- Ranglar: **teal** (suv, ishonch) + **amber/guld** (iliqlik, harakat).
- AI odatda tanlaydigan shablon (krem+serif+terrakota yoki qora+kislotali yashil) dan ataylab qochilgan.

## 2. Rang token'lari

### Light (asosiy)
```css
--paper:      #F1F4F2;   /* sahifa foni */
--surface:    #FFFFFF;   /* kartalar */
--surface-2:  #F6F9F7;   /* ikkilamchi yuza, inputlar */
--ink:        #16211F;   /* asosiy matn */
--ink-soft:   #405250;   /* ikkilamchi matn */
--muted:      #6E817C;   /* xira matn */
--line:       #E1E8E4;   /* chegaralar */

--brand:      #0E5B59;   /* teal — asosiy brend */
--brand-2:    #127A75;   /* teal hover / urg'u */
--brand-ink:  #07403E;   /* to'q teal */

--accent:     #D8862E;   /* amber — CTA/harakat */
--accent-2:   #C1741F;   /* amber hover */
--accent-soft:#F7E1BF;   /* amber fon */

--aqua:       #5FB0A6;   /* yumshoq aqua */
--aqua-soft:  #DCEFEC;

--ok:    #2E8B6F;   --warn: #C08A1C;   --danger: #C4553D;
```

### Dark
```css
--paper:     #0A1514;   --surface:   #0F1E1C;   --surface-2: #132522;
--ink:       #E9F1EE;   --ink-soft:  #B2C4BF;   --muted:     #7E938E;
--line:      #213330;
--brand:     #2FA39B;   --brand-2:   #3BB8AE;   --brand-ink: #8FD9D1;
--accent:    #E7A24C;   --accent-2:  #EBAE63;   --accent-soft:#38301F;
--aqua:      #6FC3B8;   --aqua-soft: #153230;
```

Dark mode: `<html data-theme="dark">`. Boshlang'ich holat `prefers-color-scheme` dan olinadi, foydalanuvchi almashtira oladi (holat saqlanadi — real versiyada user sozlamasida).

**CTA qoidasi:** asosiy harakat tugmasi (submit, "Tarjima qilish", "Material yaratish") — **amber** (`--accent`). Ikkilamchi brend harakati — **teal** (`--brand`).

## 3. Tipografiya

| Rol | Shrift | Ishlatilishi |
|---|---|---|
| Display | **Fraunces** (serif) | Sarlavhalar (h1–h3), akademik xarakter |
| Body | **IBM Plex Sans** | Asosiy matn. **Lotin va kirill** ikkalasini qo'llaydi (rus tili uchun muhim) |
| Mono | **IBM Plex Mono** | ID, holat/badge, raqamlar, "eyebrow" yorliqlar |

Google Fonts:
```
Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600
IBM+Plex+Sans:wght@400;500;600;700
IBM+Plex+Mono:wght@400;500
```

Qoidalar: `h1,h2,h3 { font-family: Fraunces; font-weight: 500; letter-spacing: -0.01em }`. Body `line-height: 1.5`.

## 4. Shakl token'lari

```css
--r-lg: 18px;   --r-md: 13px;   --r-sm: 9px;              /* burchak radiusi */
--shadow:    0 1px 2px rgba(16,33,31,.05), 0 8px 24px rgba(16,33,31,.06);
--shadow-lg: 0 12px 40px rgba(16,33,31,.14);
```
Fokus holati: `:focus-visible { outline: 2.5px solid var(--brand-2); outline-offset: 2px }` — accessibility uchun saqlab qoling.

## 5. Komponentlar

Prototipdagi klasslar — React komponentlariga ko'chiriladi:

| Komponent | Klass/holat | Izoh |
|---|---|---|
| **Button** | `.btn` + `.btn-primary` (amber) / `.btn-brand` (teal) / `.btn-ghost` / `.btn-soft` | `:disabled` → opacity .5 |
| **Chip** | `.chip` | Til yorlig'i, tarix elementlari |
| **Badge** | `.badge` (mono shrift) | Holat: `Navbatda / Tarjima qilinmoqda / Tayyor` |
| **Card** | `.card` | Yuza + chegara + `--shadow` + `--r-lg` |
| **Eyebrow** | `.eyebrow` | Kichik katta harfli mono yorliq (bo'lim usti) |
| **Input/Select/Textarea** | `--surface-2` fon, `--line` chegara | Fokusda brend outline |
| **Job card** | Progress bar + badge + yuklab olish tugmasi | Holat animatsiyasi |
| **Translator pane** | Ikki panel + o'rtada swap tugma | Tezkor tarjima |
| **Level pills** | A1–C2, `display: grid; grid-template-columns: repeat(6, 1fr)` | O'ralib ketmasligi uchun grid (prototipda tuzatilgan) |
| **Sidebar** | Desktop qat'iy, mobil off-canvas + hamburger | Responsive |

## 6. Responsive

- Mobil: sidebar off-canvas (hamburger bilan ochiladi), ikki panelli tarjima → ustma-ust.
- Breakpoint'lar Tailwind default (`sm 640 / md 768 / lg 1024`).
- Barcha sahifalar mobil-birinchi tekshirilgan (prototipda screenshot bilan tasdiqlangan).

## 7. Tailwind'ga ko'chirish (React)

`tailwind.config.js` da token'larni `theme.extend.colors` va `fontFamily` ga o'tkazing; yoki soddaroq — shu CSS o'zgaruvchilarni `:root` ga qo'yib, Tailwind'da `bg-[var(--brand)]` uslubida ishlating. Ikkinchi variant dark mode'ni bitta `data-theme` bilan boshqarishni osonlashtiradi.
