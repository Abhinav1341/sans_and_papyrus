import { notFound } from 'next/navigation';
import { CHAPTERS } from '@/story';
import { StoryScreen } from '@/cinema/StoryScreen';

export const dynamicParams = false;

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ chapter: c.id }));
}

export default async function StoryPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  if (!CHAPTERS.some((c) => c.id === chapter)) notFound();
  return <StoryScreen chapterId={chapter} />;
}
