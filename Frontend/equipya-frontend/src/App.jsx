import { useState } from 'react'
import AuthPage from './pages/auth/AuthPage'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [vista, setVista]     = useState('home')   // 'home' | 'detail'
  const [articuloId, setArticuloId] = useState(null)

  if (!usuario) {
    return <AuthPage onLoginSuccess={(data) => setUsuario(data.usuario || data)} />
  }

  if (vista === 'detail' && articuloId) {
    return (
      <ProductDetail
        articuloId={articuloId}
        onBack={() => setVista('home')}
      />
    )
  }

  return (
    <Home
      usuario={usuario}
      onLogout={() => setUsuario(null)}
      onNavigateDetail={(item) => {
        setArticuloId(item._id)
        setVista('detail')
      }}
    />
  )
}
