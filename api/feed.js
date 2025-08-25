export default async function handler(req, res) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return res.status(discordRes.status).json({ error: text });
    }

    const messages = await discordRes.json();

    const simplified = messages.map(m => {
      // default values
      let result = {
        id: m.id,
        author: m.author?.username,
        content: m.content || null,
        timestamp: m.timestamp,
      };

      // if there's an embed, flatten its fields
      if (m.embeds && m.embeds.length > 0) {
        const e = m.embeds[0];

        // copy over title/description
        if (e.title) result.title = e.title;
        if (e.description) result.description = e.description;

        // flatten fields into key/value pairs
        if (e.fields && Array.isArray(e.fields)) {
          e.fields.forEach(field => {
            // turn "🐾 Brainrot Name" into "brainrotName"
            const key = field.name
              .replace(/[^\w\s]/g, '') // remove emoji/symbols
              .trim()
              .replace(/\s+/g, '_')   // replace spaces with _
              .toLowerCase();
            result[key] = field.value;
          });
        }
      }

      return result;
    });

    res.status(200).json(simplified);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
