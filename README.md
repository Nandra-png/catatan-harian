# catatan-harian

Personal notes API. Register, login, CRUD notes. Scoped to the owner.

```
npm install
npm start
```

Port 3000.

## Endpoints

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

Everything except `/daftar` and `/masuk` needs `Authorization: Bearer <token>`.

## How it works

Passwords hashed with bcrypt. JWT expires in 1 day.

Every edit and delete checks the note's `userId` against the logged-in user. Mismatch returns 404, not 403, so you can't tell whether the note exists.

Queries use `?` placeholders, no string concatenation.

Data is stored as JSON files under `data/`.

## Test

```bash
curl -X POST http://localhost:3000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"rahasia123\"}"
```

```bash
curl -X POST http://localhost:3000/catatan -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d "{\"judul\":\"belanja\",\"isi\":\"indomie\"}"
```

Log in as a different account and hit `/catatan/1` owned by budi. Returns 404.

## Todo

- API only, no web UI
- JSON files, will not hold up under load
- no password reset
- no login rate limit
- no refresh tokens
