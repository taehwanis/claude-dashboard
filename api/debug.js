import { list, head } from '@vercel/blob';

export default async function handler(request, response) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const result = await list({ token });

    let headResult = null;
    try {
      const meta = await head('sessions.json', { token });
      headResult = {
        url: meta.url?.substring(0, 80),
        downloadUrl: meta.downloadUrl?.substring(0, 80),
        size: meta.size,
        contentType: meta.contentType,
        allKeys: Object.keys(meta),
      };

      // downloadUrl로 fetch 테스트
      if (meta.downloadUrl) {
        const fetchResp = await fetch(meta.downloadUrl);
        headResult.fetchStatus = fetchResp.status;
        headResult.fetchOk = fetchResp.ok;
        headResult.fetchBodyLen = (await fetchResp.text()).length;
      }
    } catch (headErr) {
      headResult = { error: headErr.message };
    }

    return response.status(200).json({
      tokenExists: !!token,
      blobCount: result.blobs.length,
      blobs: result.blobs.map(b => ({ pathname: b.pathname, size: b.size })),
      headResult,
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
