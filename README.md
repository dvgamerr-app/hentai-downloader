# Hentai Downloader `1.0.1`
## Overview
โปรแกรมดาวน์โหลดมังงะจาก `e-hentai.org` และ `exhentai.org (features)` สามารถเพิ่มคิวได้เรื่อยๆ ตามต้องการ แต่ระบบจะเริ่มดาวน์โหลดทีละเรื่องที่ละไฟล์เท่านั้น ไม่สามารถสร้าง thread ขึ้นมาแบ่งการดาวน์โหลดได้ ซึ่งเป็นข้อจำกัดของตัวเว็บไซต์เอง ดาวน์โหลดได้ที่ [HentaiDownloader](https://github.com/unhax/ghentai-downloader/releases)

![Icon][icons]

#### How to use
- copy link จากเว็บ `e-hentai.org` ใส่ในช่อง url แล้วกด Enter
- ถ้าจะเพิ่ม Queue ก็แค่ copy link มาใส่เพิ่ม
- กดปุ่ม folder เพื่อเลือก path ที่ต้องการจะ save ไฟล์ลง 
- กดปุ่ม download เพื่อเริ่มดาวน์โหลดมังงะ
- **คำเตือน** ไม่ควรเปิดเว็บ `e-hentai.org` ระหว่างที่ดาวน์โหลดมังงะเพราะจะทำให้รูปบางรูปอาจจะโหลดไม่สำเร็จ

#### Features
- [x] queue list downloading.
- [ ] history list
- [ ] initital manga progress and current manga downloading list color
- [ ] config directory save
- [ ] auto-update version
- [ ] `exhentai.org` download manga.

![app][app-items]

[icons]: https://raw.githubusercontent.com/unhax/ghentai-downloader/master/build/icons/256x256.png
[app-items]: https://raw.githubusercontent.com/unhax/ghentai-downloader/master/docs/app-items.png
