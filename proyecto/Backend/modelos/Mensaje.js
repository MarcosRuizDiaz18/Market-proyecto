// modelos/Mensaje.js
const mongoose = require("mongoose");

// ─── Esquema: Mensaje ──────────────────────────────────────────────────────
// Cada documento representa un mensaje puntual entre dos usuarios,
// opcionalmente vinculado al artículo que originó la conversación.
const esquemaMensaje = new mongoose.Schema(
  {
    // ID del usuario que envía el mensaje
    emisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El emisor es obligatorio."],
    },

    // ID del usuario que recibe el mensaje
    receptor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El receptor es obligatorio."],
    },

    // Contenido del mensaje
    texto: {
      type: String,
      required: [true, "El texto del mensaje es obligatorio."],
      trim: true,
      maxlength: [1000, "El mensaje no puede superar los 1000 caracteres."],
    },

    // Indica si el receptor ya leyó el mensaje
    leido: {
      type: Boolean,
      default: false,
    },

    // Artículo que originó la conversación (opcional pero muy útil para agrupar)
    articuloId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Articulo",
      default: null,
    },

    // Título del artículo guardado en el mensaje para mostrarlo sin populate extra
    tituloArticulo: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "enviadoEn",   // Fecha/hora exacta de envío
      updatedAt: "actualizadoEn",
    },
    versionKey: false,
  }
);

// ─── Índices para consultas frecuentes ────────────────────────────────────
// Acelera: "todos los mensajes donde yo soy emisor o receptor"
esquemaMensaje.index({ emisor: 1, receptor: 1 });
// Acelera: "mensajes no leídos del receptor X"
esquemaMensaje.index({ receptor: 1, leido: 1 });
// Acelera: "mensajes de esta conversación ordenados por fecha"
esquemaMensaje.index({ articuloId: 1, enviadoEn: 1 });

const Mensaje = mongoose.model("Mensaje", esquemaMensaje);

module.exports = Mensaje;
