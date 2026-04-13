import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'student' ? '/student' : '/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🏛️</div>
        <h1 style={styles.title}>Hall Management</h1>
        <p style={styles.subtitle}>University of Excellence</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" name="email" value={form.email} onChange={handle} required placeholder="you@university.edu" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" name="password" value={form.password} onChange={handle} required placeholder="••••••••" />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.link}>Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', studentId: '', phone: '', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register(form);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, maxWidth: 480 }}>
        <div style={styles.logo}>🏛️</div>
        <h1 style={styles.title}>Create Account</h1>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={submit}>
          {[
            { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { name: 'email', label: 'University Email', type: 'email', placeholder: 'you@university.edu' },
            { name: 'studentId', label: 'Student ID', type: 'text', placeholder: 'STU2024001' },
            { name: 'department', label: 'Department', type: 'text', placeholder: 'Computer Science' },
            { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+880 1XX-XXXXXXX' },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(f => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input style={styles.input} type={f.type} name={f.name} value={form[f.name]} onChange={handle}
                required={['name','email','password'].includes(f.name)} placeholder={f.placeholder} />
            </div>
          ))}
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={styles.link}>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: 16 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 700, textAlign: 'center', color: '#1a1a2e' },
  subtitle: { margin: '0 0 28px', color: '#666', textAlign: 'center', fontSize: 14 },
  error: { background: '#fff0f0', border: '1px solid #ffc0c0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#c00', fontSize: 14 },
  success: { background: '#f0fff4', border: '1px solid #b2f5c8', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#0a6', fontSize: 14 },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#333' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  btn: { width: '100%', padding: '12px', borderRadius: 8, background: '#1a1a2e', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  link: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' },
};
