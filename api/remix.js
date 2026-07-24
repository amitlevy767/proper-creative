/**
 * Vercel serverless proxy for Ideogram Remix API.
 * Handles multipart/form-data by streaming the raw request body through.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    /* buffer the raw multipart body */
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const ideogramRes = await fetch('https://api.ideogram.ai/remix', {
      method: 'POST',
      headers: {
        'Api-Key': cleanKey,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    const data = await ideogramRes.json();
    return res.status(ideogramRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Proxy failure' });
  }
}
