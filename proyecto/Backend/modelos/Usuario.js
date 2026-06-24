const mongoose = require("mongoose");

// ── Sub-esquema: Perfil profesional ───────────────────────────────
const perfilProfesionalSchema = new mongoose.Schema(
    {
        oficio: {
            type: String,
            enum: {
                values: ["plomero", "electricista", "gasista", "carpintero", "pintor", "otro"],
                message: 'El oficio "{VALUE}" no es valido.',
            },
        },
        descripcion: {
            type: String,
            trim: true,
            maxlength: [300, "La descripcion no puede superar los 300 caracteres."],
        },
        preciohora: {
            type: Number,
            min: [0, "El precio por hora no puede ser negativo."],
        },
        zona: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
);

// ── Esquema principal: Usuario ────────────────────────────────────
const usuarioSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, "El nombre es obligatorio."],
            trim: true,
        },
        apellido: {
            type: String,
            required: [true, "El apellido es obligatorio."],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "El email es obligatorio."],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "El formato de email no es valido."],
        },
        contraseña: {
            type: String,
            required: [true, "La contraseña es obligatoria."],
            minlength: [6, "La contraseña debe tener al menos 6 caracteres."],
            select: false,
        },

        // ── Contacto ──────────────────────────────────────────────
        telefono: {
            type: String,
            trim: true,
        },
        direccion: {
            type: String,
            trim: true,
        },

        // ── Imagen de perfil ──────────────────────────────────────
        // Almacena la ruta relativa al archivo subido, ej: /uploads/profiles/foto.jpg
        // Compatible con almacenamiento local y servicios externos en el futuro.
        fotoPerfil: {
            type: String,
            default: null,
        },
        avatar: {
            type: String,
            default: null,
        },

        // ── Coordenadas ───────────────────────────────────────────
        latitud: {
            type: Number,
            required: false,
        },
        longitud: {
            type: Number,
            required: false,
        },

        // ── Roles ─────────────────────────────────────────────────
        roles: {
            type: [String],
            enum: {
                values: ["cliente", "Dueño", "Profesional"],
                message: 'El rol "{VALUE}" no es valido.',
            },
            default: ["cliente"],
        },

        perfilProfesional: perfilProfesionalSchema,

        // ── Reputación ────────────────────────────────────────────
        puntuacion: {
            type: Number,
            default: 0,
            min: [0, "la puntuacion no puede ser menor a 0"],
            max: [5, "La puntuacion no puede ser mayor a 5"],
        },
        cantidadReseñas: {
            type: Number,
            default: 0,
        },
        // Promedio calculado dinámicamente al recibir una nueva reseña.
        // Lo usan las tarjetas, el modal de detalle y el filtro del aside.
        promedioValoracion: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        // ── Ubicación preferida ───────────────────────────────────
        // Fallback cuando el GPS del navegador falla o está bloqueado.
        // Se usa en crearArticulo para que las publicaciones no queden sin localidad.
        ubicacionPreferida: {
            type: String,
            trim: true,
            default: null,
        },

        // ── Control de cuenta ─────────────────────────────────────
        activo: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: "fechaRegistro", updatedAt: "fechaActualizacion" },
    }
);

// ── Índices ───────────────────────────────────────────────────────
usuarioSchema.index({ roles: 1 });

// ── Validación condicional ────────────────────────────────────────
usuarioSchema.pre("save", async function () {
    if (this.roles.includes("Profesional") && !this.perfilProfesional?.oficio) {
        throw new Error("Un usuario profesional debe indicar su oficio en el perfil.");
    }
});

module.exports = mongoose.model("Usuario", usuarioSchema);