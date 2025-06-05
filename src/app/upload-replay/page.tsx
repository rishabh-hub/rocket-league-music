// app/upload-replay/page.js
import { redirect } from 'next/navigation';

import UploadReplayPage from '@/components/UploadReplayPage';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Upload Replay | ReplayRhythms',
  description:
    'Upload your Rocket League replay files for detailed analysis and personalized music recommendations based on your gameplay style.',
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
