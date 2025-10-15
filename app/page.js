'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect to login
    router.push('/login');
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yönlendiriliyor...</span>
        </div>
        <p className="mt-3 text-muted">Giriş sayfasına yönlendiriliyor...</p>
      </div>
    </div>
  );
}
