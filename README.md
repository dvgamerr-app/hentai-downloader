# hentai-downloader `1.0`
## Overview
โปรแกรมดาวน์โหลดมังงะจาก `e-hentai.org` เท่านั้น สามารถดาวน์โหลดได้ทีละ 1 เรื่อง แล้วเก็บอยู่ในโฟลเดอร์ `downloader` ตามชื่อเรื่องนั้นๆ 

### โปรแกรมเก่า
โปรแกรมเก่าที่เขียนด้วยภาษา C#

![app][app-c#]

### Electron-App
ดาวน์โหลดได้ที่ [e-hentai downloader](https://github.com/unhax/ghentai-downloader/releases)

#### How to use
- copy link จากเว็บ `e-hentai.org` ใส่ในช่อง url แล้วกด Enter
- ถ้าจะเพิ่ม Queue ก็แค่ copy link มาใส่เพิ่ม
- กดปุ่ม folder เพื่อเลือก path ที่ต้องการจะ save ไฟล์ลง 
- กดปุ่ม download เพื่อเริ่มดาวน์โหลดมังงะ
- **คำเตือน** ไม่ควรเปิดเว็บ `e-hentai.org` ระหว่างที่ดาวน์โหลดมังงะเพราะจะทำให้รูปบางรูปอาจจะโหลดไม่สำเร็จ

#### Features
- [x] ดาวน์โหลดมังงะจาก e-hentai ได้จาก link
- [x] ดาวน์โหลดแบบต่อเนื่องได้
- [ ] auto-update โปรแกรม

![app][app-new]

[app-c#]: https://raw.githubusercontent.com/unhax/ghentai-downloader/master/docs/sample-app.jpg
[app-new]: https://raw.githubusercontent.com/unhax/ghentai-downloader/master/docs/new-app.png
