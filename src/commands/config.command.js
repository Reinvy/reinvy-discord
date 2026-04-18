const reinvy = require("../reinvyClient");

/**
 * /config — View or update AI config preferences
 */
module.exports = {
  name: "config",
  description: "Lihat atau ubah preferensi AI kamu",
  options: [
    {
      name: "personality",
      type: 3, // STRING
      description: "Pilih kepribadian AI",
      required: false,
      choices: [
        { name: "Friendly", value: "friendly" },
        { name: "Formal", value: "formal" },
        { name: "Expert", value: "expert" },
        { name: "Concise", value: "concise" },
      ],
    },
    {
      name: "language",
      type: 3, // STRING
      description: "Bahasa (id = Indonesia, en = English)",
      required: false,
    },
    {
      name: "max_context",
      type: 4, // INTEGER
      description: "Jumlah pesan konteks (1-50)",
      required: false,
      min_value: 1,
      max_value: 50,
    },
  ],
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user_id = interaction.user.id;
    const source = "discord";
    const personality = interaction.options.getString("personality");
    const language = interaction.options.getString("language");
    const max_context = interaction.options.getInteger("max_context");

    const hasUpdate = personality || language || max_context;

    try {
      if (hasUpdate) {
        const updateData = {};
        if (personality) updateData.personality = personality;
        if (language) updateData.language = language;
        if (max_context) updateData.max_context = max_context;

        const updated = await reinvy.setConfig({
          user_id,
          source,
          ...updateData,
        });
        await interaction.editReply(
          `✅ Konfigurasi diperbarui:\n• Kepribadian: **${updated.personality}**\n• Bahasa: **${updated.language}**\n• Konteks: **${updated.max_context}** pesan`,
        );
      } else {
        const cfg = await reinvy.getConfig({ user_id, source });
        await interaction.editReply(
          `📋 Konfigurasi kamu:\n• Kepribadian: **${cfg.personality}**\n• Bahasa: **${cfg.language}**\n• Konteks: **${cfg.max_context}** pesan\n• Model: \`${cfg.model}\``,
        );
      }
    } catch (err) {
      console.error("[/config] Error:", err.message);
      await interaction.editReply("Gagal memuat/memperbarui konfigurasi.");
    }
  },
};
