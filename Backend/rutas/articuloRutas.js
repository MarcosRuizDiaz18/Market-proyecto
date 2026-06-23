// rutas/articuloRutas.js
const express = require("express");
const enrutador = express.Router();
const {
  crearArticulo,
  obtenerArticulos,
  obtenerArticuloPorId,
  actualizarArticulo,
  eliminarArticulo,
} = require("../controladores/articuloControlador");

const multer = require("multer");
const path = require("path");

// Configuración de almacenamiento local para archivos adjuntos (Imágenes de herramientas)
const configuracionAlmacenamiento = multer.diskStorage({
  destination: function (solicitud, archivo, cb) {
    cb(null, "uploads/"); // Guarda físicamente las fotos en la carpeta local uploads
  },
  filename: function (solicitud, archivo, cb) {
    // Inyecta la marca de tiempo exacta para prevenir colisiones de nombres duplicados
    cb(null, Date.now() + path.extname(archivo.originalname));
  }
});

const upload = multer({ storage: configuracionAlmacenamiento });

// ┌─────────────────────────────────────────────────────────────┐
// │  Método  │  Ruta                  │  Acción                 │
// ├─────────────────────────────────────────────────────────────┤
// │  GET     │  /api/articulos        │  Lista con filtros      │
// │  POST    │  /api/articulos        │  Crear artículo + Foto  │
// │  GET     │  /api/articulos/:id    │  Detalle por ID         │
// │  PUT     │  /api/articulos/:id    │  Actualizar por ID      │
// │  DELETE  │  /api/articulos/:id    │  Eliminar por ID        │
// └─────────────────────────────────────────────────────────────┘

enrutador.route("/")
  .get(obtenerArticulos)
  .post(upload.single("imagen"), crearArticulo); // Inyecta de forma segura el interceptor de imágenes

enrutador.route("/:id")
  .get(obtenerArticuloPorId)
  .put(actualizarArticulo)
  .delete(eliminarArticulo);

module.exports = enrutador;