import { redirect } from 'next/navigation';

import { MemoryProfile } from '@/components/custom/memory-profile';
import { getMemoryProfileByIdQuery } from '@/db/queries';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoryProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const memoryProfile = await getMemoryProfileByIdQuery(supabase, id);

    if (!memoryProfile) {
      redirect('/');
    }

    // Only pass minimal profile data
    const profile = {
      id: memoryProfile.id,
      name: memoryProfile.name,
    };

    return <MemoryProfile profile={profile} />;
  } catch (error) {
    console.error('Error loading memory profile:', error);
    redirect('/');
  }
}
