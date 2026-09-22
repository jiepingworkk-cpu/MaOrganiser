# Organiser — จัดชีวิตในที่เดียว 🗓️✅📝📚

เว็บแอปจัดการชีวิตส่วนตัวแบบ all-in-one สำหรับเด็กนักเรียน/นักศึกษา ที่มีทั้ง **งาน ภารแข่งขัน วิชาเรียน การบ้าน และนัดหมาย**

## ฟีเจอร์

- **ปฏิทิน** เดือนเดียวจบ — กิจกรรมพร้อมหมวด (งาน / แข่งวิชาการ / แข่งกีฬา / แข่งศิลปะ-ดนตรี / การบ้าน / อ่านหนังสือ / นัด) + เพิ่มหมวดเองได้
- **งาน (Tasks)** — ระดับความสำคัญ + กำหนดส่ง + ติ๊กเสร็จ **สีขอบซ้ายเรียงตามความด่วนอัตโนมัติ**
- **โน้ต** — จดอิสระ ผูกกับวิชา ค้นหา และปักหมุดได้
- **ตัวติดตามการอ่าน** — บทที่อ่าน / % สมบูรณ์ / วันเป้าหมาย เตือนอัตโนมัติเมื่อ **“ตามหลัง”** แผน
- **นับถอยหลังวันสำคัญ** — เหลือกี่วันก่อนแข่ง/สอบ/deadline เน้นสีแดงเมื่อใกล้
- **แจ้งเตือน 2 ชั้น** — ไฮไลต์แดงในแอป + push notification จริงผ่านเบราว์เซอร์ (ค้างเปิดและปิดแอป)
- **บัญชี + ซิงก์เรียลไทม์** — Email/Google login ข้ามเครื่องเห็นข้อมูลเดียวกันทันที (Firebase)

## เทคโนโลยี (ฟรีทั้งหมด)

| ส่วน | ใช้ |
|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS |
| Auth + ฐานข้อมูล | Firebase Auth + Cloud Firestore (Spark ฟรี) |
| Push | Firebase Cloud Messaging + Service Worker |
| Hosting | Vercel Hobby (ฟรี) หรือ Firebase Hosting |

---

## 1) ตั้งค่า Firebase (ฟรี ~5 นาที) 🚀

1. เข้า https://console.firebase.google.com → **Add project** (ตั้งชื่ออะไรก็ได้ เช่น `organiser`)
2. **Firestore Database** → Create database → เริ่มแบบ **Production mode** → เลือก location ใกล้ไทย เช่น `asia-southeast1`
3. **Authentication** → **Sign-in method** → เปิด **Email/Password** และ **Google**
4. **Project settings → Your apps → Web app (`</>`)** → คัดลอกค่า 6 ตัว (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
5. **Project settings → Cloud Messaging → Web configuration → Web Push certificates** → Generate key pair → คัดลอก **VAPID key**
6. **Project settings → Service accounts → Generate new private key** → ได้ JSON → คัดลอกค่า `client_email` และ `private_key` (ทั้งบรรทัดที่มี `-----BEGIN PRIVATE KEY-----`)

> ขั้นที่ 6 มีไว้เพื่อให้ push notification ทำงาน **ตอนปิดแอป** (Vercel ส่งผ่าน cron) ถ้าอยากได้แค่ตอนเปิดแอป ข้ามได้

### ใส่ค่าลงใน `.env.local`

```bash
copy .env.local.example .env.local   # Windows
# หรือ: cp .env.local.example .env.local
```

แล้วกรอกค่าให้ครบตามข้างบน (private key ใส่ได้โดยเอาเครื่องหมาย `\n` → เวลาก็อปจาก JSON ไม่ต้องจัดบรรทัดใหม่)

### ตั้ง Security Rules

เปิด **Firestore → Rules** แล้วแทนที่ด้วยไฟล์ `firestore.rules` ในโปรเจกต์ แล้วกด **Publish**

### เปิดใช้งาน 🔥

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 → สมัครบัญชี → เริ่มใช้งาน

> ⚠️ push notification ทำงานผ่าน HTTPS/localhost เท่านั้น ตอน dev บน `localhost` บังคับได้ตามปกติ

---

## 2) Deploy ฟรีบน Vercel 🚀

1. กด **New Project** ที่ https://vercel.com → import git repo นี้ (หรือ drag & drop โฟลเดอร์)
2. Framework จะเป็น **Next.js** อัตโนมัติ
3. ไป **Settings → Environment Variables** เพิ่มค่าทั้งหมดจาก `.env.local` (รวม `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `CRON_SECRET`)
4. Deploy → ได้ HTTPS URL

### เปิด cron ส่งเตือนอัตโนมัติ (ฟรี)

- ไฟล์ `vercel.json` มี Cron อยู่แล้ว: ทุกวัน **07:30 (ตามเวลาไทย)** จะส่ง push ให้ทุกคนที่งานใกล้ deadline
- ไป **Settings → Cron Jobs** แล้วเปิด/สร้างด้วย path:
  ```
  /api/reminders?secret=<CRON_SECRET ที่ตั้งไว้>
  ```
  (ตั้งเป็น daily เวลา `0 1 * * *` = 01:00 UTC)

---

## 3) ทดสอบ push

1. กดกริ่ง 🔔 (มุมขวาบนในมือถือ / ข้างชื่อในคอม) → **เปิดการแจ้งเตือน**
2. กด **ส่ง push ทดสอบ** → ควรเห็น notification ปรากฏ (แม้ปิดแท็บ)

---

## โครงสร้างโปรเจกต์

```
app/
  page.tsx            # Dashboard (countdown + วันนี้ + งานด่วน + reading)
  login/page.tsx      # ล็อกอิน (Email/Password + Google)
  calendar/page.tsx   # ปฏิทินรายเดือน
  tasks/page.tsx      # งาน + สีตามความด่วน
  notes/page.tsx      # โน้ต
  reading/page.tsx    # ติดตามการอ่าน
  api/reminders/route.ts        # ส่ง push (Vercel Cron + ทดสอบ)
  firebase-messaging-sw/route.ts# Service worker (FCM)
lib/
  types.ts, firebase.ts, auth.tsx, db.ts, categories.ts,
  urgency.ts, dates.ts, reading.ts, notifications.ts, server.ts, api.ts
components/
  AppShell, ui, Modal, EventModal, TaskModal, NoteEditor, ReadingEditor, ...
```

- `lib/urgency.ts` — กฎสีความด่วน (ไม่ได้กำหนด/เขียว/เหลือง/ส้ม/แดง/เลยกำหนด)
- `lib/reading.ts` — คำนวณ % และสถานะ “ตามหลัง”
- `firestore.rules` — user อ่าน/เขียนข้อมูลตัวเองคนเดียว
- `scripts/gen-icons.mjs` — สร้างไอคอน PNG ใหม่ (แก้สีได้แล้ว `node scripts/gen-icons.mjs`)

---

## FAQ

**กี่ผู้ใช้ได้ฟรี?** Firebase Spark: 50k อ่าน/วัน (data เก็บ <500MB), 50k ผู้ใช้ Auth/เดือน, Vercel Hobby ใช้ได้เองแน่นอน

**อยาก host เองบน Firebase Hosting แทน Vercel?** ได้ — แต่ push ตอนปิดแอปต้องมี server ยิงข้อความ (ในโปรเจกต์นี้คือ Vercel cron + `/api/reminders`) ถ้าใช้ Firebase Hosting อย่างเดียว จะได้แค่แจ้งตอนหน้าแอปเปิด

**ล็อกอินจากเครื่องอื่นเห็นข้อมูลมั้ย?** เห็นทันที เพราะทุกอย่างเก็บใน Firestore (ไม่ใช้ localStorage)