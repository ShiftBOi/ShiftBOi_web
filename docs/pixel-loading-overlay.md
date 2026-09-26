# Shift motion intro

อินโทรแบบพรีเซนเทชันมินิมอลของ ShiftBOi ใช้แผงม่วงสี่ชั้น ตัวอักษรที่ทยอยเลื่อนขึ้น และสี่เหลี่ยมที่ประกอบเป็นโลโก้ ก่อนแผงสีเลื่อนผ่านเพื่อเผยหน้าเว็บ ไม่มีตัวละครหรือแถบความคืบหน้า

## ดูและแก้ดีไซน์

ขณะรัน `npm run dev` เปิด `/dev/loading` เพื่อดูค้างไว้ คลิกที่อินโทรหรือกด **Escape** เพื่อดูจังหวะเปิดหน้า และกด **Replay intro** เพื่อเล่นซ้ำ เส้นทางนี้แสดง 404 ใน production

- `src/components/web/site-loading-overlay.module.css`: สี ขนาด และ keyframes ทั้งหมด แก้ `curtain-in` / `curtain-out` สำหรับแผงสี, `mark-join` สำหรับสี่เหลี่ยม และ `type-enter` สำหรับตัวอักษร
- `src/components/web/site-loading-overlay.tsx`: ข้อความผ่าน props `label` และ `eyebrow`, การข้ามอินโทร และโครงสร้าง UI
- `src/components/web/site-loading-timing.ts`: เวลาแสดงขั้นต่ำ `INTRO_MIN_MS` (2,300ms), เวลารอสูงสุด `INTRO_MAX_MS` (5,500ms), เวลาเปิดหน้า `INTRO_EXIT_MS` (1,050ms) ซึ่งส่งเข้า CSS โดยตรง หากลดเวลาเปิดหน้ามาก ให้ลด stagger ของแต่ละ panel ตามด้วย

## พฤติกรรม

ใช้แทน overlay เดิมทุกครั้งที่เปิดหน้าแรกแบบ full page load / refresh และใช้ภาพเดียวกันใน Next.js `loading.tsx` ระหว่างรอ route

Boot intro รอ window load และฟอนต์พร้อม โดยมีเวลารอสูงสุดป้องกันไฟล์ภายนอกทำให้ค้าง ผู้ใช้ข้ามได้ด้วยการคลิกที่อินโทรหรือกด Escape / Enter / Space ใช้ HTML/CSS ที่แก้เองได้ทั้งหมด ไม่มี dependency หรือไฟล์วิดีโอเพิ่มเติม

ระหว่าง intro พื้นหลังไม่รับ keyboard focus และคืนค่าเมื่อปิด รองรับหน้าจอเล็กและแนวนอน เคารพ `prefers-reduced-motion`; ผู้ใช้ที่ลด motion จะไม่ถูกบังคับรอ animation ขั้นต่ำ หากปิด JavaScript จะซ่อน splash เพื่อให้เข้าถึงเนื้อหาได้
