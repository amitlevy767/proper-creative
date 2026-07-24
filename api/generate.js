/**
 * Vercel serverless proxy for Ideogram API.
 * Browser calls this endpoint (same-origin, no CORS issue),
 * we forward to Ideogram with the user's API key from headers.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-ideogram-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing X-Ideogram-Key header' });
  }

  const cleanKey = String(apiKey).replace(/[^\x21-\x7E]/g, '');
  if (!cleanKey) {
    return res.status(400).json({ error: 'Invalid API key' });
  }

  try {
    const ideogramRes = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': cleanKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await ideogramRes.json();
    return res.status(ideogramRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Proxy failure' });
  }
}
