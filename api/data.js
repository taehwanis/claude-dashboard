import { list } from '@vercel/blob';

const EMPTY_DATA = {
  sessions: [], projects: [], stats: null, syncedAt: null
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({
      prefix: 'sessions.json',
      limit: 1,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobs.length) {
      response.setHeader('Cache-Control', 'private, max-age=60');
      return response.status(200).json(EMPTY_DATA);
    }

    const blobResponse = await fetch(blobs[0].url);
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
