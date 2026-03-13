import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeSession } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/');
      return;
    }

    (async () => {
      try {
        const res = await exchangeSession(sessionId);
        login(res.data);
        navigate('/dashboard', { state: { user: res.data }, replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/');
      }
    })();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-carbon border-t-volt animate-spin mx-auto" />
        <p className="font-body text-sm text-gray-500">Connexion en cours...</p>
      </div>
    </div>
  );
}
