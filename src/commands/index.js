const { REST, Routes } = require("discord.js");
const config = require("../config");

const commands = [
  require("./chat.command"),
  require("./clear.command"),
  require("./config.command"),
].map(({ name, description, options }) => ({ name, description, options }));

/**
 * Register slash commands via Discord REST API.
 * Called once during bot startup.
 */
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
  const route = config.DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(
        config.DISCORD_CLIENT_ID,
        config.DISCORD_GUILD_ID,
      )
    : Routes.applicationCommands(config.DISCORD_CLIENT_ID);

  console.log(`[Commands] Registering ${commands.length} slash commands...`);
  await rest.put(route, { body: commands });
  console.log("[Commands] Slash commands registered successfully.");
}

module.exports = { registerCommands };
