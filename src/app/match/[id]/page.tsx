import MatchClient from './MatchClient';

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  
  return <MatchClient id={id} />;
} 