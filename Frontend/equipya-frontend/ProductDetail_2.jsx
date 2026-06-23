import { useState, useEffect } from "react";

// ─── CONFIGURACIÓN ─────────────────────────────────────────────────────────
// Cambiá esta URL cuando el backend esté desplegado en producción
const API_URL = "http://localhost:3000";

// ID temporal para desarrollo — reemplazar cuando haya navegación entre pantallas
const ID_ARTICULO_PRUEBA = "PEGAR_AQUI_UN_ID_REAL_DE_MONGODB";

// ─── Componente: Estrellas ──────────────────────────────────────────────────
function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#D4FF00" : "none"}
          stroke="#D4FF00" strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ─── Componente: Galería ───────────────────────────────────────────────────
function ImageGallery({ disponible }) {
  const [active, setActive] = useState(0);
  const colors = ["#1a1a1a", "#141414", "#111", "#0d0d0d"];
  const labels = ["Vista frontal", "Lateral", "Detalle", "Completo"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        background: colors[active], borderRadius: 16, height: 320,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid #2a2a2a", position: "relative", overflow: "hidden",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🔧</div>
          <div style={{ color: "#555", fontSize: 13, fontFamily: "monospace" }}>
            {labels[active]}
          </div>
        </div>
        {disponible && (
          <div style={{
            position: "absolute", top: 16, left: 16,
            background: "#D4FF00", color: "#000",
            fontSize: 11, fontWeight: 700, padding: "4px 10px",
            borderRadius: 20, letterSpacing: 0.5,
          }}>
            DISPONIBLE
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {colors.map((c, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            flex: 1, height: 68, background: c, borderRadius: 10,
            border: active === i ? "2px solid #D4FF00" : "1px solid #2a2a2a",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 22, transition: "border 0.15s",
          }}>
            🔧
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente: Selector de fechas ────────────────────────────────────────
function DatePicker({ precioBase, precioRetail }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const dias = start && end
    ? Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)))
    : 0;

  const inputStyle = {
    width: "100%", background: "#111", border: "1px solid #2a2a2a",
    borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box", colorScheme: "dark",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ color: "#888", fontSize: 11, fontWeight: 600, letterSpacing: 1, display: "block", marginBottom: 6 }}>
            DESDE
          </label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ color: "#888", fontSize: 11, fontWeight: 600, letterSpacing: 1, display: "block", marginBottom: 6 }}>
            HASTA
          </label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {dias > 0 && (
        <div style={{
          background: "#0d1a00", border: "1px solid #D4FF00", borderRadius: 10,
          padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: "#D4FF00", fontSize: 12, fontWeight: 600 }}>
              {dias} {dias === 1 ? "día" : "días"}
            </div>
            {precioRetail && (
              <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
                Ahorrás ${(precioRetail - precioBase * dias).toLocaleString("es-AR")} vs. comprar nuevo
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
              ${(precioBase * dias).toLocaleString("es-AR")}
            </div>
            <div style={{ color: "#555", fontSize: 11 }}>total</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function ProductDetail({ articuloId }) {
  const [articulo, setArticulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("descripcion");

  // Usar el ID que venga por prop, o el de prueba si no hay ninguno
  const id = articuloId || ID_ARTICULO_PRUEBA;

  useEffect(() => {
    setCargando(true);
    setError(null);

    fetch(`${API_URL}/api/articulos/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setArticulo(data.articulo);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, [id]);

  // ── Estados de carga y error ─────────────────────────────────────────────
  if (cargando) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
          <div style={{ color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Cargando artículo...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: "#1a0000", border: "1px solid #ff4444", borderRadius: 14,
          padding: 32, textAlign: "center", maxWidth: 400,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
          <div style={{ color: "#ff6666", fontWeight: 700, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            No se pudo cargar el artículo
          </div>
          <div style={{ color: "#555", fontSize: 13, fontFamily: "monospace" }}>{error}</div>
          <div style={{ color: "#444", fontSize: 12, marginTop: 12 }}>
            Verificá que el backend esté corriendo en {API_URL}
          </div>
        </div>
      </div>
    );
  }

  if (!articulo) return null;

  // ── Mapeo de campos del backend al frontend ──────────────────────────────
  const disponible = articulo.estado === "disponible";
  const ubicacion = `${articulo.localidad}, ${articulo.partido}`;
  const tipoCobro = articulo.tipoCobro || "por día";

  const tabStyle = (tab) => ({
    padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none",
    background: activeTab === tab ? "#D4FF00" : "transparent",
    color: activeTab === tab ? "#000" : "#666",
    transition: "all 0.15s", fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#fff",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      {/* Navbar */}
      <div style={{
        background: "#000", borderBottom: "1px solid #1a1a1a",
        padding: "14px 24px", display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button style={{
          background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10,
          padding: "8px 10px", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
          Equip<span style={{ color: "#D4FF00" }}>Ya</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setLiked(!liked)} style={{
          background: liked ? "#1a1a00" : "#1a1a1a",
          border: liked ? "1px solid #D4FF00" : "1px solid #2a2a2a",
          borderRadius: 10, padding: "8px 10px", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={liked ? "#D4FF00" : "none"}
            stroke={liked ? "#D4FF00" : "#fff"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        {/* Breadcrumb */}
        <div style={{ color: "#555", fontSize: 12, marginBottom: 20, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ cursor: "pointer", color: "#888" }}>Inicio</span>
          <span>/</span>
          <span style={{ cursor: "pointer", color: "#888" }}>{articulo.categoria}</span>
          <span>/</span>
          <span style={{ color: "#D4FF00" }}>{articulo.titulo}</span>
        </div>

        {/* Grid principal */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

          {/* Columna izquierda — Galería */}
          <div>
            <ImageGallery disponible={disponible} />

            {/* Badge de estado si no está disponible */}
            {!disponible && (
              <div style={{
                marginTop: 12, background: "#1a0a00", border: "1px solid #ff6600",
                borderRadius: 10, padding: "8px 14px", fontSize: 13,
                color: "#ff8844", fontWeight: 600, textAlign: "center",
              }}>
                {articulo.estado === "alquilado" ? "🔴 Actualmente alquilado" : "⏸ Pausado por el dueño"}
              </div>
            )}
          </div>

          {/* Columna derecha — Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Encabezado */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6,
                  padding: "3px 10px", fontSize: 11, color: "#888", fontWeight: 600, letterSpacing: 0.5,
                }}>
                  {articulo.categoria.toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.2, letterSpacing: -0.5 }}>
                {articulo.titulo}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <StarRating rating={articulo.vendedor?.reputacion || 0} />
                <span style={{ color: "#D4FF00", fontWeight: 700, fontSize: 14 }}>
                  {articulo.vendedor?.reputacion || "—"}
                </span>
                <span style={{ color: "#555" }}>·</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#888", fontSize: 13 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {ubicacion}
                </div>
              </div>
            </div>

            {/* Precio */}
            <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#D4FF00", letterSpacing: -1 }}>
                  ${articulo.precioBase.toLocaleString("es-AR")}
                </span>
                <span style={{ color: "#555", fontSize: 14 }}>/{tipoCobro.replace("por ", "")}</span>
              </div>
              {articulo.ofreceServicio && articulo.precioServicio && (
                <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                  + servicio del dueño: ${articulo.precioServicio.toLocaleString("es-AR")}
                </div>
              )}
            </div>

            {/* Card del vendedor */}
            <div style={{
              background: "#111", border: "1px solid #2a2a2a", borderRadius: 14,
              padding: 16, display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", background: "#1D9E75",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0,
              }}>
                {articulo.vendedor?.nombre?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{articulo.vendedor?.nombre || "Vendedor"}</div>
                <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>Vendedor verificado</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#D4FF00", fontWeight: 700, fontSize: 15 }}>
                  {articulo.vendedor?.reputacion ?? "—"}
                </div>
                <div style={{ color: "#555", fontSize: 11 }}>valoración</div>
              </div>
            </div>

            {/* Selector de fechas */}
            <div>
              <div style={{ color: "#888", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>
                ELEGÍ TUS FECHAS
              </div>
              <DatePicker precioBase={articulo.precioBase} />
            </div>

            {/* Botones */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                disabled={!disponible}
                style={{
                  background: disponible ? "#D4FF00" : "#2a2a2a",
                  color: disponible ? "#000" : "#555",
                  border: "none", borderRadius: 12, padding: "16px",
                  fontSize: 16, fontWeight: 800, cursor: disponible ? "pointer" : "not-allowed",
                  fontFamily: "inherit", letterSpacing: -0.3, transition: "opacity 0.15s",
                }}
                onMouseOver={(e) => disponible && (e.target.style.opacity = 0.9)}
                onMouseOut={(e) => (e.target.style.opacity = 1)}
              >
                {disponible ? "Reservar ahora" : "No disponible"}
              </button>
              <button style={{
                background: "transparent", color: "#fff", border: "1px solid #2a2a2a",
                borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat directo con el dueño
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 40 }}>
          <div style={{
            display: "flex", gap: 4, background: "#111",
            border: "1px solid #1a1a1a", borderRadius: 24, padding: 4,
            width: "fit-content", marginBottom: 24,
          }}>
            {["descripcion", "especificaciones"].map((tab) => (
              <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "descripcion" && (
            <div style={{
              background: "#111", border: "1px solid #1a1a1a", borderRadius: 14,
              padding: 24, color: "#ccc", lineHeight: 1.7, fontSize: 15,
            }}>
              {articulo.descripcion || "Sin descripción disponible."}
            </div>
          )}

          {activeTab === "especificaciones" && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 14, overflow: "hidden" }}>
              {[
                { label: "Categoría", value: articulo.categoria },
                { label: "Tipo de cobro", value: articulo.tipoCobro },
                { label: "Partido", value: articulo.partido },
                { label: "Localidad", value: articulo.localidad },
                { label: "Ofrece servicio", value: articulo.ofreceServicio ? "Sí" : "No" },
                { label: "Estado", value: articulo.estado },
              ].map((spec, i, arr) => (
                <div key={spec.label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "14px 24px",
                  borderBottom: i < arr.length - 1 ? "1px solid #1a1a1a" : "none",
                }}>
                  <span style={{ color: "#666", fontSize: 14 }}>{spec.label}</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{spec.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
