let latestData = { message: "No data yet" };

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json(latestData);
  } else if (req.method === "POST") {
    latestData = req.body;
    res.status(200).json({ success: true });
  } else {
    res.status(405).end(); 
  }
}
