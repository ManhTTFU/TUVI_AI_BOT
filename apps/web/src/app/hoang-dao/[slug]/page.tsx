import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ZODIAC_DETAILS,
  getZodiacBySlug,
  getZodiacNeighbors,
  getRelatedZodiacs,
} from '@/lib/zodiac-detail';
import HoangDaoDetail from '@/components/hoang-dao/HoangDaoDetail';

export function generateStaticParams() {
  return ZODIAC_DETAILS.map((z) => ({ slug: z.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const z = getZodiacBySlug(params.slug);
  if (!z) return { title: 'Không tìm thấy cung hoàng đạo' };
  return {
    title: `${z.name} (${z.en}) — Tính cách, vận trình, tình duyên`,
    description: z.overview.slice(0, 160),
    alternates: { canonical: `/hoang-dao/${z.slug}` },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const detail = getZodiacBySlug(params.slug);
  if (!detail) notFound();
  const neighbors = getZodiacNeighbors(params.slug)!;
  const related = getRelatedZodiacs(params.slug, 3);
  return <HoangDaoDetail detail={detail} neighbors={neighbors} related={related} />;
}
