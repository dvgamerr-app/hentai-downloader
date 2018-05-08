# Installation Openssl windows

- Download `OpenSSL`(http://gnuwin32.sourceforge.net/packages/openssl.htm)
- Config Env
```ini
Path=C:\Program Files (x86)\GnuWin32\bin
OPENSSL_CONF=C:\Program Files (x86)\GnuWin32\share\openssl.cnf
```
- `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 7`
