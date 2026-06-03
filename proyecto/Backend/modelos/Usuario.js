const mongoose = require("mongoose");

// ── Sub-esquema: Perfil profesional ───────────────────────────────
// Se activa solo cuando el usuario tiene el rol "profesional".
// { _id: false } mantiene consistencia con el sub-esquema de vendedor .
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
    { _id: false}
);

// ── Esquema principal: Usuario────────────────────────────────────
const usuarioSchema = new mongoose.Schema(
    {
        //identidad
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
            select: false, // nunca se devuelve en queries por seguridad
        },
        telefono: {
            type: String,
            trim: true,
        },

        // Coordenadas para el mapa (google maps)
        latitud: {
            type: Number,
            required: false, // No es obligatorio por si el usuario no quiere prender el GPS al registrarse
        },
        longitud: {
            type: Number,
            required: false,
        },
        // foto de perfil
        // guarda una URL (externa o local). compatible con Cloudinary,
        // alamaenamiento local o cualquier servicio futuro sin cambiar el esquema.
        fotoPerfil: {
            type: String,
            default: null,
        },

        // Roles
        // Un usuario puede cambiar roles sin crear cuentas nuevas.
        // por defecto arranca como cliente
        roles: {
            type: [String],
            enum: {
                values: ["cliente", "Dueño", "Profesional"],
                message: 'El rol "{VALUE}" no es valido.', 
            },
            default: ["cliente"],
        },

        // perfil profesional (solo relevante si roles incluye "profesional")
        perfilProfesional: perfilProfesionalSchema,

        //Reputacion
        // puntuacion: promedio calculando al crear/actualizar reseñas.
        // cantidadReseñas: necesario para que el front muestre confiabilidad del promedio.
        puntuacion: {
            type: Number,
            default: 0,
            min: [0, "la puntuacion no puede ser menor a 0"],
            max: [5, "La puntuacion no puede ser mayor a 5"],
        },
        cantidadReseñas: {
            type: Number,
            default:0,
        },

        // Control de cuenta
        // Baja logica: desactivar sin borrar el historial del usuario.
        activo: {
            type: Boolean,
            default: true,
        },
    },
    {
        //agrega automaticamente createdAt y updetedAt
        timestamps: {createdAt: "fechaRegistro", updatedAt: "fechaActualizacion"},
    }
);

// --- indices ---
// email ya tiene indice por unique: true.
//Indexamos roles para filtrar profesionales o dueños eficientemente.
usuarioSchema.index({ roles: 1});

// --- validacion condicional ---
// Si el usuario es profesionalm, el oficio dentro del perfil es obligatorio.
// Espeja la logica condicional de precioServicio en articulo.js.
usuarioSchema.pre("save", async function () {
  if (this.roles.includes("Profesional") && !this.perfilProfesional?.oficio) {
    throw new Error("Un usuario profesional debe indicar su oficio en el perfil.");
  }
});

module.exports = mongoose.model("Usuario", usuarioSchema);