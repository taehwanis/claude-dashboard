import { list } from '@vercel/blob';

export default async function handler(request, response) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const result = await list({ token });

    const sessionBlob = result.blobs.find(b => b.pathname === 'sessions.json');
    let fetchResult = null;
    if (sessionBlob) {
      try {
        const fetchResp = await fetch(sessionBlob.url);
        fetchResult = {
          status: fetchResp.status,
          ok: fetchResp.ok,
          contentLength: fetchResp.headers.get('content-length'),
          bodyPreview: (await fetchResp.text()).substring(0, 100),
        };
      } catch (fetchErr) {
        fetchResult = { error: fetchErr.message };
      }
    }

    return response.status(200).json({
      tokenExists: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 15) + '...',
      blobCount: result.blobs.length,
      blobs: result.blobs.map(b => ({ pathname: b.pathname, size: b.size, url: b.url?.substring(0, 80) })),
      fetchResult,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
