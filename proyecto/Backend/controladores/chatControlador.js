// controladores/chatControlador.js
const mongoose = require("mongoose");
const Mensaje  = require("../modelos/Mensaje");
const Usuario  = require("../modelos/Usuario");

// ─── Helper: normalizar ID ─────────────────────────────────────────────────
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/chats
// Envía un nuevo mensaje de emisor → receptor.
// Body: { emisorId, receptorId, texto, articuloId?, tituloArticulo? }
// ══════════════════════════════════════════════════════════════════════════════
const enviarMensaje = async (solicitud, respuesta, siguiente) => {
  try {
    const { emisorId, receptorId, texto, articuloId, tituloArticulo } = solicitud.body;

    if (!emisorId || !receptorId || !texto?.trim()) {
      return respuesta.status(400).json({
        error: "emisorId, receptorId y texto son obligatorios.",
      });
    }

    if (!esIdValido(emisorId) || !esIdValido(receptorId)) {
      return respuesta.status(400).json({ error: "IDs de usuario no válidos." });
    }

    if (emisorId === receptorId) {
      return respuesta.status(400).json({ error: "No podés enviarte un mensaje a vos mismo." });
    }

    const nuevoMensaje = new Mensaje({
      emisor:          emisorId,
      receptor:        receptorId,
      texto:           texto.trim(),
      articuloId:      articuloId && esIdValido(articuloId) ? articuloId : null,
      tituloArticulo:  tituloArticulo?.trim() || null,
    });

    const mensajeGuardado = await nuevoMensaje.save();

    respuesta.status(201).json({
      mensaje: "Mensaje enviado correctamente.",
      dato:    mensajeGuardado,
    });
  } catch (error) {
    siguiente(error);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/chats?usuarioId=xxx&soloSinLeer=true
// Devuelve todas las conversaciones del usuario agrupadas por "contraparte".
// Cada conversación tiene: contraparte (id+nombre+avatar), último mensaje,
// cantidad de mensajes sin leer, artículo vinculado.
// ══════════════════════════════════════════════════════════════════════════════
const obtenerConversaciones = async (solicitud, respuesta, siguiente) => {
  try {
    const { usuarioId, soloSinLeer } = solicitud.query;

    if (!usuarioId || !esIdValido(usuarioId)) {
      return respuesta.status(400).json({ error: "usuarioId requerido y debe ser válido." });
    }

    const idObj = new mongoose.Types.ObjectId(usuarioId);

    // Traemos todos los mensajes donde el usuario participa
    const mensajes = await Mensaje.find({
      $or: [{ emisor: idObj }, { receptor: idObj }],
    })
      .populate("emisor",   "nombre apellido avatar")
      .populate("receptor", "nombre apellido avatar")
      .sort({ enviadoEn: -1 });

    // Agrupamos por "clave de conversación": par (usuarioA, usuarioB) + artículo
    // La clave ordena los IDs para que sea simétrica (A-B == B-A)
    const conversacionesMap = {};

    for (const msg of mensajes) {
      const otroUsuario = msg.emisor._id.toString() === usuarioId
        ? msg.receptor
        : msg.emisor;

      const claveConv = [
        [usuarioId, otroUsuario._id.toString()].sort().join("_"),
        msg.articuloId?.toString() || "sin-articulo",
      ].join("|");

      if (!conversacionesMap[claveConv]) {
        conversacionesMap[claveConv] = {
          clave:          claveConv,
          contraparte: {
            id:     otroUsuario._id,
            nombre: `${otroUsuario.nombre} ${otroUsuario.apellido || ""}`.trim(),
            avatar: otroUsuario.avatar || null,
          },
          articuloId:     msg.articuloId || null,
          tituloArticulo: msg.tituloArticulo || null,
          ultimoMensaje:  msg,           // ya están ordenados desc, el primero es el último
          sinLeer:        0,
        };
      }

      // Contar mensajes sin leer donde YO soy el receptor
      if (msg.receptor._id.toString() === usuarioId && !msg.leido) {
        conversacionesMap[claveConv].sinLeer++;
      }
    }

    let conversaciones = Object.values(conversacionesMap);

    // Filtro opcional: solo conversaciones con mensajes sin leer
    if (soloSinLeer === "true") {
      conversaciones = conversaciones.filter(c => c.sinLeer > 0);
    }

    // Ordenar por fecha del último mensaje (más reciente primero)
    conversaciones.sort(
      (a, b) => new Date(b.ultimoMensaje.enviadoEn) - new Date(a.ultimoMensaje.enviadoEn)
    );

    respuesta.status(200).json({ total: conversaciones.length, conversaciones });
  } catch (error) {
    siguiente(error);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/chats/mensajes?usuarioId=xxx&contraparteId=yyy&articuloId=zzz
// Devuelve el hilo completo de mensajes entre dos usuarios (opcionalmente
// filtrado por artículo). Marca como leídos los mensajes del receptor.
// ══════════════════════════════════════════════════════════════════════════════
const obtenerMensajesConversacion = async (solicitud, respuesta, siguiente) => {
  try {
    const { usuarioId, contraparteId, articuloId } = solicitud.query;

    if (!usuarioId || !contraparteId) {
      return respuesta.status(400).json({ error: "usuarioId y contraparteId son requeridos." });
    }
    if (!esIdValido(usuarioId) || !esIdValido(contraparteId)) {
      return respuesta.status(400).json({ error: "IDs no válidos." });
    }

    const idUsuario     = new mongoose.Types.ObjectId(usuarioId);
    const idContraparte = new mongoose.Types.ObjectId(contraparteId);

    const filtro = {
      $or: [
        { emisor: idUsuario,     receptor: idContraparte },
        { emisor: idContraparte, receptor: idUsuario     },
      ],
    };

    if (articuloId && esIdValido(articuloId)) {
      filtro.articuloId = new mongoose.Types.ObjectId(articuloId);
    }

    const mensajes = await Mensaje.find(filtro).sort({ enviadoEn: 1 });

    // Marcar como leídos los mensajes que yo (usuarioId) recibí y aún no leí
    await Mensaje.updateMany(
      { ...filtro, receptor: idUsuario, leido: false },
      { $set: { leido: true } }
    );

    respuesta.status(200).json({ total: mensajes.length, mensajes });
  } catch (error) {
    siguiente(error);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/chats/leer/:id
// Marca un mensaje individual como leído.
// ══════════════════════════════════════════════════════════════════════════════
const marcarLeido = async (solicitud, respuesta, siguiente) => {
  try {
    const { id } = solicitud.params;
    if (!esIdValido(id)) {
      return respuesta.status(400).json({ error: "ID de mensaje no válido." });
    }

    const mensajeActualizado = await Mensaje.findByIdAndUpdate(
      id,
      { $set: { leido: true } },
      { new: true }
    );

    if (!mensajeActualizado) {
      return respuesta.status(404).json({ error: "Mensaje no encontrado." });
    }

    respuesta.status(200).json({
      mensaje: "Mensaje marcado como leído.",
      dato:    mensajeActualizado,
    });
  } catch (error) {
    siguiente(error);
  }
};

module.exports = {
  enviarMensaje,
  obtenerConversaciones,
  obtenerMensajesConversacion,
  marcarLeido,
};
