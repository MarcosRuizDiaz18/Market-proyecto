# EquipYa 🛠️

> Marketplace vecinal de alquiler de herramientas y servicios — Gran Buenos Aires, Argentina.

EquipYa conecta a vecinos que necesitan herramientas o servicios con quienes los ofrecen. Podés publicar lo que tenés, alquilar lo que necesitás y contactar al dueño por chat interno, todo en un solo lugar.

---

## 🗂️ Estructura del proyecto

```
proyecto/
├── Backend/
│   ├── configuracion/
│   │   └── baseDeDatos.js       # Conexión a MongoDB Atlas
│   ├── controladores/
│   │   ├── articuloControlador.js
│   │   └── usuarioControlador.js
│   ├── modelos/
│   │   ├── Articulo.js
│   │   └── Usuario.js
│   ├── rutas/
│   │   ├── articuloRutas.js
│   │   └── usuarioRutas.js
│   ├── uploads/                 # Imágenes subidas por los usuarios
│   ├── servidor.js              # Punto de entrada del backend
│   ├── package.json
│   └── .env                    # Variables de entorno (no incluido en el repo)
└── Frontend/
    ├── equipya_modificado.html  # Frontend monolítico
    └── avatar-defecto.jpg
```

---

## ⚙️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML · CSS · JavaScript (monolítico) |
| Mapas | Leaflet.js + OpenStreetMap + Nominatim |
| Backend | Node.js + Express.js |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | BCrypt (hasheo de contraseñas) |
| Imágenes | Multer (upload local) |
| Control de versiones | Git + GitHub |

---

## 🚀 Cómo correr el proyecto

### Requisitos previos
- Node.js v18 o superior
- Cuenta en MongoDB Atlas (o MongoDB local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/MarcosRuizDiaz18/Market-proyecto.git
cd Market-proyecto/proyecto/Backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` dentro de `Backend/` con el siguiente contenido:

```env
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@cluster.mongodb.net/<nombre_db>
PORT=3000
```

### 4. Iniciar el servidor

```bash
node servidor.js
```

Abrí el navegador en `http://localhost:3000` — el backend sirve también el frontend.

---

## 🔌 API REST — Endpoints

### 👤 Usuarios — `/api/usuarios`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/registro` | Crea un usuario nuevo con contraseña encriptada |
| POST | `/login` | Verifica credenciales y devuelve datos del usuario |
| GET | `/:id` | Devuelve el perfil público de un usuario |
| PUT | `/actualizar/:id` | Actualiza perfil, foto, coordenadas y ubicación |
| PUT | `/contrasena/:id` | Cambia la contraseña verificando la actual |
| POST | `/valorar` | Guarda una reseña y recalcula el promedio de valoración |
| DELETE | `/:id` | Elimina la cuenta permanentemente |

### 📦 Artículos — `/api/articulos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Lista artículos con filtros: radio, precio, categoría, estrellas, tipo, orden |
| POST | `/` | Crea una publicación nueva con hasta 5 imágenes |
| GET | `/:id` | Devuelve el detalle completo de un artículo |
| PUT | `/:id` | Actualiza título y precio de una publicación propia |
| DELETE | `/:id` | Elimina una publicación |

### 💬 Chats — `/api/chats`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/` | Envía un mensaje entre dos usuarios vinculado a un artículo |
| GET | `/` | Lista conversaciones con contador de mensajes sin leer |
| GET | `/mensajes` | Devuelve mensajes entre dos usuarios sobre un artículo |
| PUT | `/leer/:id` | Marca un mensaje como leído |

---

## 🗄️ Modelos de datos

### Usuario
- `nombre`, `email`, `contraseña` (BCrypt)
- `ubicacion`, `coordenadas` (para el mapa)
- `avatar`, `promedioValoracion`, `cantidadResenas`

### Artículo
- `titulo`, `descripcion`, `categoria`, `precioBase`
- `partido` (localidad), `imagenes` (hasta 5)
- `ofreceServicio`, `precioServicio`
- `vendedor` (sub-documento con datos del dueño)
- `estado`: `disponible` | `alquilado` | `pausado`

### Mensaje
- `emisor`, `receptor` (IDs de usuarios)
- `texto`, `leido`, `enviadoEn`
- `articuloId`, `tituloArticulo`

### Reseña
- `usuarioCalificado`, `usuarioCalificador`
- `puntuacion` (1-5), `comentario`

---

## 👥 Equipo

| Integrante | Rol |
|-----------|-----|
| Marcos Ruiz Díaz | Backend · Base de datos |
| Leandro | Backend · Infraestructura |
| Valen | Frontend · Documentación |
| Yami | Frontend · Integración IA |

---

## 📌 Notas

- Las imágenes subidas se guardan en `Backend/uploads/` de forma local.
- El archivo `.env` no está incluido en el repositorio por seguridad.
- El mapa usa OpenStreetMap y Nominatim, ambos gratuitos y sin API key.

---

*Proyecto universitario — Desarrollo de Software · 2026*
