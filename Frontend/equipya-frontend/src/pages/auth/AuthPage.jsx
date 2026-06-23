/**
 * AuthPage.jsx
 * Componente contenedor que maneja la navegación entre Login y Register.
 * 
 * Uso en App.jsx / tu router:
 *   <AuthPage onLoginSuccess={(data) => { /* redirigir al home *\/ }} />
 */
import { useState } from 'react';
import Login    from './Login';
import Register from './Register';

export default function AuthPage({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login' | 'register'

  return view === 'login'
    ? <Login
        onNavigateRegister={() => setView('register')}
        onLoginSuccess={onLoginSuccess}
      />
    : <Register
        onNavigateLogin={() => setView('login')}
        onRegisterSuccess={() => setView('login')}
      />;
}
