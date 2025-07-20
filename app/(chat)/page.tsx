import { redirect } from 'next/navigation';
import { WhatsAppUpload } from '@/components/custom/whatsapp-upload';
import { getSession } from '@/db/cached-queries';

export default async function Page() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  return <WhatsAppUpload />;
}
