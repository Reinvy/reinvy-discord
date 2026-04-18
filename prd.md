# 📄 PRD: `reinvy-discord`

> **Bagian dari:** Reinvy AI Systems Ecosystem
> **Tipe:** Interface Project — Discord Bot Adapter
> **Versi:** 2.0.0
> **Last Updated:** April 2026
> **Referensi Utama:** Lihat root [`prd.md`](../prd.md) §6 untuk konteks ekosistem lengkap.

---

## 1. Repo Overview

`reinvy-discord` adalah **tangan** ekosistem Reinvy yang menjangkau platform Discord. Repo ini bertanggung jawab penuh atas interaksi bot dengan user Discord — menerima command, meneruskan ke Core via SDK, dan memformat respons kembali ke Discord.

### Posisi dalam Ekosistem

```
User Discord
    │
    │  Slash Commands / Messages
    ▼
reinvy-discord  (Bot Adapter)
    │
    │  @reinvy/sdk  (HTTP ke reinvy-core)
    ▼
reinvy-core  (AI Engine — proses semua logika AI)
```

**Dependency position:**

- **Depends on:** `@reinvy/sdk` (versi `^1.0.0`)
- **Does NOT depend on:** `reinvy-core` secara langsung, database, Redis

---

## 2. Scope

### Yang TERMASUK Tanggung Jawab Repo Ini

| Area                               | Detail                                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| Discord Bot Initialization         | Login, register slash commands, event listeners                    |
| Slash Command Handling             | `/chat`, `/reset`, `/config`, `/usage`                             |
| Direct Message Handling            | Respon pesan langsung (opsional, jika diaktifkan)                  |
| Input Formatting (Discord → Core)  | Ekstrak `user_id` dari Discord user, map ke format SDK             |
| Output Formatting (Core → Discord) | Format reply menjadi Discord embed atau plain text                 |
| Error Messaging ke User            | Terjemahkan SDK errors menjadi pesan yang ramah untuk user Discord |
| Platform-specific UX               | Typing indicator, deferred reply untuk operasi lambat              |

### Yang TIDAK Termasuk Tanggung Jawab Repo Ini

| Yang Dikecualikan                           | Keterangan                                  |
| ------------------------------------------- | ------------------------------------------- |
| Logika AI, pemilihan model, prompt building | Tanggung jawab `reinvy-core`                |
| Penyimpanan conversation history            | Tanggung jawab `reinvy-core` via PostgreSQL |
| Akses langsung ke database atau Redis       | ❌ Dilarang keras                           |
| Public REST API endpoints                   | Tanggung jawab `reinvy-gateway`             |
| Konfigurasi LLM provider                    | Tanggung jawab `reinvy-core`                |

---

## 3. Tech Stack

| Layer            | Teknologi      | Keterangan                                       |
| ---------------- | -------------- | ------------------------------------------------ |
| Runtime          | Node.js 20+    |                                                  |
| Discord Library  | discord.js v14 | Slash commands, embeds, event system             |
| SDK              | @reinvy/sdk    | Komunikasi ke reinvy-core                        |
| Framework        | Express.js     | Opsional: untuk endpoint internal (health check) |
| Containerization | Docker         |                                                  |

---

## 4. Folder Structure

```
reinvy-discord/
├── src/
│   ├── bot/
│   │   ├── index.js                   # Discord client init, login, event register
│   │   ├── events/
│   │   │   ├── ready.js               # Event: bot online — log info, set presence
│   │   │   ├── messageCreate.js       # Event: pesan biasa (non-command)
│   │   │   └── interactionCreate.js   # Event: dispatch slash command ke handler
│   │   └── commands/
│   │       ├── chat.command.js        # /chat [message]
│   │       ├── reset.command.js       # /reset
│   │       ├── config.command.js      # /config set model/personality
│   │       └── usage.command.js       # /usage
│   ├── adapters/
│   │   └── reinvy.adapter.js          # Inisialisasi ReinvyClient, wrapper method
│   ├── formatters/
│   │   └── discord.formatter.js       # Format reply Core → Discord embed/text
│   └── config/
│       └── config.js                  # Load & validasi ENV variables
├── app.js
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

---

## 5. Discord Commands

### Command Overview

| Command                      | Deskripsi                                  | Cooldown |
| ---------------------------- | ------------------------------------------ | -------- |
| `/chat [message]`            | Kirim pesan ke AI                          | 3 detik  |
| `/reset`                     | Reset conversation memory                  | 10 detik |
| `/config model [model]`      | Ganti model AI yang digunakan              | 5 detik  |
| `/config personality [type]` | Ganti personality AI                       | 5 detik  |
| `/usage`                     | Lihat statistik penggunaan token bulan ini | 10 detik |

---

### `/chat [message]`

**Behavior:**

1. Tampilkan typing indicator (deferred reply)
2. Panggil `client.chat({ user_id, message })`
3. Format reply dengan `discord.formatter.js`
4. Kirim sebagai Discord embed (atau plain text jika reply pendek)

**`user_id` mapping:**

```
Discord User ID: 123456789012345678
→ reinvy user_id: "discord_123456789012345678"
```

Format `discord_<discord_user_id>` memastikan tidak ada collision dengan user dari platform lain.

**Contoh output (embed):**

- Title: nama personality yang aktif (e.g., "Reinvy — Friendly Mode")
- Description: reply dari AI
- Footer: `Tokens: 570 • Model: openai/gpt-4o`

---

### `/reset`

**Behavior:**

1. Kirim konfirmasi ke user ("Apakah kamu yakin ingin mereset memory?") — dengan tombol Yes/No
2. Jika user konfirmasi: panggil `client.deleteMemory(user_id)`
3. Kirim pesan sukses

---

### `/config model [model]`

**Behavior:**

1. Validasi `model` — hanya nilai yang dikenali (list dari PRD Core §8.4)
2. Panggil `client.updateConfig(user_id, { model })`
3. Konfirmasi perubahan ke user

**Opsi model yang tersedia (untuk Discord autocomplete):**

- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `anthropic/claude-3-opus`
- `mistral/mistral-7b`

---

### `/config personality [type]`

**Behavior:**

1. Tampilkan dropdown pilihan personality
2. Panggil `client.updateConfig(user_id, { personality })`
3. Konfirmasi perubahan

**Opsi personality:**

| Value      | Label Ditampilkan ke User |
| ---------- | ------------------------- |
| `friendly` | 😊 Friendly               |
| `formal`   | 💼 Formal                 |
| `expert`   | 🧠 Expert                 |
| `concise`  | ⚡ Concise                |

---

### `/usage`

**Behavior:**

1. Panggil `client.getUsage(user_id)`
2. Format sebagai Discord embed dengan field:
   - Total Tokens (bulan ini)
   - Total Requests
   - Estimasi Cost (USD)
   - Periode

---

## 6. Adapters

### `src/adapters/reinvy.adapter.js`

Inisialisasi tunggal `ReinvyClient` yang di-share ke semua command handler:

```js
const { ReinvyClient } = require("@reinvy/sdk");

const client = new ReinvyClient({
  baseUrl: process.env.REINVY_CORE_URL,
  serviceKey: process.env.REINVY_SERVICE_KEY,
  source: "discord",
});

module.exports = client;
```

**User ID Convention:**

```js
function toReinvyUserId(discordUserId) {
  return `discord_${discordUserId}`;
}
```

Konvensi ini harus konsisten di seluruh command handler — jangan hardcode prefix di masing-masing command.

---

## 7. Formatters

### `src/formatters/discord.formatter.js`

Tanggung jawab: transformasi response Core menjadi format Discord yang tepat.

**Aturan formatting:**

| Panjang Reply       | Format Output                            |
| ------------------- | ---------------------------------------- |
| ≤ 200 karakter      | Plain text reply                         |
| 201 – 4000 karakter | Discord Embed                            |
| > 4000 karakter     | Discord Embed + split (multiple message) |

**Embed structure:**

```
[Embed]
Color: sesuai personality (friendly=hijau, formal=biru, expert=ungu, concise=abu)
Description: <reply dari AI>
Footer: "Tokens: {total} • Model: {model_used}"
```

---

## 8. Error Handling Strategy

Setiap error dari SDK harus diterjemahkan ke pesan yang ramah untuk user Discord — **jangan expose error teknis**:

| Error SDK               | Pesan ke User Discord                                     |
| ----------------------- | --------------------------------------------------------- |
| `ReinvyRateLimitError`  | "⏳ Terlalu banyak pesan! Tunggu sebentar ya."            |
| `ReinvyNetworkError`    | "🔌 Reinvy sedang tidak bisa dihubungi. Coba lagi nanti." |
| `ReinvyAuthError`       | "⚙️ Ada masalah konfigurasi bot. Hubungi admin server."   |
| `ReinvyValidationError` | "❌ Pesanmu tidak bisa diproses. Coba ubah kata-katanya." |
| `ReinvyServerError`     | "⚠️ Terjadi kesalahan di server AI. Coba lagi nanti."     |

---

## 9. Security Responsibilities

Tanggung jawab security yang spesifik di `reinvy-discord`:

| Area                     | Implementasi                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| User ID Isolation        | Setiap Discord user punya `user_id` unik dengan prefix `discord_`            |
| No Direct DB Access      | Semua akses data melalui `@reinvy/sdk` — tidak ada koneksi DB langsung       |
| Service Key Protection   | `REINVY_SERVICE_KEY` disimpan di ENV, tidak pernah di-log                    |
| Discord Token Protection | `DISCORD_TOKEN` disimpan di ENV, tidak pernah di-expose ke response          |
| Input Length Validation  | Validasi panjang message sebelum kirim ke SDK (Discord limit: 2000 karakter) |
| Command Cooldown         | Cegah spam dengan cooldown per user per command                              |

---

## 10. Testing Strategy

| Jenis Test       | Target                                              | Tool                   |
| ---------------- | --------------------------------------------------- | ---------------------- |
| Unit Test        | `discord.formatter.js` — semua format case          | Jest                   |
| Unit Test        | Command handler logic (mock SDK)                    | Jest                   |
| Unit Test        | Error handler — pastikan semua SDK error ter-handle | Jest                   |
| Integration Test | Bot events → SDK mock → response format             | Jest + discord.js mock |

**Target coverage:** ≥ 75% untuk semua file di `src/`.

---

## 11. Deployment Notes

```yaml
# Dari docker-compose.yml ekosistem — lihat root prd.md §13.1
reinvy-discord:
  build: ./reinvy-discord
  networks: [reinvy-network]
  restart: unless-stopped
  environment:
    - DISCORD_TOKEN=
    - DISCORD_CLIENT_ID=
    - REINVY_CORE_URL=http://reinvy-core:3000
    - REINVY_SERVICE_KEY=disc_xxx
  depends_on: [reinvy-core]
```

**Catatan Scaling:**

- Untuk server Discord < 2500 guild: single instance cukup
- Untuk > 2500 guild: perlu implementasi Discord sharding (sesuai dokumentasi discord.js)
- Scaling strategy ini tidak mempengaruhi reinvy-core sama sekali

---

## 12. Environment Variables

```env
# Discord Bot
DISCORD_TOKEN=
DISCORD_CLIENT_ID=

# Reinvy Core (via SDK)
REINVY_CORE_URL=http://reinvy-core:3000
REINVY_SERVICE_KEY=disc_xxxxxxxxxxxx

# App
NODE_ENV=production
```

---

## 13. Roadmap Ownership

Fase dari roadmap ekosistem (root `prd.md` §17) yang menjadi tanggung jawab repo ini:

| Fase    | Item                                          | Status     |
| ------- | --------------------------------------------- | ---------- |
| Phase 1 | Setup Discord bot: basic `/chat` command      | ⬜ Todo    |
| Phase 1 | Integrasi dengan reinvy-sdk                   | ⬜ Todo    |
| Phase 1 | Docker setup                                  | ⬜ Todo    |
| Phase 2 | Tambah `/reset`, `/config`, `/usage` commands | ⬜ Todo    |
| Phase 2 | Personality-aware embed formatting            | ⬜ Todo    |
| Phase 3 | Refinement UX Discord (autocomplete, buttons) | ⬜ Todo    |
| Phase 5 | Sharding untuk skala besar                    | 🔜 Planned |
