import { useState } from 'react';
import './Auth.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const IconBox    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconMail   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconLock   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconEye    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconCheck  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconArrow  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default function Login({ onNavigateRegister, onLoginSuccess }) {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [alert, setAlert]       = useState(null);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Ingresa tu correo electronico';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'El correo no es valido';
    if (!form.password) e.password = 'Ingresa tu contrasena';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (alert) setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setAlert(null);

    try {
      const loginBody = {};
      loginBody.email = form.email;
      loginBody['contrase\u00f1a'] = form.password;

      const res = await fetch(`${API_BASE}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginBody),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({ type: 'error', msg: data.mensaje || 'Credenciales incorrectas. Revisa tu email y contrasena.' });
        return;
      }

      if (data.usuario) localStorage.setItem('equipya_user', JSON.stringify(data.usuario));

      setAlert({ type: 'success', msg: `Bienvenido de vuelta, ${data.usuario?.nombre}!` });

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(data);
      }, 900);

    } catch {
      setAlert({ type: 'error', msg: 'No se pudo conectar con el servidor. Esta corriendo en el puerto 3000?' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-brand">
        <div className="brand-logo">
          <div className="brand-icon"><IconBox /></div>
          <span className="brand-name">EquipYa</span>
        </div>
        <div className="brand-tagline-block">
          <h2 className="brand-tagline">
            El equipamiento<br />que necesitas,<br /><span>cuando lo necesitas.</span>
          </h2>
          <p className="brand-description">
            Conectamos a quienes tienen equipo disponible con quienes lo necesitan. Rapido, seguro y sin complicaciones.
          </p>
        </div>
        <div className="brand-features">
          <div className="brand-feature"><span className="brand-feature-dot" />Publica y alquila equipos facilmente</div>
          <div className="brand-feature"><span className="brand-feature-dot" />Transacciones seguras entre usuarios</div>
          <div className="brand-feature"><span className="brand-feature-dot" />Disponible las 24 horas, los 7 dias</div>
        </div>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-form-box">

          <div className="auth-mobile-logo">
            <div className="brand-icon"><IconBox /></div>
            <span className="brand-name">EquipYa</span>
          </div>

          <h1 className="auth-heading">Iniciar sesion</h1>
          <p className="auth-subheading">Ingresa tus datos para acceder a tu cuenta</p>

          {alert && (
            <div className={`auth-alert ${alert.type}`}>
              {alert.type === 'success' ? <IconCheck /> : <IconAlert />}
              <span>{alert.msg}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            <div className="form-field">
              <label className="form-label">Correo electronico</label>
              <div className="input-wrap">
                <input
                  className={`form-input ${errors.email ? 'has-error' : ''}`}
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                />
                <span className="input-icon"><IconMail /></span>
              </div>
              {errors.email && <span className="field-error"><IconAlert />{errors.email}</span>}
            </div>

            <div className="form-field">
              <label className="form-label">Contrasena</label>
              <div className="input-wrap">
                <input
                  className={`form-input has-toggle ${errors.password ? 'has-error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contrasena"
                  value={form.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                />
                <span className="input-icon"><IconLock /></span>
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <span className="field-error"><IconAlert />{errors.password}</span>}
            </div>

            <button className="btn-submit" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner" />Ingresando...</>
                : <>Ingresar <IconArrow /></>
              }
            </button>
          </form>

          <p className="auth-footer">
            No tenes cuenta?{' '}
            <button className="auth-link" onClick={onNavigateRegister}>
              Registrate gratis
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
