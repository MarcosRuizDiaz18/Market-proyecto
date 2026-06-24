// rutas/chatRutas.js
const express = require("express");
const enrutador = express.Router();

const {
  enviarMensaje,
  obtenerConversaciones,
  obtenerMensajesConversacion,
  marcarLeido,
} = require("../controladores/chatControlador");

// ── Rutas ──────────────────────────────────────────────────────────────────

// POST /api/chats
// Envía un mensaje nuevo entre dos usuarios.
enrutador.post("/", enviarMensaje);

// GET /api/chats?usuarioId=xxx&soloSinLeer=true
// Lista conversaciones agrupadas del usuario (con contador de sin leer).
enrutador.get("/", obtenerConversaciones);

// GET /api/chats/mensajes?usuarioId=xxx&contraparteId=yyy&articuloId=zzz
// ⚠️ Debe ir ANTES de /:id para que "mensajes" no sea capturado como parámetro.
enrutador.get("/mensajes", obtenerMensajesConversacion);

// PUT /api/chats/leer/:id
// Marca un mensaje individual como leído.
enrutador.put("/leer/:id", marcarLeido);

module.exports = enrutador;
