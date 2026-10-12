<div align="center">

<img src="resources/256x256.png" alt="ไอคอน Hentai Downloader" width="96" />

# Hentai Downloader

**วางลิงก์ กดดาวน์โหลด ได้โฟลเดอร์รูปเรียบร้อย**

โปรแกรมเดสก์ท็อปสำหรับ e-hentai.org และ exhentai.org ที่จัดคิวมังงะให้ ไม่ต้องเปิดเบราว์เซอร์เซฟรูปทีละหน้าอีกต่อไป

[![Stars](https://img.shields.io/github/stars/dvgamerr-app/hentai-downloader?style=for-the-badge&color=18BC9C)](https://github.com/dvgamerr-app/hentai-downloader/stargazers)
[![Latest release](https://img.shields.io/github/v/release/dvgamerr-app/hentai-downloader?style=for-the-badge&color=18BC9C)](https://github.com/dvgamerr-app/hentai-downloader/releases/latest)
[![License](https://img.shields.io/github/license/dvgamerr-app/hentai-downloader?style=for-the-badge&color=18BC9C)](LICENSE)
![Platform](https://img.shields.io/badge/Windows-installer-18BC9C?style=for-the-badge)

[เว็บไซต์](https://dvgamerr.app/hentai-downloader/) · [เริ่มใช้งาน](#เริ่มใช้งาน) · [คู่มือติดตั้ง](docs/install.md) · [English](README.md)

<img src="docs/screenshots/queue.png" alt="คิวดาวน์โหลดที่กำลังโหลดอยู่หนึ่งเรื่อง" width="230" />
<img src="docs/screenshots/history.png" alt="หน้า History แสดงเรื่องที่โหลดเสร็จแล้ว" width="230" />
<img src="docs/screenshots/settings.png" alt="ช่องใส่ cookie สำหรับ exhentai.org" width="230" />

**ถ้าโปรแกรมนี้ช่วยประหยัดเวลาให้คุณ รบกวนกด [⭐ Star](https://github.com/dvgamerr-app/hentai-downloader) ให้หน่อยนะ จะช่วยให้คนอื่นเจอโปรเจกต์นี้ง่ายขึ้น**

</div>

> **18+ เท่านั้น** เว็บที่โปรแกรมเชื่อมต่อมีเนื้อหาสำหรับผู้ใหญ่ กรุณาใช้เมื่ออายุถึงเกณฑ์ตามกฎหมายของประเทศคุณ

## ทำไมต้องใช้

- **จัดคิวก่อน โหลดทีหลัง** วางลิงก์เดียวหรือวางทีละหลายบรรทัด แล้วกดเริ่มครั้งเดียว โปรแกรมไล่โหลดให้ทีละเรื่อง
- **ไม่เสีย Credits/GP** โหลดรูปจากหน้า viewer ปกติ ไม่ใช่ไฟล์ original แบบเสียเงิน
- **รันซ้ำได้อย่างปลอดภัย** ถ้าโหลดมาไม่ครบ ลบไฟล์ที่เสียแล้วกด Download อีกครั้ง หน้าที่มีอยู่แล้วจะถูกข้าม โหลดเฉพาะที่ขาด
- **ไม่ยิงเว็บแรง** โหลดทีละเรื่อง ทีละไฟล์ มี timeout และ retry เป็นข้อจำกัดของเว็บเอง และช่วยลดโอกาสโดนแบน

## ฟีเจอร์

| | ฟีเจอร์ | ทำอะไรได้ |
| --- | --- | --- |
| 📋 | **ตรวจจับ clipboard** | copy ลิงก์มังงะจากที่ไหนก็ได้ โปรแกรมจะจับให้ |
| 📝 | **paste หลายบรรทัด** | วางหลายลิงก์ บรรทัดละเรื่อง เข้าคิวพร้อมกัน |
| 🌐 | **e-hentai + exhentai** | ใช้ได้ทั้งสองเว็บ ส่วน exhentai ใส่ cookie จากเบราว์เซอร์ของคุณเอง |
| 🗂️ | **หนึ่งเรื่องหนึ่งโฟลเดอร์** | บันทึกในโฟลเดอร์ชื่อเดียวกับเรื่อง ตั้งชื่อไฟล์เป็นเลขหน้า |
| 🔁 | **โหลดต่อด้วยการข้ามไฟล์** | หน้าที่มีอยู่แล้วไม่โหลดซ้ำ |
| 🕘 | **History** | เก็บ 200 เรื่องล่าสุด ใหม่สุดก่อน มีปุ่มเปิดโฟลเดอร์ |
| 📌 | **อยู่บนสุดเสมอ** | หน้าต่างเล็ก 600×380 ลอยอยู่บนสุด และมี tray icon |
| ⬆️ | **อัปเดตอัตโนมัติ** | เวอร์ชันที่ติดตั้งจะเช็ก GitHub Releases และถามให้รีสตาร์ทเพื่ออัปเดต |

<details>
<summary>ภาพหน้าจอเพิ่มเติม</summary>

<img src="docs/screenshots/landing.png" alt="หน้าเริ่มต้นพร้อมช่องใส่ URL" width="460" />

</details>

## เริ่มใช้งาน

1. เปิดหน้า [latest release](https://github.com/dvgamerr-app/hentai-downloader/releases/latest) แล้วโหลดไฟล์ `hentai-downloader-<version>-setup.exe`
2. รัน installer จะได้ shortcut บน desktop
3. copy ลิงก์มังงะ เช่น `https://e-hentai.org/g/1234567/abcdef0123/` ไปวางในช่อง URL แล้วกด Enter จะเพิ่มอีกก็วางต่อ หรือวางหลายบรรทัดพร้อมกัน
4. กดปุ่มโฟลเดอร์เพื่อเลือกที่เก็บไฟล์ แล้วกด **Download**

สำหรับ exhentai.org ให้เปิดแผงล็อกอินแล้ววาง cookie ขั้นตอนมีอธิบายในโปรแกรม และเขียนไว้ใน[คู่มือติดตั้ง](docs/install.md)

ตอนนี้ Releases มีเฉพาะตัวติดตั้ง Windows ส่วน macOS และ Linux ให้ build จากซอร์สตามด้านล่าง

## สถาปัตยกรรม

```
 Svelte 5 UI  ──window.api──▶  preload  ──IPC──▶  main process
 (renderer)                                       ├─ ehentai.js  fetch + stream ลงดิสก์
                                                  ├─ history.js  electron-settings
                                                  └─ updater.js  electron-updater
```

ใช้ Electron, Svelte 5, Tailwind CSS 4 รวมด้วย electron-vite และจัดการแพ็กเกจด้วย Bun รูปถูก stream ลงดิสก์โดยตรง ไม่เก็บไว้ใน memory

## สำหรับนักพัฒนา

ต้องมี [Bun](https://bun.sh) 1.3

```bash
bun install --frozen-lockfile
bun run dev            # Electron พร้อม hot reload
bun run build          # bundle main, preload และ renderer
bun run build:win      # ตัวติดตั้ง Windows
bun run build:mac      # macOS dmg
bun run build:linux    # AppImage, snap, deb
```

ยังไม่มี test อัตโนมัติ ก่อนส่งการแก้ไขให้รัน `bunx eslint src` และ `bun run build` รายละเอียดสถาปัตยกรรมอยู่ใน [CLAUDE.md](CLAUDE.md) และ README เดิมฉบับยาวเก็บไว้ที่ [docs/readme-legacy.md](docs/readme-legacy.md)

## สนับสนุนโปรเจกต์

- ⭐ [กด Star บน GitHub](https://github.com/dvgamerr-app/hentai-downloader)
- 🐞 [แจ้งบั๊กหรือขอฟีเจอร์](https://github.com/dvgamerr-app/hentai-downloader/issues)
- 💬 [เข้า Discord](https://discord.com/invite/QDccF497Mw)
- ❤️ [Sponsor บน GitHub](https://github.com/sponsors/dvgamerr)

> คำเตือนจากโปรแกรม: ไม่ควรเปิดเว็บเดียวกันระหว่างที่กำลังดาวน์โหลด เพราะรูปบางรูปอาจโหลดไม่สำเร็จ

## ไลเซนส์และข้อสงวนสิทธิ์

[MIT](LICENSE) โปรเจกต์นี้ไม่มีส่วนเกี่ยวข้องกับ e-hentai.org หรือ exhentai.org ผู้ใช้ต้องรับผิดชอบต่อข้อกำหนดของเว็บและกฎหมายที่เกี่ยวข้องเอง
