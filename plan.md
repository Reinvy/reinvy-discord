# 🗺️ reinvy-discord — Implementation Plan

> **Tipe:** Interface Project — Discord Bot Adapter  
> **Posisi:** Depends on `@reinvy/sdk`. TIDAK langsung ke Core.  
> **Referensi:** [Root plan.md](../plan.md) | [PRD](prd.md)

---

## Status Progres

| Fase | Deskripsi                                    | Status         |
| ---- | -------------------------------------------- | -------------- |
| 8    | Bot Init + `/chat` command                   | ⬜ Not Started |
| 9    | Full commands: `/reset`, `/config`, `/usage` | ⬜ Not Started |

---

## Prerequisites

- `reinvy-core` selesai minimal Fase 4 (untuk Fase 8) atau Fase 6 (untuk Fase 9)
- `reinvy-sdk` selesai Fase 7 dan sudah di-`npm link`

---

## Fase 8 — Bot Init + `/chat`

**Test saat selesai:** Bot muncul online di Discord → ketik `/chat halo!` → bot reply dengan embed Discord berisi AI response

### Struktur Folder Target

```
reinvy-discord/
├── src/
│   ├── bot/
│   │   ├── index.js
│   │   ├── events/
│   │   │   ├── ready.js
│   │   │   └── interactionCreate.js
│   │   └── commands/
│   │       └── chat.command.js
│   ├── adapters/
│   │   └── reinvy.adapter.js
│   ├── formatters/
│   │   └── discord.formatter.js
│   └── config/
│       └── config.js
├── app.js
├── Dockerfile
├── .env.example
└── package.json
```

### Checklist

#### Setup

- [ ] Hapus express-generator scaffold (bin/, public/, routes/ — **simpan app.js, update nanti**)
- [ ] Update `package.json`:

  ```json
  {
    "name": "reinvy-discord",
    "version": "1.0.0",
    "scripts": {
      "start": "node app.js",
      "dev": "nodemon app.js"
    },
    "dependencies": {
      "discord.js": "^14.0.0",
      "@reinvy/sdk": "file:../reinvy-sdk",
      "dotenv": "^16.0.0",
      "winston": "^3.0.0",
      "zod": "^3.0.0"
    },
    "devDependencies": {
      "nodemon": "^3.0.0"
    }
  }
  ```

- [ ] `.env.example`:

  ```
  DISCORD_TOKEN=
  DISCORD_CLIENT_ID=
  DISCORD_GUILD_ID=          # Opsional, untuk dev: restrict slash commands ke satu guild
  REINVY_CORE_URL=http://localhost:3000
  REINVY_SERVICE_KEY=disc_devkey123
  NODE_ENV=development
  ```

- [ ] `src/config/config.js` — Zod validation:
  ```js
  // Required: DISCORD_TOKEN, DISCORD_CLIENT_ID, REINVY_CORE_URL, REINVY_SERVICE_KEY
  // Optional: DISCORD_GUILD_ID, NODE_ENV
  ```

#### Adapter

- [ ] `src/adapters/reinvy.adapter.js`:
  ```js
  const { ReinvyClient } = require("@reinvy/sdk");
  const client = new ReinvyClient({
    baseUrl: config.REINVY_CORE_URL,
    serviceKey: config.REINVY_SERVICE_KEY,
    source: "discord",
  });
  module.exports = client;
  ```

#### Formatter

- [ ] `src/formatters/discord.formatter.js`:
  ```js
  // formatChatReply({ reply, model_used, tokens }) → Discord EmbedBuilder
  //   title: "Reinvy AI"
  //   description: reply (max 4096 chars, truncate dengan "..." jika lebih)
  //   footer: `Model: ${model_used} | Tokens: ${tokens.total}`
  //   color: 0x5865F2 (Discord Blurple)
  //
  // formatError(error) → EmbedBuilder warna merah dengan pesan error user-friendly
  ```

#### Slash Command Definition

- [ ] `src/bot/commands/chat.command.js`:
  ```js
  // Command definition (SlashCommandBuilder):
  //   name: 'chat'
  //   description: 'Chat dengan Reinvy AI'
  //   option: message (string, required)
  //
  // Execute handler:
  //   1. await interaction.deferReply()
  //   2. const userId = `discord_${interaction.user.id}`
  //   3. const res = await reinvyAdapter.chat({ user_id: userId, message })
  //   4. const embed = formatter.formatChatReply(res.data)
  //   5. await interaction.editReply({ embeds: [embed] })
  //   6. try/catch → formatError → editReply dengan error embed
  ```

#### Deploy Slash Commands (Script)

- [ ] `scripts/deploy-commands.js`:
  ```js
  // Pakai @discordjs/rest dan Routes untuk register slash commands ke Discord API
  // Jika DISCORD_GUILD_ID di-set: register ke guild saja (instant update, dev)
  // Jika tidak: register global (butuh ~1 jam propagasi, production)
  // Run: node scripts/deploy-commands.js
  ```

#### Bot Events

- [ ] `src/bot/events/ready.js`:

  ```js
  // Event: 'ready' (once)
  // Log: `Bot ${client.user.tag} online!`
  // Set presence: "Listening | /chat"
  ```

- [ ] `src/bot/events/interactionCreate.js`:
  ```js
  // Event: 'interactionCreate'
  // Guard: if (!interaction.isChatInputCommand()) return
  // Route ke command handler berdasarkan interaction.commandName
  // Catch all errors → log + fallback reply
  ```

#### Bot Init

- [ ] `src/bot/index.js`:
  ```js
  // Buat Discord Client dengan intents: Guilds, GuildMessages, DirectMessages
  // Register event handlers: ready, interactionCreate
  // Export client
  ```

#### App Entry Point

- [ ] `app.js` (ganti konten lama):
  ```js
  require("dotenv").config();
  const config = require("./src/config/config");
  const bot = require("./src/bot/index");
  bot.login(config.DISCORD_TOKEN);
  ```

#### Dockerfile

- [ ] `Dockerfile`:
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --omit=dev
  COPY . .
  CMD ["node", "app.js"]
  ```

---

## Fase 9 — Full Commands

**Test saat selesai:** Semua 4 commands bekerja di Discord:

- `/reset` → memori terhapus, konfirmasi embed hijau
- `/config model gpt-4o` → model berubah, konfirmasi
- `/config personality expert` → personality berubah
- `/usage` → embed statistik token bulan ini

### Checklist

- [ ] `src/bot/commands/reset.command.js`:

  ```js
  // name: 'reset', description: 'Reset conversation memory'
  // Execute: deferReply → deleteMemory(userId) → editReply embed hijau "Memory cleared!"
  ```

- [ ] `src/bot/commands/config.command.js`:

  ```js
  // name: 'config'
  // Subcommands:
  //   model <model_name>     → updateConfig({ model })
  //   personality <type>     → updateConfig({ personality })
  //   show                   → getConfig() → embed info
  // Execute: deferReply → call adapter → editReply embed konfirmasi
  ```

- [ ] `src/bot/commands/usage.command.js`:

  ```js
  // name: 'usage', description: 'Lihat penggunaan token bulan ini'
  // Execute: deferReply → getUsage(userId) → editReply embed:
  //   field "Total Requests": total_requests
  //   field "Total Tokens": total_tokens
  //   field "Estimated Cost": $estimated_cost_usd
  //   field "Period": period
  ```

- [ ] `src/bot/events/messageCreate.js`:

  ```js
  // Opsional: handle DM langsung (tanpa /chat prefix)
  // Guard: if (message.author.bot) return
  // Guard: if (!message.channel.isDMBased()) return (hanya DM)
  // Kirim typing indicator → chat → reply dengan embed
  ```

- [ ] Update `interactionCreate.js` — tambahkan route ke reset, config, usage handlers

- [ ] Update `scripts/deploy-commands.js` — register semua 4 commands

- [ ] Update `discord.formatter.js`:
  ```js
  // formatUsage({ total_requests, total_tokens, estimated_cost_usd, period }) → EmbedBuilder
  // formatConfig(config) → EmbedBuilder
  // formatSuccess(message) → EmbedBuilder warna hijau
  ```

---

## Catatan Platform-Specific

### Discord User ID → reinvy user_id mapping

- Format: `discord_${interaction.user.id}`
- Konsisten di semua handlers — jangan gunakan username (bisa berubah)

### Deferred Reply

- Selalu gunakan `interaction.deferReply()` sebelum API call ke Core
- AI response bisa memakan waktu 3-10 detik — tanpa defer, Discord timeout 3s

### Rate Limit Discord

- Discord punya rate limit sendiri. Jangan spam API Discord.
- Gunakan `interaction.editReply()` bukan `interaction.reply()` setelah `deferReply()`

### Slash Command Update

- Setelah menambah/ubah command, WAJIB jalankan ulang `node scripts/deploy-commands.js`
- Di dev: pakai guild-specific commands (instant update)
- Di prod: pakai global commands (propagasi ~1 jam)
