const reinvy = require("../reinvyClient");

/**
 * /clear — Clear conversation memory for the calling user
 */
module.exports = {
  name: "clear",
  description: "Hapus riwayat percakapan kamu dengan Reinvy AI",
  options: [],
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user_id = interaction.user.id;
    const source = "discord";

    try {
      await reinvy.clearMemory({ user_id, source });
      await interaction.editReply(
        "Riwayat percakapanmu telah dihapus. Mulai percakapan baru!",
      );
    } catch (err) {
      console.error("[/clear] Error:", err.message);
      await interaction.editReply("Gagal menghapus riwayat. Coba lagi nanti.");
    }
  },
};
