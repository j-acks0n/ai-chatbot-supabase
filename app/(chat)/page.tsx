import { getSession } from '@/db/cached-queries';
import { WhatsAppUpload } from '@/components/custom/whatsapp-upload';

export default async function Page() {
  const user = await getSession();

  return (
    <div className="flex flex-col min-h-screen">
      <WhatsAppUpload />
    </div>
  );
}
