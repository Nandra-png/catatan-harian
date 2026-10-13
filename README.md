# catatan-harian

ini projek saya yang kedua setelah yang shortlink, saya bikin api catatan pribadi, jadi bisa daftar akun terus nyimpen catatan sendiri, awalnya sih cuma pengen bisa nulis catatan yang bisa diakses dari mana aja, soalnya kalo di notes hp gampang ilang

terus saya bikin versi apinya dulu, nanti kalo sempet baru bikin tampilannya

## isinya apa

pake express sama sqlite, terus ada login pake token

simpennya json biasa di folder data sih sebenernya, hehe saya belum pake database beneran soalnya belom paham

eh iya passwordnya saya hash dulu pake bcrypt, soalnya kata dosen saya jangan pernah nyimpen password apa adanya, jadi walaupun ini cuma buat belajar saya benerin dari awal

## cara jalanin

```
npm install
```

terus

```
npm start
```

jalan di port 3000

## endpointnya

daftar dulu

```
curl -X POST http://localhost:3000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"rahasia123\"}"
```

masuk

```
curl -X POST http://localhost:3000/masuk -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"rahasia123\"}"
```

nanti dikasih token, simpen, terus dipake buat endpoint yang lain

bikin catatan

```
curl -X POST http://localhost:3000/catatan -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d "{\"judul\":\"belanja\",\"isi\":\"beli indomie\"}"
```

liat semua catatan

```
curl http://localhost:3000/catatan -H "Authorization: Bearer <token>"
```

edit

```
curl -X PUT http://localhost:3000/catatan/1 -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d "{\"judul\":\"belanja\",\"isi\":\"beli indomie sama telur\"}"
```

hapus

```
curl -X DELETE http://localhost:3000/catatan/1 -H "Authorization: Bearer <token>"
```

## yang saya perhatiin

katanya catatan cuma boleh diliat sama yang punya, jadi tiap kali ada yang mau edit atau hapus saya cek dulu ini catatan punya dia apa bukan, saya sempet lupa bikin ini di awal terus sadar kalo gak dicek orang bisa hapus catatan orang lain cuma dengan ganti angkanya aja

terus soal password tadi, saya hash pake bcrypt, jadi walaupun ada yang bisa liat filenya dia gak bisa tau password aslinya

querynya saya pake tanda tanya, bukan digabung gitu, kata dosen saya biar gak bisa diisi apa apa

## yang belum saya kerjain

- belum ada tampilan webnya, cuma api doang
- datanya masih di file json, jadi kalo rame kayaknya bakal lambat
- belum ada reset password
- belum ada batas berapa kali boleh login, jadi orang bisa coba coba terus
- token kalo expired harus login lagi, belom ada refresh

## yang saya pelajarin

yang paling saya inget itu pas saya lupa cek pemilik catatan, saya baru sadar pas iseng nyoba ganti angka di urlnya terus ternyata bisa liat catatan orang lain, dari situ saya ngerti kenapa hal yang keliatan sepele bisa jadi masalah

terus saya juga baru ngerti kenapa password gak boleh disimpen apa adanya, walaupun keliatannya cuma file di laptop sendiri

masih belajar, mohon dikoreksi kalo ada yang salah
