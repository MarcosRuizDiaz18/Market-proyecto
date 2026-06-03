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
  .post(crearArticulo);

enrutador.route("/:id")
  .get(obtenerArticuloPorId)
  .put(actualizarArticulo)
  .delete(eliminarArticulo);

module.exports = enrutador;
