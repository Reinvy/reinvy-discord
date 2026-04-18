const reinvy = require("../reinvyClient");

/**
 * /chat <message> — Send a message to Reinvy AI
 * Replies in the same channel with the AI response.
 */
module.exports = {
  name: "chat",
  description: "Chat with Reinvy AI",
  options: [
    {
      name: "message",
      type: 3, // STRING
      description: "Your message to Reinvy",
      required: true,
    },
    {
      name: "personality",
      type: 3, // STRING
      description: "AI personality (friendly, formal, expert, concise)",
      required: false,
      choices: [
        { name: "Friendly", value: "friendly" },
        { name: "Formal", value: "formal" },
        { name: "Expert", value: "expert" },
        { name: "Concise", value: "concise" },
      ],
    },
  ],
  async execute(interaction) {
    await interaction.deferReply();

    const message = interaction.options.getString("message");
    const personality =
      interaction.options.getString("personality") || undefined;
    const user_id = interaction.user.id;
    const source = "discord";

    try {
      const result = await reinvy.chat({
        user_id,
        source,
        message,
        personality,
      });

      // Discord has a 2000 char message limit
      const reply =
        result.reply.length > 1990
          ? result.reply.slice(0, 1990) + "..."
          : result.reply;

      await interaction.editReply(reply);
    } catch (err) {
      console.error("[/chat] Error:", err.message);
      await interaction.editReply({
        content:
          "Maaf, terjadi kesalahan saat memproses pesanmu. Coba lagi nanti.",
        ephemeral: true,
      });
    }
  },
};
