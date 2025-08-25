export default async function handler(req, res) {
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`, {
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: "Discord API error", details: data });
    }

    const messages = data.map(m => {
      let text = m.content;

      // If there's an embed, use its description or title
      if (!text && m.embeds && m.embeds.length > 0) {
        const embed = m.embeds[0];
        text = embed.description || embed.title || "[embed with no text]";
      }

      return {
        id: m.id,
        author: m.author.username,
        content: text,
        timestamp: m.timestamp
      };
    });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
