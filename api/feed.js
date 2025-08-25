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
      const result = {
        id: m.id,
        author: m.author?.username || null,
        content: m.content || null, // still might be empty for embed-only messages
        timestamp: m.timestamp,
        attachments: m.attachments?.map(a => ({
          url: a.url,
          name: a.filename,
          contentType: a.content_type
        })) || [],
        embeds: [],
        rawEmbeds: m.embeds || []
      };

      if (m.embeds && m.embeds.length > 0) {
        result.embeds = m.embeds.map(e => {
          const embedObj = {
            title: e.title || null,
            description: e.description || null,
            fields: {}
          };

          // Flatten fields into top-level keys
          if (e.fields && Array.isArray(e.fields)) {
            e.fields.forEach(field => {
              const key = field.name
                .replace(/[^\w\s]/g, '')
                .trim()
                .replace(/\s+/g, '_')
                .toLowerCase();
              embedObj.fields[key] = field.value;
              result[key] = field.value; // also flatten to top-level for easy access
            });
          }

          // Include description as a field if present
          if (e.description) {
            result.description = e.description;
          }

          return embedObj;
        });
      }

      return result;
    });

    res.status(200).json(simplified);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
