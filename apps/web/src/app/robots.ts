import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/vi-cua-toi',
          '/lich-su',
          '/dang-nhap',
          '/tu-vi/',
          '/tu-tru/',
          '/xem-tarot/',
          '/hoang-dao/luan-giai',
          '/xoa-du-lieu',
          '/_next/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
