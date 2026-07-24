/**
 * Image proxy. Fetches a remote image server-side so we can draw it to
 * a browser Canvas without cross-origin tainting (which would block
 * canvas.toBlob / toDataURL).
 * Only forwards http(s) URLs from ideogram.ai to avoid abuse.
 */
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }

  let parsed;
  try { parsed = new URL(url); }
  catch { return res.status(400).json({ error: 'Invalid url' }); }

  const allowedHosts = ['ideogram.ai', 'api.ideogram.ai', 'cdn.ideogram.ai'];
  const hostOk = allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
  if (!hostOk) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const r = await fetch(parsed.toString());
    if (!r.ok) return res.status(r.status).json({ error: 'Upstream ' + r.status });
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buf);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Fetch failed' });
  }
}
