# ⚡ Prompt Engine Pro

AI Chat Cleanup & Auto-Response Generator untuk UMKM Indonesia.

## Fitur
- ✨ Membersihkan & merapikan chat WhatsApp/IG menjadi profesional
- 📋 Merangkum percakapan jadi poin-poin
- 🎭 Mendeteksi emosi customer (marah, ragu, ingin diskon, dll)
- 💬 Membuat 3 versi balasan otomatis (formal / semi-formal / santai)
- 🔒 3 alternatif closing yang mendorong penjualan
- ⚡ Multi-model AI parallel via OpenRouter (9 model, fallback otomatis)

## Tech Stack
- **Frontend**: HTML + CSS + Vanilla JS → GitHub Pages
- **Backend**: Vercel Serverless (`api/generate.js`) — Node 18 CommonJS
- **AI**: OpenRouter Multi-Model (Promise.any parallel, timeout 10s per model)

---

## Deploy Step-by-Step

### LANGKAH 1 — Daftar OpenRouter & Dapatkan API Key
1. Buka https://openrouter.ai → Sign Up
2. Buka https://openrouter.ai/keys → Create Key
3. Salin key (format: `sk-or-v1-xxxx`)

### LANGKAH 2 — Deploy Backend ke Vercel

1. Push repo ke GitHub:
```bash
git init
git add .
git commit -m "init: Prompt Engine Pro"
git remote add origin https://github.com/USERNAME/prompt-engine-pro.git
git push -u origin main
```

2. Buka https://vercel.com → New Project → Import repo ini

3. Di halaman Vercel **SEBELUM klik Deploy**, tambahkan Environment Variable:
   - **Key**: `OPENROUTER_API_KEY`
   - **Value**: `sk-or-v1-xxxxxxxx` (API key dari step 1)

4. Klik Deploy. Tunggu sampai selesai.

5. Catat URL Vercel kamu — contoh: `https://prompt-engine-pro-abc123.vercel.app`

> **Note Vercel Plan**: `maxDuration: 10` kompatibel dengan Vercel **Hobby (Free)** plan.
> Jika pakai Pro plan, boleh dinaikkan ke 60 di `vercel.json`.

### LANGKAH 3 — Update API_URL di app.js

Buka `app.js` baris pertama, ganti:
```js
const API_URL = 'GANTI_DENGAN_URL_VERCEL_KAMU/api/generate';
```
Menjadi:
```js
const API_URL = 'https://prompt-engine-pro-abc123.vercel.app/api/generate';
```
(Sesuaikan dengan URL Vercel kamu dari Langkah 2)

### LANGKAH 4 — Commit & Push Perubahan
```bash
git add app.js
git commit -m "fix: set Vercel API URL"
git push
```

### LANGKAH 5 — Aktifkan GitHub Pages
1. Buka repo di GitHub → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → folder: `/ (root)` → Save
4. Tunggu ~1 menit → akses di `https://USERNAME.github.io/prompt-engine-pro/`

---

## Testing Lokal dengan Vercel CLI

```bash
npm i -g vercel
vercel dev
```

Di `app.js`, gunakan:
```js
const API_URL = '/api/generate';
```

---

## Struktur File
```
prompt-engine-pro/
├── index.html          # Frontend utama
├── style.css           # Dark blue modern UI
├── app.js              # Frontend logic + fetch + copy
├── vercel.json         # Vercel config (Hobby-compatible)
├── README.md           # Panduan deploy ini
└── api/
    └── generate.js     # Serverless API — CommonJS, Node 18
```

## Models (Parallel, Promise.any)
```
nvidia/nemotron-3-super-120b-a12b:free
arcee-ai/trinity-large-preview:free
z-ai/glm-4.5-air:free
openai/gpt-oss-120b:free
nvidia/nemotron-3-nano-30b-a3b:free
minimax/minimax-m2.5:free
google/gemma-4-31b-it:free
qwen/qwen3-coder:free
openrouter/auto
```
