import { useState, useEffect, useRef } from 'react';
import './Home.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TABS = ['Todo','Productos','Servicios','Camaras','Herramientas','Electricidad','Plomeria'];
const COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#EF4444'];

const STATIC_SERVICES = [
  { _id:'s1', type:'service', vendedor:{nombre:'electro_fer'}, verified:true, titulo:'Electricista Matriculado', categoria:'Electricidad', puntuacion:5, localidad:'CABA y GBA', precioBase:8000, emoji:'⚡' },
  { _id:'s2', type:'service', vendedor:{nombre:'plomero_luis'}, verified:true, titulo:'Plomeria y Desagote', categoria:'Plomeria', puntuacion:4, localidad:'Palermo/Belgrano', precioBase:6500, emoji:'🔧' },
  { _id:'s3', type:'service', vendedor:{nombre:'pintu_pro'}, verified:false, titulo:'Pintura Interior/Exterior', categoria:'Pintura', puntuacion:4, localidad:'Zona Norte GBA', precioBase:9000, emoji:'🎨' },
];

const IMAGENES = {
  'Taladro':      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80',
  'Amoladora':    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
  'Sierra':       'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80',
  'Compresor':    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'Motosierra':   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
  'Nivel':        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
  'Andamio':      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'Rotomartillo': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80',
  'Hidrolavadora':'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'Pulidora':     'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
  'Cortadora':    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80',
  'Mezcladora':   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'Camara':       'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
  'Lente':        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&q=80',
  'Drone':        'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80',
  'GoPro':        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80',
  'Iluminacion':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'Generador':    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
  'Cortacesped':  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
  'Bordeadora':   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
  'Escalera':     'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'Carretilla':   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'Vibrador':     'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'General':      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
};

function getImagen(titulo) {
  const key = Object.keys(IMAGENES).find(k => (titulo || '').includes(k));
  return key ? IMAGENES[key] : IMAGENES['General'];
}

function getInitials(name='') { return (name||'').split('_').map(p=>p[0]?.toUpperCase()||'').join('').slice(0,2)||'??'; }
function getColor(name='') { return COLORS[(name||'').charCodeAt(0) % COLORS.length]; }

function StarRating({ rating=0, size=13 }) {
  return (
    <div className="ey-stars">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=rating?'#F5B800':'#E0E0E0'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24">
      <path d="M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#3B82F6" strokeWidth="2" fill="none"/>
      <path d="M9 12l2 2 4-4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Card({ item, liked, saved, onLike, onSave, onCardClick }) {
  const isService = item.type === 'service';
  const priceLabel = isService ? '/visita' : '/dia';
  const savings = Math.round((item.precioBase||0) * 12);
  const userName = item.vendedor?.nombre || 'usuario';
  const location = item.localidad ? `${item.localidad}${item.partido?', '+item.partido:''}` : 'Buenos Aires';

  return (
    <div className="ey-card" onClick={() => onCardClick(item)}>
      {isService && <div className="ey-service-label">SERVICIO</div>}
      <div className="ey-card-header">
        <div className="ey-card-user">
          <div className="ey-avatar" style={{width:28,height:28,fontSize:10,background:getColor(userName)}}>
            {getInitials(userName)}
          </div>
          <span className="ey-card-username">{userName}</span>
          {item.verified && <VerifiedBadge />}
        </div>
        <button className="ey-save-btn" onClick={e=>{e.stopPropagation();onSave(item._id);}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={saved?'#F5B800':'none'} stroke={saved?'#F5B800':'#999'} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
      <div className="ey-card-img">
        <img
          src={getImagen(item.titulo)}
          alt={item.titulo}
          style={{width:'100%',height:'100%',objectFit:'cover'}}
          onError={e=>{e.target.style.display='none';}}
        />
      </div>
      <div className="ey-card-body">
        <div className="ey-card-name" title={item.titulo}>{item.titulo}</div>
        {isService && <div className="ey-card-category">{item.categoria}</div>}
        <StarRating rating={item.vendedor?.reputacion||item.puntuacion||0} />
        <div className="ey-card-meta">
          <div className="ey-card-location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {location}
          </div>
          <div className="ey-price-badge">${(item.precioBase||0).toLocaleString('es-AR')}{priceLabel}</div>
        </div>
        <div className="ey-card-saving">
          {isService ? 'Presupuesto sin cargo · Responde en <1h' : `Ahorro: $${savings.toLocaleString('es-AR')} vs. compra nuevo`}
        </div>
        <div className="ey-card-actions">
          <button className="ey-action-btn" onClick={e=>{e.stopPropagation();onLike(item._id);}} style={{color:liked?'#F5B800':'#999'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked?'#F5B800':'none'} stroke={liked?'#F5B800':'#999'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            Me gusta
          </button>
          <button className="ey-action-btn" onClick={e=>e.stopPropagation()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Comentar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home({ usuario, onLogout, onNavigateDetail }) {
  const [articulos, setArticulos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('Todo');
  const [search, setSearch]         = useState('');
  const [likedSet, setLikedSet]     = useState(new Set());
  const [savedSet, setSavedSet]     = useState(new Set());
  const [showChat, setShowChat]     = useState(false);
  const [showAI, setShowAI]         = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState('Producto');
  const [aiMessages, setAiMessages] = useState([
    { role:'bot', text:'Hola! Soy tu asistente EquipYa. Preguntame que vas a construir, reparar o instalar y te digo que herramientas necesitas y el paso a paso.' }
  ]);
  const [aiInput, setAiInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const aiBottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/articulos`)
      .then(r=>r.json())
      .then(data=>{
        const fromBack = (data.articulos||[]).map(a=>({...a,type:'product'}));
        setArticulos([...fromBack,...STATIC_SERVICES]);
      })
      .catch(()=>setArticulos(STATIC_SERVICES))
      .finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{ aiBottomRef.current?.scrollIntoView({behavior:'smooth'}); },[aiMessages]);

  const filtered = articulos.filter(item=>{
    const q = search.toLowerCase();
    const matchQ = !q||(item.titulo||'').toLowerCase().includes(q)||(item.localidad||'').toLowerCase().includes(q)||(item.categoria||'').toLowerCase().includes(q);
    if (!matchQ) return false;
    if (activeTab==='Todo') return true;
    if (activeTab==='Productos') return item.type==='product';
    if (activeTab==='Servicios') return item.type==='service';
    if (activeTab==='Camaras') return /camara|drone|gopro|lente/i.test(item.titulo||'');
    if (activeTab==='Herramientas') return /taladro|amoladora|sierra|compresor|motosierra|generador|nivel|andamio|rotomartillo|hidrolavadora|pulidora|cortadora|mezcladora|escalera|carretilla|vibrador|bordeadora|cortacesped/i.test(item.titulo||'');
    if (activeTab==='Electricidad') return /electri/i.test(item.categoria||'');
    if (activeTab==='Plomeria') return /plomer/i.test(item.categoria||'');
    return true;
  });

  const toggleLike = id=>setLikedSet(prev=>{const s=new Set(prev);s.has(id)?s.delete(id):s.add(id);return s;});
  const toggleSave = id=>setSavedSet(prev=>{const s=new Set(prev);s.has(id)?s.delete(id):s.add(id);return s;});

  const sendAI = async(preset)=>{
    const msg = preset||aiInput.trim();
    if (!msg) return;
    setAiInput('');
    setShowChips(false);
    setAiMessages(prev=>[...prev,{role:'user',text:msg}]);
    setAiLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:1000,
          system:`Sos el asistente de EquipYa, plataforma argentina de alquiler de herramientas y servicios. Ayuda al usuario con que herramientas necesita. Responde en espanol rioplatense. Formato: primero "Herramientas que necesitas:", luego "Paso a paso:", luego "Tip EquipYa:".`,
          messages:[{role:'user',content:msg}]
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==='text')?.text||'No pude procesar tu consulta.';
      setAiMessages(prev=>[...prev,{role:'bot',text:reply}]);
    } catch {
      setAiMessages(prev=>[...prev,{role:'bot',text:'Ups, hubo un error. Intenta de nuevo.'}]);
    } finally { setAiLoading(false); }
  };

  const avatarName = usuario?.nombre||'YO';
  const avatarInitials = avatarName.split(' ').map(p=>p[0]?.toUpperCase()||'').join('').slice(0,2);

  return (
    <div>
      <header className="ey-header">
        <div className="ey-logo">Equip<span>Ya</span></div>
        <div className="ey-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Buscar herramientas, servicios, zonas..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="ey-header-right">
          <button className="ey-btn-ai" onClick={()=>setShowAI(true)}>Asistente IA</button>
          <button className="ey-btn-upload" onClick={()=>setShowUpload(true)}>+ Subir</button>
          <div className="ey-avatar" style={{background:getColor(avatarName)}} title={avatarName}>{avatarInitials}</div>
        </div>
      </header>

      <div className="ey-tabs">
        {TABS.map(t=>(
          <button key={t} className={`ey-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div className="ey-body">
        <aside className="ey-aside">
          <div className="ey-map">
            <svg width="100%" height="100%">
              {[30,60,90,120,150].map(y=><line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="#CBD5E1" strokeWidth="0.6"/>)}
              {[30,60,90,120,150,180,210].map(x=><line key={x} x1={x} y1="0" x2={x} y2="100%" stroke="#CBD5E1" strokeWidth="0.6"/>)}
              <path d="M0,90 Q60,80 120,95 Q180,110 260,85" stroke="#fff" strokeWidth="6" fill="none"/>
              <path d="M30,0 Q45,60 40,170" stroke="#fff" strokeWidth="4" fill="none"/>
              <text x="105" y="62" fontSize="14">📍</text>
              <text x="45" y="58" fontSize="14">📍</text>
              <text x="75" y="95" fontSize="14">📍</text>
            </svg>
            <div className="ey-map-lbl">Buenos Aires</div>
            <div className="ey-map-zoom"><button>+</button><button>−</button></div>
          </div>

          <div className="ey-filter-section">
            <div className="ey-filter-title">
              <div className="ey-filter-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span>Fechas</span>
            </div>
            <input type="date" className="ey-inp"/>
          </div>
          <div className="ey-divider"/>

          <div className="ey-filter-section">
            <div className="ey-filter-title">
              <div className="ey-filter-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                </svg>
              </div>
              <span>Zona</span>
            </div>
            <button className="ey-btn-sede">Sede Facultad</button>
            <input type="text" className="ey-inp" placeholder="Buscar ubicacion..."/>
            <div className="ey-km-btns">
              <button className="ey-km-btn">2 km</button>
              <button className="ey-km-btn">5 km</button>
              <button className="ey-km-btn">10 km</button>
            </div>
          </div>
          <div className="ey-divider"/>

          <div className="ey-filter-section">
            <div className="ey-filter-title">
              <div className="ey-filter-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <span>Precio</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:6}}>
              <span style={{background:'#E2FF00',borderRadius:6,padding:'1px 7px',fontWeight:700,color:'#111'}}>$2.000</span>
              <span style={{background:'#E2FF00',borderRadius:6,padding:'1px 7px',fontWeight:700,color:'#111'}}>$30.000</span>
            </div>
            <input type="range" className="ey-inp" style={{padding:0}} min="0" max="50000" defaultValue="30000"/>
          </div>
          <div className="ey-divider"/>

          <button className="ey-btn-filter">Aplicar filtros</button>
        </aside>

        <main className="ey-main">
          <div className="ey-ai-banner" onClick={()=>setShowAI(true)}>
            <div className="ey-ai-icon">🤖</div>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:'#E2FF00'}}>No sabes que herramientas necesitas?</div>
              <div style={{fontSize:12,color:'#888',marginTop:2}}>Preguntale a nuestro asistente IA y te dice el paso a paso</div>
            </div>
            <div className="ey-banner-arrow">→</div>
          </div>

          <div className="ey-feed-meta">
            <span className="ey-feed-count">{filtered.length} resultado{filtered.length!==1?'s':''}</span>
          </div>

          {loading ? (
            <div className="ey-loading"><div className="ey-spinner-lg"/><div>Cargando articulos...</div></div>
          ) : filtered.length===0 ? (
            <div className="ey-empty"><div className="ey-empty-icon">🔍</div><p>{search?`No encontramos resultados para "${search}"` :'No hay resultados'}</p></div>
          ) : (
            <div className="ey-grid">
              {filtered.map(item=>(
                <Card key={item._id} item={item} liked={likedSet.has(item._id)} saved={savedSet.has(item._id)} onLike={toggleLike} onSave={toggleSave} onCardClick={onNavigateDetail}/>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* CHAT */}
      <div className="ey-chat-wrap">
        {showChat && (
          <div className="ey-chat-panel">
            <div className="ey-chat-panel-header">
              <span>Chat Directo</span>
              <button className="ey-chat-close" onClick={()=>setShowChat(false)}>×</button>
            </div>
            <div className="ey-chat-info">Conectate con el dueno directamente</div>
            <input className="ey-chat-input" placeholder="Escribe un mensaje..."/>
          </div>
        )}
        <button className="ey-chat-bubble-btn" onClick={()=>setShowChat(c=>!c)}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#E2FF00" strokeWidth="2.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <div className="ey-chat-notif">1</div>
        </button>
        <span className="ey-chat-label">Chat Directo</span>
      </div>

      {/* AI MODAL */}
      {showAI && (
        <div className="ey-modal-overlay" onClick={()=>setShowAI(false)}>
          <div className="ey-ai-modal" onClick={e=>e.stopPropagation()}>
            <div className="ey-ai-modal-header">
              <div className="ey-ai-modal-icon">🤖</div>
              <div>
                <div className="ey-ai-modal-title">Asistente EquipYa</div>
                <div className="ey-ai-modal-sub">Powered by IA · Te ayuda a construir</div>
              </div>
              <button className="ey-ai-modal-close" onClick={()=>setShowAI(false)}>×</button>
            </div>
            {showChips && (
              <div className="ey-quick-chips">
                {['Que necesito para armar un placard?','Como instalo un piso flotante','Herramientas para colgar muebles','Quiero pintar una habitacion'].map(c=>(
                  <button key={c} className="ey-chip" onClick={()=>sendAI(c)}>{c}</button>
                ))}
              </div>
            )}
            <div className="ey-ai-messages">
              {aiMessages.map((m,i)=>(
                <div key={i} className={`ey-msg-row ${m.role==='user'?'user':''}`}>
                  {m.role==='bot'&&<div className="ey-msg-bot-icon">🤖</div>}
                  <div className={`ey-msg-bubble ${m.role==='bot'?'bot':'user'}`} dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,'<br/>')}}/>
                </div>
              ))}
              {aiLoading&&(
                <div className="ey-msg-row">
                  <div className="ey-msg-bot-icon">🤖</div>
                  <div className="ey-msg-bubble bot"><div className="ey-typing"><span className="ey-typing-dot"/><span className="ey-typing-dot"/><span className="ey-typing-dot"/></div></div>
                </div>
              )}
              <div ref={aiBottomRef}/>
            </div>
            <div className="ey-ai-input-row">
              <input className="ey-ai-text-input" placeholder="Ej: Quiero armar una biblioteca..." value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAI()}/>
              <button className="ey-ai-send" onClick={()=>sendAI()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E2FF00" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="ey-modal-overlay" onClick={()=>setShowUpload(false)}>
          <div className="ey-upload-modal" onClick={e=>e.stopPropagation()}>
            <div className="ey-upload-title">Subir publicacion</div>
            <div className="ey-upload-sub">Producto o servicio para ofrecer</div>
            <div className="ey-type-btns">
              <button className={`ey-type-btn ${uploadType==='Producto'?'active':'inactive'}`} onClick={()=>setUploadType('Producto')}>Producto</button>
              <button className={`ey-type-btn ${uploadType==='Servicio'?'active':'inactive'}`} onClick={()=>setUploadType('Servicio')}>Servicio</button>
            </div>
            <label className="ey-field-lbl">Nombre</label>
            <input className="ey-field-inp" placeholder={uploadType==='Producto'?'Ej: Taladro Bosch':'Ej: Electricista'}/>
            <label className="ey-field-lbl">Precio</label>
            <input className="ey-field-inp" placeholder="$0.000"/>
            <label className="ey-field-lbl">Ubicacion</label>
            <input className="ey-field-inp" placeholder="Barrio, Ciudad"/>
            <div className="ey-upload-area"><div style={{fontSize:24}}>📷</div><div style={{fontSize:11,color:'#999',marginTop:4}}>Subir fotos</div></div>
            <button className="ey-btn-publish" onClick={()=>setShowUpload(false)}>Publicar</button>
          </div>
        </div>
      )}
    </div>
  );
}
