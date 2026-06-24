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
    cb(null, "uploads/");
  },
  filename: function(solicitud, archivo, cb) {
    cb(null, Date.now() + path.extname(archivo.originalname));
  }
});

const upload = multer({
  storage: configuracionAlmacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite por archivo: 5 MB
});

enrutador.route("/")
  .get(obtenerArticulos)
  // upload.array("imagenes", 5) → acepta hasta 5 archivos con el campo "imagenes"
  .post(upload.array("imagenes", 5), crearArticulo);

enrutador.route("/:id")
  .get(obtenerArticuloPorId)
  .put(actualizarArticulo)
  .delete(eliminarArticulo);

module.exports = enrutador;