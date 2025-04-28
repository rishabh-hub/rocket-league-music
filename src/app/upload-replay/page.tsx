// app/upload-replay/page.js
import { redirect } from 'next/navigation';

import UploadReplayPage from '@/components/UploadReplayPage'; // You'll need to create this component
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If not authenticated, redirect to login page
  if (!data.user) {
    redirect('/login');
  }

  return <UploadReplayPage />;
}
