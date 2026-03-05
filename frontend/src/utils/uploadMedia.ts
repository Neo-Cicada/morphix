import { createClient } from '@/utils/supabase/client';

export async function uploadMedia(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'bin';
  const uuid = crypto.randomUUID();
  const path = `${userId}/${uuid}.${ext}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}
