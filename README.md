# Hentai Downloader `1.0.0`
## Overview
โปรแกรมดาวน์โหลดมังงะจาก `e-hentai.org` และ `exhentai.org (features)` สามารถเพิ่มคิวได้เรื่อยๆ ตามต้องการ แต่ระบบจะเริ่มดาวน์โหลดทีละเรื่องที่ละไฟล์เท่านั้น ไม่สามารถสร้าง thread ขึ้นมาแบ่งการดาวน์โหลดได้ ซึ่งเป็นข้อจำกัดของตัวเว็บไซต์เอง ดาวน์โหลดได้ที่ [HentaiDownloader](https://github.com/unhax/ghentai-downloader/releases)

#### How to use
- copy link จากเว็บ `e-hentai.org` ใส่ในช่อง url แล้วกด Enter
- ถ้าจะเพิ่ม Queue ก็แค่ copy link มาใส่เพิ่ม
- กดปุ่ม folder เพื่อเลือก path ที่ต้องการจะ save ไฟล์ลง 
- กดปุ่ม download เพื่อเริ่มดาวน์โหลดมังงะ
- **คำเตือน** ไม่ควรเปิดเว็บ `e-hentai.org` ระหว่างที่ดาวน์โหลดมังงะเพราะจะทำให้รูปบางรูปอาจจะโหลดไม่สำเร็จ

#### Features
- [x] ดาวน์โหลดมังงะจาก `e-hentai.org` ได้จาก link
- [x] ดาวน์โหลดแบบต่อเนื่องได้
- [ ] ดาวน์โหลดมังงะจาก `exhentai.org` ได้จาก link
- [ ] เพิ่ม login `forums.e-hentai.org`
- [ ] auto-update โปรแกรม

![app][app-items]

### โปรแกรมเวอชั่นก่อนหน้านี้
ซึ่งถูกพัฒนาด้วยภาษา C# และยังพบข้อจำกัดในการเข้าถึงข้อมูลผ่าน protocal https อยู่หลายส่วน

![app][app-c#]

[app-c#]: https://raw.githubusercontent.com/unhax/ghentai-downloader/master/docs/sample-app.jpg
[app-items]: https://raw.githubusercontent.com/unhax/ghentai-downloader/master/docs/app-items.png
