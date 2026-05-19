import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';
import { ZODIAC_DETAILS } from '@/lib/zodiac-detail';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/xem-tu-vi', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/xem-tarot', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/tu-tru-bat-tu', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/hoang-dao', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/ngay-tot', priority: 0.8, changeFrequency: 'daily' },
    { path: '/chinh-sach-bao-mat', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/dieu-khoan-su-dung', priority: 0.3, changeFrequency: 'yearly' },
  ];

  const zodiacRoutes = ZODIAC_DETAILS.map((z) => ({
    url: `${SITE_URL}/hoang-dao/${z.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...zodiacRoutes,
  ];
}
