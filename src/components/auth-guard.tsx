'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import CircularProgress from '@mui/material/CircularProgress';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, isClient]);

  if (!isClient || isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <CircularProgress color="inherit" />
      </div>
    );
  }

  return <>{children}</>;
}
