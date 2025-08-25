export default async function handler(req, res) {
  const channelId = process.env.DISCORD_CHANNEL_ID;   // ✅ matches your env
  const botToken  = process.env.DISCORD_BOT_TOKEN;    // ✅ matches your env

  if (!channelId || !botToken) {
    return res.status(500).json({ error: "Missing DISCORD_* env vars" });
  }

  try {
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (discordRes.status === 401) {
      return res.status(401).json({ error: "Unauthorized (check bot token)" });
    }
    if (discordRes.status === 403) {
      return res.status(403).json({ error: "Forbidden (bot lacks channel perms)" });
    }
    if (!discordRes.ok) {
      const text = await discordRes.text();
      return res.status(discordRes.status).json({ error: "Discord API error", details: text });
    }

    const messages = await discordRes.json();

    // Return both plain content and basic embed info
    const simplified = messages.map((m) => {
      const firstEmbed = (m.embeds && m.embeds[0]) || null;

      // Build a human-readable text if content is empty but there’s an embed
      let displayText = m.content || "";
      if (!displayText && firstEmbed) {
        const lines = [];
        if (firstEmbed.title) lines.push(firstEmbed.title);
        if (firstEmbed.description) lines.push(firstEmbed.description);
        if (Array.isArray(firstEmbed.fields)) {
          firstEmbed.fields.forEach((f) => lines.push(`${f.name}: ${f.value}`));
        }
        displayText = lines.join("\n");
      }

      return {
        id: m.id,
        author: m.author?.global_name || m.author?.username || "Unknown",
        content: displayText,
        // also expose raw embed bits if you want to style them on the front-end
        embed: firstEmbed
          ? {
              title: firstEmbed.title || null,
              description: firstEmbed.description || null,
              fields: firstEmbed.fields || [],
              color: firstEmbed.color || null,
            }
          : null,
        timestamp: m.timestamp,
      };
    });

    res.status(200).json(simplified);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
