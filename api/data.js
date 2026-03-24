import { list } from '@vercel/blob';

const EMPTY_DATA = {
  sessions: [], projects: [], stats: null, syncedAt: null
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('[api/data] token exists:', !!token, 'len:', token?.length);

    const result = await list({ token });
    console.log('[api/data] total blobs:', result.blobs.length);
    result.blobs.forEach(b => console.log('[api/data] blob:', b.pathname, b.size));

    const sessionBlob = result.blobs.find(b => b.pathname === 'sessions.json');
    if (!sessionBlob) {
      response.setHeader('Cache-Control', 'private, max-age=60');
      return response.status(200).json(EMPTY_DATA);
    }

    const blobResponse = await fetch(sessionBlob.url);
    if (!blobResponse.ok) {
      return response.status(200).json(EMPTY_DATA);
    }

    const data = await blobResponse.text();
    response.setHeader('Cache-Control', 'private, max-age=300');
    response.setHeader('Content-Type', 'application/json');
    return response.status(200).send(data);
  } catch (error) {
    console.error('[api/data] Error:', error.message);
    return response.status(500).json({ error: '동기화 데이터를 불러올 수 없습니다' });
  }
}
