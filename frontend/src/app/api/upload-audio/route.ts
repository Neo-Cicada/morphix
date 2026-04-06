import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('audio') as File | null;

  if (!file) {
    return Response.json({ error: 'No audio file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `audio/${session.user.id}/${Date.now()}.mp3`;

  // Use admin client for storage — user-session client is blocked by bucket RLS
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.storage
    .from('renders')
    .upload(fileName, buffer, { contentType: 'audio/mpeg', upsert: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data } = adminSupabase.storage.from('renders').getPublicUrl(fileName);

  return Response.json({ url: data.publicUrl });
}
