// controladores/articuloControlador.js
const mongoose = require("mongoose");
const Articulo = require("../modelos/Articulo");
const Usuario = require('../modelos/Usuario');

// ─── Helper: manejo centralizado de errores de Mongoose ───────────────────
const manejarErrorMongo = (error, respuesta, siguiente) => {
  if (error.name === "ValidationError") {
    const mensajesDeError = Object.values(error.errors).map((e) => e.message);
    return respuesta.status(400).json({ error: "Error de validación.", detalles: mensajesDeError });
  }
  if (error.name === "CastError") {
    return respuesta.status(400).json({ error: "El ID proporcionado no tiene un formato válido." });
  }
  siguiente(error);
};

// ─── Helper: verificar si un ID es válido antes de consultar ──────────────
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── POST /api/articulos ───────────────────────────────────────────────────
// Crea un artículo nuevo heredando datos de ubicación y reputación del vendedor
const crearArticulo = async (solicitud, respuesta, siguiente) => {
  try {
    // Si viene un archivo/imagen en la petición, configuramos la ruta de acceso
    if (solicitud.file) {
      solicitud.body.imagen = `/uploads/${solicitud.file.filename}`;
    }

    const idUsuario = solicitud.body.idVendedor;
    const usuarioPerfil = await Usuario.findById(idUsuario);

    if (!usuarioPerfil) {
      return respuesta.status(404).json({ error: "No se encontró el perfil del usuario." });
    }

    // Adaptación de parámetros del Body al esquema de Articulo
    solicitud.body.titulo = solicitud.body.nombre;
    solicitud.body.precioBase = solicitud.body.precio;
    solicitud.body.categoria = solicitud.body.categoria || "Herramientas";

    // Inyección automática de la ubicación del perfil del vendedor
    solicitud.body.partido = usuarioPerfil.partido || "Sin partido configurado";
    solicitud.body.localidad = usuarioPerfil.localidad || "Sin localidad mencionada";
    solicitud.body.latitud = usuarioPerfil.latitud || 0;
    solicitud.body.longitud = usuarioPerfil.longitud || 0;

    solicitud.body.vendedor = {
      ...solicitud.body.vendedor,
      _id: usuarioPerfil._id,
      nombre: usuarioPerfil.nombre,
      reputacion: usuarioPerfil.perfilProfesional?.reputacion?.puntuacion || 0
    };

    const nuevoArticulo = new Articulo(solicitud.body);
    const articuloGuardado = await nuevoArticulo.save();

    respuesta.status(201).json({
      mensaje: "Artículo creado correctamente!",
      articulo: articuloGuardado,
    });
  } catch (error) {
    console.log("====== DETALLE DEL ERROR EN CREACIÓN ======");
    console.log(solicitud.body);
    console.log("==========================================");
    manejarErrorMongo(error, respuesta, siguiente);
  }
};

// ─── GET /api/articulos ────────────────────────────────────────────────────
// Lista artículos con filtros opcionales combinables por query string y coordenadas de mapa.
const obtenerArticulos = async (solicitud, respuesta, siguiente) => {
  try {
    const {
      partido,
      localidad,
      categoria,
      estado,
      estrellas,
      minLat,
      maxLat,
      minLng,
      maxLng
    } = solicitud.query;

    const filtro = {};

    // Filtros de ubicación por texto (Coincidencia exacta case-insensitive)
    if (partido) filtro.partido = { $regex: `^${partido.trim()}$`, $options: "i" };
    if (localidad) filtro.localidad = { $regex: `^${localidad.trim()}$`, $options: "i" };

    // Filtros parciales por categoría
    if (categoria) filtro.categoria = { $regex: categoria.trim(), $options: "i" };

    // Filtros por estado (Por defecto muestra solo "disponible")
    if (estado) {
      filtro.estado = estado.trim();
    } else {
      filtro.estado = "disponible";
    }

    // Filtro por estrellas mínimas del vendedor (Reputación)
    if (estrellas) {
      filtro["vendedor.reputacion"] = { $gte: Number(estrellas) };
    }

    // FILTRO GOOGLE MAPS: Búsqueda por cuadrante numérico de coordenadas geoespaciales
    if (minLat && maxLat && minLng && maxLng) {
      filtro.latitud = { $gte: Number(minLat), $lte: Number(maxLat) };
      filtro.longitud = { $gte: Number(minLng), $lte: Number(maxLng) };
    }
    
    // Ejecución de la consulta ordenada por los más recientes primero
    const listaArticulos = await Articulo.find(filtro).sort({ creadoEn: -1 });

    respuesta.status(200).json({
      total: listaArticulos.length,
      filtrosAplicados: filtro,
      articulos: listaArticulos,
    });
  } catch (error) {
    siguiente(error);
  }
};

// ─── GET /api/articulos/:id ────────────────────────────────────────────────
const obtenerArticuloPorId = async (solicitud, respuesta, siguiente) => {
  try {
    const { id } = solicitud.params;

    if (!esIdValido(id)) {
      return respuesta.status(400).json({ error: "El ID proporcionado no tiene un formato válido." });
    }

    const articulo = await Articulo.findById(id);

    if (!articulo) {
      return respuesta.status(404).json({ error: "No se encontró ningún artículo con ese ID." });
    }

    respuesta.status(200).json({ articulo });
  } catch (error) {
    siguiente(error);
  }
};

// ─── PUT /api/articulos/:id ────────────────────────────────────────────────
const actualizarArticulo = async (solicitud, respuesta, siguiente) => {
  try {
    const { id } = solicitud.params;

    if (!esIdValido(id)) {
      return respuesta.status(400).json({ error: "El ID proporcionado no tiene un formato válido." });
    }

    const articuloActualizado = await Articulo.findByIdAndUpdate(
      id,
      solicitud.body,
      {
        new: true,           // Devuelve el documento ya modificado
        runValidators: true, // Fuerza las validaciones del esquema al actualizar
      }
    );

    if (!articuloActualizado) {
      return respuesta.status(404).json({ error: "No se encontró ningún artículo con ese ID." });
    }

    respuesta.status(200).json({
      mensaje: "Artículo actualizado correctamente.",
      articulo: articuloActualizado,
    });
  } catch (error) {
    manejarErrorMongo(error, respuesta, siguiente);
  }
};

// ─── DELETE /api/articulos/:id ─────────────────────────────────────────────
const eliminarArticulo = async (solicitud, respuesta, siguiente) => {
  try {
    const { id } = solicitud.params;

    if (!esIdValido(id)) {
      return respuesta.status(400).json({ error: "El ID proporcionado no tiene un formato válido." });
    }

    const articuloEliminado = await Articulo.findByIdAndDelete(id);

    if (!articuloEliminado) {
      return respuesta.status(404).json({ error: "No se encontró ningún artículo con ese ID." });
    }

    respuesta.status(200).json({
      mensaje: "Artículo eliminado correctamente.",
      articulo: articuloEliminado,
    });
  } catch (error) {
    siguiente(error);
  }
};

module.exports = {
  crearArticulo,
  obtenerArticulos,
  obtenerArticuloPorId,
  actualizarArticulo,
  eliminarArticulo,
};