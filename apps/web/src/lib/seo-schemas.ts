import { SITE_URL } from './env';

const PROVIDER = {
  '@type': 'Organization',
  name: 'Luận Giải Vận Mệnh',
  url: SITE_URL,
};

const AREA_VN = { '@type': 'Country', name: 'Vietnam' };

export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
  priceVnd?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType ?? opts.name,
    url: `${SITE_URL}${opts.path}`,
    provider: PROVIDER,
    areaServed: AREA_VN,
    ...(opts.priceVnd && {
      offers: {
        '@type': 'Offer',
        price: String(opts.priceVnd),
        priceCurrency: 'VND',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}${opts.path}`,
      },
    }),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

// Default Article image — brand-logo.png 1536×1024 đáp ứng Google rich result yêu cầu
// (≥1200px wide, ratio 3:2). Per-zodiac image sẽ thay sau khi có thiết kế riêng cho 12 cung.
const DEFAULT_ARTICLE_IMAGE = `${SITE_URL}/images/brand-logo.png`;

export function articleSchema(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const now = new Date().toISOString();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    image: opts.image ?? DEFAULT_ARTICLE_IMAGE,
    datePublished: opts.datePublished ?? now,
    dateModified: opts.dateModified ?? opts.datePublished ?? now,
    publisher: {
      ...PROVIDER,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    author: PROVIDER,
    inLanguage: 'vi-VN',
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function collectionPageSchema(opts: {
  name: string;
  description: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    inLanguage: 'vi-VN',
    hasPart: opts.items.map((i) => ({
      '@type': 'WebPage',
      name: i.name,
      url: `${SITE_URL}${i.path}`,
    })),
  };
}
