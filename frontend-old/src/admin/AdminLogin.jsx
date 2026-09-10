import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminLogin = () => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('AdminPassword2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(identifier, password);
      addToast('Welcome back, Administrator!', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.message || 'Invalid username or password';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #073b7a 0%, #062e61 100%)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '22px', padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <img src="/assets/voices_logo.png" alt="Voices of Vehari" style={{ width: '180px', height: 'auto', marginBottom: '12px' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>Admin CMS Login</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Content Management System</p>
        </div>

        {location.search.includes('session=expired') && (
          <div className="notice" style={{ marginBottom: '18px', fontSize: '13px' }}>
            Your session expired. Please sign in again.
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '18px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              className="form-control"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn primary"
            style={{ width: '100%', padding: '13px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to CMS'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--line)', paddingTop: '18px' }}>
          <Link to="/" style={{ color: 'var(--teal)', fontSize: '14px', fontWeight: 700 }}>
            ← Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
