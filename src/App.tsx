import React, { useEffect, useState } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ZavinoLayout from './ZavinoLayout'; // your existing layout with <Routes> inside

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('zavino-pin-authed');
    if (stored === 'true') {
      setIsAuthed(true);
    }
  }, []);

  const correctPin = '1234';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      setIsAuthed(true);
      setError('');
      window.localStorage.setItem('zavino-pin-authed', 'true');
    } else {
      setError('Incorrect PIN. Try again.');
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthed ? (
        <Router>
          <ZavinoLayout />
        </Router>
      ) : (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <div className="mb-4 text-center">
              <h1 className="text-lg font-semibold text-white">
                Zavino Staff Login
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Enter 4-digit PIN to access billing.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Staff PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••"
                />
                {error && (
                  <p className="mt-1 text-xs text-red-400">
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Unlock
              </button>
              <p className="text-[11px] text-center text-slate-500">
                Demo PIN: <span className="font-mono">1234</span>
              </p>
            </form>
          </div>
        </div>
      )}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;