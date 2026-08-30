// app/upload-replay/page.js
import { redirect } from 'next/navigation';

import UploadReplayPage from '@/components/UploadReplayPage';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Upload a replay',
  description:
    'Upload a .replay file, up to 10MB. ballchasing.com parses it and the stats pick your songs.',
};

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If not authenticated, redirect to login page
  if (!data.user) {
    redirect('/login');
  }

  return <UploadReplayPage />;
}
