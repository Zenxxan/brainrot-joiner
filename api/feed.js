export default async function handler(req, res) {
  const channelId = process.env.DISCORD_CHANNEL_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!channelId || !botToken) {
    return res.status(500).json({ error: "Missing Discord credentials" });
  }

  try {
    // Fetch last 10 messages from Discord
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res
        .status(response.status)
        .json({ error: "Discord API error", details: errorText });
    }

    const messages = await response.json();

    // Map messages into a simpler format
    const simplified = messages.map((msg) => ({
      id: msg.id,
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    res.status(200).json(simplified);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
