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

const multer =require("multer");
const path =require("path");

const configuracionAlmacenamiento = multer.diskStorage({
  destination: function (solicitud, archivo, cb){
    cb(null, "uploads/"); //guarda fisicamente en la carpeta uploads
  },
  filename: function(solicitud, archivo, cb) {
    //le pone la fecha exacta por delante para evitar nombres duplicados
    cb(null, Date.now() + path.extname(archivo.originalname));
  }
});

const upload = multer({ storage: configuracionAlmacenamiento });
// ┌─────────────────────────────────────────────────────────────┐
// │  Método  │  Ruta                  │  Acción                 │
// ├─────────────────────────────────────────────────────────────┤
// │  GET     │  /api/articulos        │  Lista con filtros      │
// │  POST    │  /api/articulos        │  Crear artículo         │
// │  GET     │  /api/articulos/:id    │  Detalle por ID         │
// │  PUT     │  /api/articulos/:id    │  Actualizar por ID      │
// │  DELETE  │  /api/articulos/:id    │  Eliminar por ID        │
// └─────────────────────────────────────────────────────────────┘

enrutador.route("/")
  .get(obtenerArticulos)
  .post(upload.single("imagen"), crearArticulo);

enrutador.route("/:id")
  .get(obtenerArticuloPorId)
  .put(actualizarArticulo)
  .delete(eliminarArticulo);

module.exports = enrutador;
