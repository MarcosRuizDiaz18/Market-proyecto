const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");

const {
    registrarUsuario,
    obtenerPerfil,
    login,
    actualizarPerfil,
    cambiarContrasena,
    eliminarCuenta,
    valorarUsuario,
} = require("../controladores/usuarioControlador");

// ── Configuración de Multer para fotos de perfil ──────────────────────────────
// Destino: carpeta uploads/profiles/ (debe existir en la raíz del backend)
// Nombre:  timestamp + extensión original para evitar colisiones entre archivos
const almacenamiento = multer.diskStorage({
    destination: function (solicitud, archivo, cb) {
        cb(null, "./uploads/profiles");
    },
    filename: function (solicitud, archivo, cb) {
        const extension   = path.extname(archivo.originalname);
        const nombreUnico = `perfil-${Date.now()}${extension}`;
        cb(null, nombreUnico);
    },
});

// Filtro: solo imágenes (jpg, jpeg, png, webp)
const filtroImagenes = (solicitud, archivo, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const esExtensionValida = tiposPermitidos.test(path.extname(archivo.originalname).toLowerCase());
    const esMimeValido      = tiposPermitidos.test(archivo.mimetype);

    if (esExtensionValida && esMimeValido) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten imágenes (jpg, jpeg, png, webp)."));
    }
};

const subirFoto = multer({
    storage:    almacenamiento,
    limits:     { fileSize: 2 * 1024 * 1024 }, // Límite: 2 MB
    fileFilter: filtroImagenes,
});

// ── Rutas ─────────────────────────────────────────────────────────────────────

// POST /api/usuarios/registro
router.post("/registro", registrarUsuario);

// POST /api/usuarios/login
router.post("/login", login);

// POST /api/usuarios/valorar
// Guarda una reseña y recalcula el promedioValoracion del vendedor.
// Body: { usuarioCalificado, usuarioCalificador, puntuacion, comentario? }
router.post("/valorar", valorarUsuario);

// PUT /api/usuarios/actualizar/:id
// Multer procesa el campo "fotoPerfil" del form-data antes de llegar al controlador.
// Si no se sube imagen, req.file es undefined y el controlador lo omite sin error.
router.put("/actualizar/:id", subirFoto.single("fotoPerfil"), actualizarPerfil);

// PUT /api/usuarios/contrasena/:id
// Verifica la contraseña actual con bcrypt antes de permitir el cambio.
router.put("/contrasena/:id", cambiarContrasena);

// DELETE /api/usuarios/:id
// Elimina el usuario de la base de datos de forma permanente.
router.delete("/:id", eliminarCuenta);

// GET /api/usuarios/:id
// ⚠️  Debe ir ÚLTIMA: /:id capturaría "registro", "login", "valorar", etc. si va antes
router.get("/:id", obtenerPerfil);

module.exports = router;
