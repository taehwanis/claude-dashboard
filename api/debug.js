import { list } from '@vercel/blob';

export default async function handler(request, response) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const result = await list({ token });

    return response.status(200).json({
      tokenExists: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 15) + '...',
      blobCount: result.blobs.length,
      blobs: result.blobs.map(b => ({ pathname: b.pathname, size: b.size })),
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
