import { head } from '@vercel/blob';

const EMPTY_DATA = {
  sessions: [], projects: [], stats: null, syncedAt: null
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // head()로 blob 메타데이터 + downloadUrl 획득
    let blobMeta;
    try {
      blobMeta = await head('sessions.json', { token });
    } catch {
      // blob 없음 (404) → 빈 데이터
      response.setHeader('Cache-Control', 'private, max-age=60');
      return response.status(200).json(EMPTY_DATA);
    }

    // downloadUrl은 인증된 URL (private store에서도 접근 가능)
    const downloadUrl = blobMeta.downloadUrl;
    const blobResponse = await fetch(downloadUrl);

    if (!blobResponse.ok) {
      console.error('[api/data] fetch failed:', blobResponse.status);
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
