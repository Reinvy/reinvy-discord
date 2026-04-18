require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config");
const { registerCommands } = require("./commands/index");
const interactionCreateHandler = require("./handlers/interactionCreate.handler");
const messageCreateHandler = require("./handlers/messageCreate.handler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register handlers
client.on(interactionCreateHandler.name, (...args) =>
  interactionCreateHandler.execute(...args),
);
client.on(messageCreateHandler.name, (...args) =>
  messageCreateHandler.execute(...args),
);

client.once("ready", async (c) => {
  console.log(`[Bot] Logged in as ${c.user.tag}`);
  try {
    await registerCommands();
  } catch (err) {
    console.error("[Bot] Failed to register commands:", err.message);
  }
});

client.on("error", (err) => {
  console.error("[Bot] Client error:", err.message);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Bot] SIGTERM received, shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Bot] SIGINT received, shutting down...");
  client.destroy();
  process.exit(0);
});

client.login(config.DISCORD_TOKEN);
