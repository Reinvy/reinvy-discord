const { Events } = require("discord.js");
const chatCommand = require("../commands/chat.command");
const clearCommand = require("../commands/clear.command");
const configCommand = require("../commands/config.command");

const commandMap = {
  chat: chatCommand,
  clear: clearCommand,
  config: configCommand,
};

/**
 * Handle interactionCreate event (slash commands).
 */
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap[interaction.commandName];
    if (!command) {
      console.warn(`[Interaction] Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[Interaction] Error in /${interaction.commandName}:`, err);
      const errMsg = {
        content: "Terjadi kesalahan saat menjalankan perintah.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg).catch(() => {});
      } else {
        await interaction.reply(errMsg).catch(() => {});
      }
    }
  },
};
