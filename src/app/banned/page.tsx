'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, ShieldAlert, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import { signOut } from 'next-auth/react';

function BannedPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    const banReason = searchParams.get('reason');
    if (banReason) {
      setReason(decodeURIComponent(banReason));
    } else {
      setReason('Your account has been suspended for violating our community guidelines.');
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-red-500/20 bg-slate-900 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <Ban className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Account Suspended
              </CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Your access to ChugLi has been restricted
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Ban Reason */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 mb-2">Reason for Suspension</h3>
                  <p className="text-slate-300 leading-relaxed">{reason}</p>
                </div>
              </div>
            </div>

            {/* Guidelines Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <h3 className="font-semibold text-white">Community Guidelines</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    ChugLi is committed to maintaining a safe and respectful environment for all users. 
                    Violations include but are not limited to:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Harassment, hate speech, or discriminatory content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Sharing inappropriate, explicit, or offensive material</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Spam, scams, or malicious activity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Impersonation or fraudulent behavior</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Repeated violations of community standards</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Appeal or Questions?</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    If you believe this suspension was made in error or would like to appeal, 
                    please contact our support team:
                  </p>
                  <a 
                    href="mailto:support@chugli.com" 
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    support@chugli.com
                  </a>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="font-medium text-amber-400">Important:</span> Attempting to create new accounts 
                to bypass this suspension may result in permanent bans and further action.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
              <Button
                onClick={() => window.open('mailto:support@chugli.com', '_blank')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            This decision was made by our moderation team after reviewing your account activity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BannedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <BannedPageContent />
    </Suspense>
  );
}
