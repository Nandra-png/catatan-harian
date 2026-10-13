# catatan-harian

api catatan pribadi, daftar akun, login, crud catatan. cuma bisa akses catatan sendiri

```
npm install
npm start
```

port 3000

## endpoint

```
POST   /daftar              { username, password }
POST   /masuk               { username, password }
GET    /aku
GET    /catatan
GET    /catatan/:id
POST   /catatan             { judul, isi }
PUT    /catatan/:id         { judul, isi }
DELETE /catatan/:id
```

semua kecuali `/daftar` sama `/masuk` butuh header `Authorization: Bearer <token>`

## teknis

password di-hash pake bcrypt, token pake jwt expired 1 hari

tiap edit sama hapus, dicek dulu userId catatannya sama userId yang login, kalo beda dibalikin 404 bukan 403, biar gak keliatan catatannya ada apa gak

query pake `?` bukan concat string

data disimpen di file json folder `data/`

## tes

```bash
curl -X POST http://localhost:3000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"rahasia123\"}"
```

```bash
curl -X POST http://localhost:3000/catatan -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d "{\"judul\":\"belanja\",\"isi\":\"indomie\"}"
```

login akun lain terus coba akses `/catatan/1` punya budi, hasilnya 404

## todo

- belum ada tampilan web, api doang
- data di json, kalo rame bakal lambat
- belum ada reset password
- belum ada limit login
- belum ada refresh token
