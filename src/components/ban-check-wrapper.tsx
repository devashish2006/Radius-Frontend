'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageLoader } from './page-loader';

export function BanCheckWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (status === 'loading') return;

      if (status === 'authenticated' && session) {
        try {
          const token = (session as any)?.backendToken;
          
          if (token) {
            // Try to verify the token is still valid by calling /auth/me
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            // Check if user is banned (403 status)
            if (response.status === 403) {
              try {
                const data = await response.json();
                const reason = data.banReason || data.message || 'Your account has been suspended for violating our community guidelines.';
                const bannedAt = data.bannedAt || new Date().toISOString();
                router.push(`/banned?reason=${encodeURIComponent(reason)}&bannedAt=${encodeURIComponent(bannedAt)}`);
                return;
              } catch (e) {
                // If parsing fails, use default message
                router.push('/banned?reason=Your%20account%20has%20been%20suspended&bannedAt=' + encodeURIComponent(new Date().toISOString()));
                return;
              }
            }

            if (!response.ok && response.status !== 401) {
              console.error('Failed to verify user status:', response.status, response.statusText);
            }
          }
        } catch (error) {
          console.error('Error checking ban status:', error);
        }
      }

      setChecking(false);
    };

    checkBanStatus();
    
    // Check ban status every 30 seconds for real-time enforcement
    const interval = setInterval(checkBanStatus, 30000);
    
    return () => clearInterval(interval);
  }, [status, session, router]);

  if (checking && status !== 'unauthenticated') {
    return <PageLoader />;
  }

  return <>{children}</>;
}
