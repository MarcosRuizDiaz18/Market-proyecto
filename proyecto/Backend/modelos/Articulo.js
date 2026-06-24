// modelos/Articulo.js
const mongoose = require("mongoose");

// ─── Sub-esquema: Vendedor ─────────────────────────────────────────────────
// { _id: false } evita que Mongoose genere un ObjectId automático.
// El campo _id aquí es el ID del Usuario que publicó el artículo (String).
const esquemaVendedor = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, "El ID del vendedor es obligatorio."],
    },
    nombre: {
      type: String,
      required: [true, "El nombre del vendedor es obligatorio."],
      trim: true,
    },
    reputacion: {
      type: Number,
      min: [0, "La reputación mínima es 0."],
      max: [5, "La reputación máxima es 5."],
      default: 0,
    },
    // Ruta relativa de la foto de perfil del vendedor (ej: /uploads/profiles/foto.jpg)
    // Se copia desde Usuario.avatar al momento de publicar para mostrarlo en las tarjetas.
    avatar: {
      type: String,
      default: null,
    },
  },
  { _id: false } // Previene ObjectId auto-generado; el _id de arriba es explícito
);

// ─── Esquema principal: Articulo ───────────────────────────────────────────
const esquemaArticulo = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, "El título del artículo es obligatorio."],
      trim: true,
      maxlength: [100, "El título no puede superar los 100 caracteres."],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede superar los 500 caracteres."],
    },
    categoria: {
      type: String,
      required: [true, "La categoría es obligatoria."],
      trim: true,
      // TODO: Reemplazar por enum cuando se definan todas las categorías
      // enum: ["Jardinería", "Herramientas", "Limpieza", ...]
    },
    precioBase: {
      type: Number,
      required: [true, "El precio base es obligatorio."],
      min: [0, "El precio no puede ser negativo."],
    },
    tipoCobro: {
      type: String,
      required: [true, "El tipo de cobro es obligatorio."],
      enum: {
        values: ["por día", "por hora", "por semana"],
        message: "El tipo de cobro debe ser: 'por día', 'por hora' o 'por semana'.",
      },
      default: "por día",
    },
    // ─── Geolocalización (clave del proyecto) ───────────────────────────
    // No son required para no bloquear publicaciones cuando el navegador
    // aún no proporcionó coordenadas; el controlador inyecta defaults seguros.
    partido: {
      type: String,
      trim: true,
      default: "Sin especificar",
    },
    localidad: {
      type: String,
      trim: true,
      default: "Sin especificar",
    },
    latitud: {
      type: Number,
      default: 0,
    },
    longitud: {
      type: Number,
      default: 0,
    },
    // ─── Servicio del dueño (híbrido) ───────────────────────────────────
    ofreceServicio: {
      type: Boolean,
      default: false,
    },
    precioServicio: {
      type: Number,
      default: null,
      min: [0, "El precio del servicio no puede ser negativo."],
      validate: {
        validator: function (valor) {
          // Si ofrece servicio, el precio del servicio es obligatorio
          if (this.ofreceServicio && (valor === null || valor === undefined)) {
            return false;
          }
          return true;
        },
        message: "Si el artículo ofrece servicio, el precio del servicio es obligatorio.",
      },
    },
    // ─── Imágenes (hasta 5 fotos del artículo) ──────────────────────────
    // Array de rutas relativas, ej: ["/uploads/1234.jpg", "/uploads/5678.png"]
    // Reemplaza el campo imagen (String) para soportar galería/carrusel en el frontend.
    imagenes: {
      type: [String],
      default: [],
    },
    tipo: {
      type: String,
      enum: {
        values: ["Producto", "Servicio"],
        message: "El tipo debe ser 'Producto' o 'Servicio'.",
      },
      default: "Producto",
    },
    vendedor: {
      type: esquemaVendedor,
      required: [true, "Los datos del vendedor son obligatorios."],
    },
    estado: {
      type: String,
      enum: {
        values: ["disponible", "alquilado", "pausado"],
        message: "El estado debe ser: 'disponible', 'alquilado' o 'pausado'.",
      },
      default: "disponible",
    },
  },
  {
    timestamps: {
      createdAt: "creadoEn",  // Reemplaza el default 'createdAt' por español
      updatedAt: "actualizadoEn",
    },
    versionKey: false, // Elimina el campo '__v' de MongoDB
  }
);

// ─── Índices para búsquedas frecuentes ────────────────────────────────────
// Acelera los filtros de geolocalización (caso de uso principal)
esquemaArticulo.index({ partido: 1, localidad: 1 });
esquemaArticulo.index({ categoria: 1 });
esquemaArticulo.index({ estado: 1 });

// ─── Modelo ────────────────────────────────────────────────────────────────
const Articulo = mongoose.model("Articulo", esquemaArticulo);

module.exports = Articulo;
