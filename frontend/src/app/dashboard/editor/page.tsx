import { Suspense } from 'react';
import EditorPage from '@/components/dashboard/EditorPage';

export const metadata = { title: 'Editor — Morphix Studio' };

export default function EditorRoute() {
  return (
    <Suspense>
      <EditorPage />
    </Suspense>
  );
}
