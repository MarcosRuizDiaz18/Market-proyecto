// modelos/Reseña.js
const mongoose = require("mongoose");

const reseñaSchema = new mongoose.Schema(
    {
        // ── Participantes ─────────────────────────────────────────────────────
        usuarioCalificado: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: [true, "El usuario calificado es obligatorio."],
        },
        usuarioCalificador: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: [true, "El usuario calificador es obligatorio."],
        },

        // ── Puntuación ────────────────────────────────────────────────────────
        puntuacion: {
            type: Number,
            required: [true, "La puntuación es obligatoria."],
            min: [1, "La puntuación mínima es 1."],
            max: [5, "La puntuación máxima es 5."],
            validate: {
                validator: Number.isInteger,
                message: "La puntuación debe ser un número entero.",
            },
        },

        // ── Comentario (opcional) ─────────────────────────────────────────────
        comentario: {
            type: String,
            trim: true,
            maxlength: [500, "El comentario no puede superar los 500 caracteres."],
            default: null,
        },
    },
    {
        timestamps: { createdAt: "creadoEn", updatedAt: "actualizadoEn" },
    }
);

// ── Índice único: un usuario solo puede calificar a otro una vez ──────────────
reseñaSchema.index(
    { usuarioCalificado: 1, usuarioCalificador: 1 },
    { unique: true }
);

module.exports = mongoose.model("Reseña", reseñaSchema);
