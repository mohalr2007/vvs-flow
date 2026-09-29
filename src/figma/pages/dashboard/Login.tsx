import { useState } from 'react';
import { useNavigate } from '@/figma/router';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { ownerService } from '@/lib/services';
import plumbingBathroom from '@/assets/plumbing-bathroom.jpg';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const getDemoCreds = useServerFn(ownerService.demoLogin);

  const handleDemoLogin = async () => {
    setDemoBusy(true);
    setError('');
    setNotice('');
    try {
      const creds = await getDemoCreds();
      let { error: signInErr } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (signInErr && signInErr.message === 'Invalid login credentials') {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: creds.email,
          password: creds.password,
          options: { data: { name: 'Mats Ekström' } },
        });
        if (!signUpErr) {
          const retry = await supabase.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          });
          signInErr = retry.error;
        }
      }

      if (signInErr) {
        throw new Error(
          signInErr.message === 'Invalid login credentials'
            ? "Pour activer l'accès 1-clic, ajoutez la variable SUPABASE_SERVICE_ROLE_KEY dans Vercel (Settings > Environment Variables, récupérée dans Supabase > Project Settings > API > service_role secret)."
            : signInErr.message
        );
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo access failed. Please try again.');
    } finally {
      setDemoBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : error.message);
      navigate('/dashboard');
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) navigate('/dashboard');
      else setNotice('Check your inbox to confirm your email, then sign in.');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#030E1C', fontFamily: 'Outfit, sans-serif' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col w-96 xl:w-[480px] relative overflow-hidden flex-shrink-0"
        style={{ background: '#050F1E', borderRight: '1px solid rgba(8,145,178,0.08)' }}>
        <div className="absolute inset-0">
          <img
            src={plumbingBathroom}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.72 }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,15,30,0.72) 0%, rgba(5,15,30,0.32) 40%, rgba(5,15,30,0.55) 100%)' }} />
          <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(8,145,178,0.18), transparent)' }} />
        </div>

        {/* Logo — top */}
        <div className="relative z-10 p-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0891B2, #22D3EE)' }}>
              <span style={{ fontSize: 14, color: '#030E1C', fontWeight: 700 }}>V</span>
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: '#D9EEF7' }}>VVS Flow</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#6DA8C4', marginLeft: 2 }}>by Ekström</span>
          </div>
        </div>

        {/* Quote — vertically centered */}
        <div className="relative z-10 flex-1 flex items-center px-10">
          <div>
            <blockquote>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: '#D9EEF7', lineHeight: 1.2, marginBottom: 20, fontStyle: 'italic', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                "Every inquiry gets an outcome."
              </p>
              <footer style={{ fontSize: 13, color: '#6DA8C4' }}>
                <span style={{ color: '#22D3EE', fontWeight: 600 }}>Mats Ekström</span> · Owner, Ekström VVS
              </footer>
            </blockquote>
            <div className="mt-8 flex flex-col gap-3">
              {[
                'No request falls through the cracks',
                'AI-assisted — human approved',
                'ROT summaries ready when you need them',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: '#0891B2', fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#A8CCE0' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spacer bottom */}
        <div className="flex-shrink-0" style={{ height: 80 }} />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-6">
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>
              {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
            </h1>
            <p style={{ fontSize: 14, color: '#6DA8C4' }}>
              {mode === 'signin' ? 'Sign in to your VVS Flow dashboard.' : 'The first account becomes the owner.'}
            </p>
          </div>

          {/* Quick Jury / Demo 1-Click Access Card */}
          <div
            className="mb-6 p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(8,145,178,0.14) 0%, rgba(34,211,238,0.06) 100%)',
              border: '1px solid rgba(34,211,238,0.3)',
              boxShadow: '0 8px 32px rgba(8,145,178,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold"
                style={{ background: 'rgba(34,211,238,0.2)', color: '#22D3EE' }}
              >
                ✦ Accès Jury & Démo
              </span>
              <span style={{ fontSize: 11, color: '#6DA8C4', fontFamily: 'JetBrains Mono' }}>
                Sans mot de passe
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#A8CCE0', lineHeight: 1.5, marginBottom: 14 }}>
              Accédez instantanément au dashboard en tant que <strong>Mats Ekström</strong> (propriétaire) avec l'état opérationnel et les données de démo.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoBusy || busy}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #0891B2, #22D3EE)',
                color: '#030E1C',
                fontWeight: 700,
                border: 'none',
                cursor: demoBusy ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(8,145,178,0.35)',
              }}
            >
              {demoBusy ? 'Connexion en cours…' : 'Accéder au Dashboard en 1 clic →'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(8,145,178,0.15)' }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#4A8BAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ou connexion classique
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(8,145,178,0.15)' }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Email
              </label>
              <input type="email" required autoComplete="email" className="vvs-input" placeholder="mats@ekstromvvs.se" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Password
              </label>
              <input type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="vvs-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p role="alert" style={{ fontSize: 13, color: '#E53935' }}>{error}</p>}
            {notice && <p role="status" style={{ fontSize: 13, color: '#22C55E' }}>{notice}</p>}
            <button type="submit" disabled={busy || demoBusy} className="btn-copper w-full py-4 rounded-xl font-semibold mt-2">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <button onClick={() => { setMode(m => m === 'signin' ? 'register' : 'signin'); setError(''); setNotice(''); }}
            className="w-full text-center text-sm transition-colors" style={{ color: '#6DA8C4', background: 'none', border: 'none', cursor: 'pointer' }}>
            {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
