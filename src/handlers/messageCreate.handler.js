const { Events } = require("discord.js");
const reinvy = require("../reinvyClient");

/**
 * Handle messageCreate event for DM conversations.
 * In DMs, no slash command needed — just send text directly.
 */
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bots and non-DM messages that don't mention the bot
    if (message.author.bot) return;

    const isDM = message.channel.type === 1; // DM channel type

    if (!isDM) return; // Only handle DMs here; slash commands handle server chats

    const user_id = message.author.id;
    const source = "discord";

    try {
      await message.channel.sendTyping();

      const result = await reinvy.chat({
        user_id,
        source,
        message: message.content,
      });

      const reply =
        result.reply.length > 1990
          ? result.reply.slice(0, 1990) + "..."
          : result.reply;

      await message.reply(reply);
    } catch (err) {
      console.error("[MessageCreate] Error:", err.message);
      await message
        .reply("Maaf, terjadi kesalahan. Coba lagi nanti.")
        .catch(() => {});
    }
  },
};
