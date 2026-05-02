import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(`Google returned an error: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code found in URL.');
      return;
    }

    // Exchange the code for tokens on the backend
    const exchangeCode = async () => {
      try {
        const response = await api.post<{ success: boolean; message: string }>(
          ENDPOINTS.INTEGRATIONS_GOOGLE_CALLBACK || '/integrations/google/callback',
          { code, state }
        );

        if (response.success) {
          setStatus('success');
          // Redirect back to settings after a brief delay
          setTimeout(() => {
            navigate('/dashboard/settings');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMsg(response.message || 'Failed to connect Google account.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'An error occurred during connection.');
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to Google...</h2>
            <p className="text-gray-500 text-sm">Please wait while we secure your connection.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Connected!</h2>
            <p className="text-gray-500 text-sm">Your Gmail account is now linked. Redirecting you back to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Return to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
