'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Проверяем, есть ли токен
    const token = localStorage.getItem('crm_token');
    if (token) {
      router.push('/crm/dashboard');
    } else {
      router.push('/crm/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Alchin CRM</h1>
        <p className="text-gray-500">Перенаправление...</p>
      </div>
    </div>
  );
}

