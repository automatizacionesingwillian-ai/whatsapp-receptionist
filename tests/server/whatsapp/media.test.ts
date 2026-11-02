import { describe, expect, it } from 'vitest';

import { MetaCloudWhatsAppMediaClient } from '@/server/whatsapp/media';

const API_URL = 'https://graph.facebook.com/v21.0';
const MEDIA_DOWNLOAD_URL =
  'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=media_1';

describe('MetaCloudWhatsAppMediaClient', () => {
  it('retrieves metadata and downloads media bytes with a Bearer token', async () => {
    const requests: Array<{ url: string; headers: Headers }> = [];
    const client = new MetaCloudWhatsAppMediaClient({
      apiUrl: API_URL,
      accessToken: 'test_access_token',
      fetcher: async (url, init) => {
        requests.push({
          url: url.toString(),
          headers: new Headers(init?.headers),
        });

        if (url.toString().endsWith('/media_1')) {
          return Response.json({
            id: 'media_1',
            url: MEDIA_DOWNLOAD_URL,
            mime_type: 'audio/ogg',
            sha256: 'hash_1',
          });
        }

        return new Response(new Uint8Array([1, 2, 3]), {
          headers: {
            'content-type': 'audio/ogg',
            'content-length': '3',
          },
        });
      },
    });

    const media = await client.downloadMedia({ mediaId: 'media_1' });

    expect(media).toMatchObject({
      mediaId: 'media_1',
      contentType: 'audio/ogg',
      sha256: 'hash_1',
    });
    expect(Array.from(media.bytes)).toEqual([1, 2, 3]);
    expect(requests.map((request) => request.url)).toEqual([
      `${API_URL}/media_1`,
      MEDIA_DOWNLOAD_URL,
    ]);
    expect(
      requests.every(
        (request) => request.headers.get('Authorization') === 'Bearer test_access_token',
      ),
    ).toBe(true);
  });

  it('rejects files over the configured size limit', async () => {
    const client = new MetaCloudWhatsAppMediaClient({
      apiUrl: API_URL,
      accessToken: 'test_access_token',
      maxBytes: 2,
      fetcher: async (url) => {
        if (url.toString().endsWith('/media_1')) {
          return Response.json({
            url: MEDIA_DOWNLOAD_URL,
          });
        }

        return new Response(new Uint8Array([1, 2, 3]), {
          headers: {
            'content-type': 'audio/ogg',
          },
        });
      },
    });

    await expect(client.downloadMedia({ mediaId: 'media_1' })).rejects.toMatchObject({
      code: 'bad_request',
    });
  });
});
