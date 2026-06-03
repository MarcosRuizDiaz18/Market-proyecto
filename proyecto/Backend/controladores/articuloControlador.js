// controladores/articuloControlador.js
const mongoose = require("mongoose");
const Articulo = require("../modelos/Articulo");

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
// Crea un artículo nuevo
const crearArticulo = async (solicitud, respuesta, siguiente) => {
  try {
    const nuevoArticulo = new Articulo(solicitud.body);
    const articuloGuardado = await nuevoArticulo.save();

    respuesta.status(201).json({
      mensaje: "Artículo creado correctamente.",
      articulo: articuloGuardado,
    });
  } catch (error) {
    manejarErrorMongo(error, respuesta, siguiente);
  }
};

// ─── GET /api/articulos ────────────────────────────────────────────────────
// Lista artículos con filtros opcionales combinables por query string.
//
// Filtros geográficos (exactos, case-insensitive):
//   ?partido=Lomas de Zamora
//   ?localidad=Temperley
//
// Otros filtros opcionales:
//   ?categoria=Herramientas
//   ?estado=disponible
//
// Ejemplos combinados:
//   ?partido=Lomas de Zamora&categoria=Herramientas
//   ?partido=Quilmes&localidad=Bernal&estado=disponible
const obtenerArticulos = async (solicitud, respuesta, siguiente) => {
  try {
    // sumammos los filtros del mapa 
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

    //filtros de ubicacion por texto
    if (partido) filtro.partido = { $regex: `^${partido.trim()}$`, $options: "i" };
    if (localidad) filtro.localidad = { $regex: `^${localidad.trim()}$`, $options: "i" };

    //filtros por categoria
    if (categoria) filtro.categoria = { $regex: categoria.trim(), $options: "i" };

    //filtros por estado
    if (estado) {
      filtro.estado = estado.trim();
    } else {
      filtro.estado = "disponible";
    }
    //filtro por estrellas (reputacion)
    if (estrellas) {
      filtro["vendedor.reputacion"] = { $gte: Number(estrellas) };
    }

    //NUEVO FILTRO: google maps (busqueda por cuadrante numerico)
    if (minLat && minLng && maxLng) {
      filtro.latitud = { $gte: Number(minLat), $lte: Number(maxLat) };
      filtro.longitud = { $gte: Number(minLng), $lte: Number(maxLng) };
    }
    
    //ejecutamos la consulta
    const listaArticulos = (await Articulo.find(filtro)).toSorted({ creadoEn: -1});

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
// Devuelve el detalle de un artículo por su ID de MongoDB
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
// Actualiza campos de un artículo existente (precio, descripción, estado, etc.)
// Solo modifica los campos que se envíen en el body; el resto queda intacto.
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
        new: true,           // Devuelve el documento YA actualizado
        runValidators: true, // Ejecuta las validaciones del esquema al actualizar
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
// Elimina un artículo por su ID
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
