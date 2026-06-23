import { useState } from 'react';
import './Auth.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ── tiny SVG icons ── */
const IconBox    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconUser   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconPhone  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 5.09 5.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/></svg>;
const IconLock   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconEye    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconCheck  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconArrow  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

const INITIAL = { nombre: '', apellido: '', email: '', telefono: '', password: '', confirmPassword: '' };

export default function Register({ onNavigateLogin, onRegisterSuccess }) {
  const [form, setForm]             = useState(INITIAL);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [alert, setAlert]           = useState(null);
  const [errors, setErrors]         = useState({});

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())   e.nombre   = 'Ingresá tu nombre';
    if (!form.apellido.trim()) e.apellido = 'Ingresá tu apellido';
    if (!form.email)           e.email    = 'Ingresá tu correo';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'El correo no es válido';
    if (!form.password)        e.password = 'Ingresá una contraseña';
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!form.confirmPassword) e.confirmPassword = 'Confirmá tu contraseña';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
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

    // Armamos el body — ajustá los campos según tu modelo Mongoose
    const body = {
      nombre:   form.nombre.trim(),
      apellido: form.apellido.trim(),
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      ...(form.telefono && { telefono: form.telefono.trim() }),
    };

    try {
      const res = await fetch(`${API_BASE}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // El backend puede mandar 409 si el email ya existe, etc.
        setAlert({ type: 'error', msg: data.message || 'No se pudo completar el registro. Intentá de nuevo.' });
        return;
      }

      setAlert({ type: 'success', msg: '¡Cuenta creada! Redirigiendo al inicio de sesión…' });

      setTimeout(() => {
        if (onRegisterSuccess) onRegisterSuccess(data);
        else if (onNavigateLogin) onNavigateLogin();
      }, 1200);

    } catch {
      setAlert({ type: 'error', msg: 'No se pudo conectar con el servidor. ¿Está corriendo en el puerto 3000?' });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, icon, type = 'text', placeholder, autoComplete, showToggle, show, onToggle }) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <div className="input-wrap">
        <input
          className={`form-input ${showToggle ? 'has-toggle' : ''} ${errors[id] ? 'has-error' : ''}`}
          type={showToggle ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[id]}
          onChange={handleChange(id)}
          autoComplete={autoComplete}
        />
        <span className="input-icon">{icon}</span>
        {showToggle && (
          <button type="button" className="toggle-password" onClick={onToggle}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
      {errors[id] && <span className="field-error"><IconAlert />{errors[id]}</span>}
    </div>
  );

  return (
    <div className="auth-layout">
      {/* ── Brand panel ── */}
      <aside className="auth-brand">
        <div className="brand-logo">
          <div className="brand-icon"><IconBox /></div>
          <span className="brand-name">EquipYa</span>
        </div>

        <div className="brand-tagline-block">
          <h2 className="brand-tagline">
            Empezá a<br />publicar y<br /><span>ganar hoy.</span>
          </h2>
          <p className="brand-description">
            Creá tu cuenta gratis en menos de un minuto y empezá a publicar tu equipamiento o a explorar lo que otros ofrecen.
          </p>
        </div>

        <div className="brand-features">
          <div className="brand-feature"><span className="brand-feature-dot" />Registro gratuito y sin complicaciones</div>
          <div className="brand-feature"><span className="brand-feature-dot" />Publicá equipos en minutos</div>
          <div className="brand-feature"><span className="brand-feature-dot" />Comunidad de usuarios verificados</div>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-form-panel">
        <div className="auth-form-box">

          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="brand-icon"><IconBox /></div>
            <span className="brand-name">EquipYa</span>
          </div>

          <h1 className="auth-heading">Crear cuenta</h1>
          <p className="auth-subheading">Completá tus datos para registrarte</p>

          {alert && (
            <div className={`auth-alert ${alert.type}`}>
              {alert.type === 'success' ? <IconCheck /> : <IconAlert />}
              <span>{alert.msg}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Nombre + Apellido */}
            <div className="field-row">
              <Field id="nombre"   label="Nombre"   icon={<IconUser />} placeholder="Juan"  autoComplete="given-name" />
              <Field id="apellido" label="Apellido" icon={<IconUser />} placeholder="García" autoComplete="family-name" />
            </div>

            {/* Email */}
            <Field id="email" label="Correo electrónico" icon={<IconMail />} type="email"
              placeholder="tu@email.com" autoComplete="email" />

            {/* Teléfono (opcional) */}
            <Field id="telefono" label="Teléfono (opcional)" icon={<IconPhone />} type="tel"
              placeholder="+54 11 0000-0000" autoComplete="tel" />

            {/* Password */}
            <Field id="password" label="Contraseña" icon={<IconLock />}
              placeholder="Mínimo 6 caracteres" autoComplete="new-password"
              showToggle show={showPass} onToggle={() => setShowPass(p => !p)} />

            {/* Confirm password */}
            <Field id="confirmPassword" label="Confirmar contraseña" icon={<IconLock />}
              placeholder="Repetí tu contraseña" autoComplete="new-password"
              showToggle show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />

            <button className="btn-submit" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner" />Registrando...</>
                : <>Crear cuenta <IconArrow /></>
              }
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tenés cuenta?{' '}
            <button className="auth-link" onClick={onNavigateLogin}>
              Iniciá sesión
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
