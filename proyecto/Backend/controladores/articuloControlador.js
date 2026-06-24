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

const crearArticulo = async (solicitud, respuesta, siguiente) => {
  try {
    // ── 1. Rutas de imágenes (Multer procesa el array antes de llegar aquí) ─
    // solicitud.files es el array de hasta 5 archivos enviados con el campo "imagenes"
    const rutasImagenes = (solicitud.files && solicitud.files.length > 0)
      ? solicitud.files.map(f => `/uploads/${f.filename}`)
      : [];

    // ── 2. Buscar perfil real del vendedor en la base de datos ───────────
    const idVendedor = solicitud.body.idVendedor ?? null;
    const usuario = idVendedor ? await Usuario.findById(idVendedor).select(
      "nombre apellido puntuacion latitud longitud ubicacionPreferida avatar"
    ) : null;

    // ── 3. Construir datos del vendedor con fallback seguro ──────────────
    const datosVendedor = {
      _id:        idVendedor ?? "sin_id",
      nombre:     usuario
                    ? `${usuario.nombre} ${usuario.apellido ?? ""}`.trim()
                    : (solicitud.body.nombreVendedor ?? "Usuario"),
      reputacion: usuario?.puntuacion ?? 0,
      avatar:     usuario?.avatar ?? null,  // Foto de perfil para mostrar en las tarjetas
    };

    // ── 4. Construir el artículo con datos reales + nullish coalescing ───
    const nuevoArticulo = new Articulo({
      titulo:         solicitud.body.nombre       ?? solicitud.body.titulo       ?? "Sin título",
      descripcion:    solicitud.body.descripcion  ?? "",
      categoria:      solicitud.body.categoria    ?? "Herramientas",
      precioBase:     Number(solicitud.body.precio ?? solicitud.body.precioBase) || 0,
      tipoCobro:      solicitud.body.tipoCobro    ?? "por día",
      // Geolocalización: body del form → perfil del usuario → default neutro
      partido:        solicitud.body.partido      ?? "Sin especificar",
      // Cadena de fallback: body del form → ubicacionPreferida del perfil → "Sin especificar"
      localidad:      solicitud.body.localidad    ?? solicitud.body.ubicacion ?? usuario?.ubicacionPreferida ?? "Sin especificar",
      latitud:        Number(solicitud.body.latitud)  || usuario?.latitud  || 0,
      longitud:       Number(solicitud.body.longitud) || usuario?.longitud || 0,
      // Servicio del dueño
      ofreceServicio: solicitud.body.ofreceServicio === "true" || solicitud.body.ofreceServicio === true,
      precioServicio: solicitud.body.precioServicio ? Number(solicitud.body.precioServicio) : null,
      // Campos de UI
      imagenes:       rutasImagenes,
      tipo:           solicitud.body.tipo         ?? "Producto",
      estado:         "disponible",
      vendedor:       datosVendedor,
    });

    const articuloGuardado = await nuevoArticulo.save();

    respuesta.status(201).json({
      mensaje: "Artículo creado correctamente.",
      articulo: articuloGuardado,
    });
  } catch (error) {
    manejarErrorMongo(error, respuesta, siguiente);
  }
};

const obtenerArticulos = async (solicitud, respuesta, siguiente) => {
  try {
    const {
      partido,
      localidad,
      categoria,
      estado,
      estrellas,   // compatibilidad legado (puede venir como 'estrellas')
      valoracion,  // nuevo param del filtro lateral
      minLat,
      maxLat,
      minLng,
      maxLng,
      idVendedor,
      precioMin,
      precioMax,
      orden,
    } = solicitud.query;

    const filtro = {};

    // ─── TRIPLE BUSQUEDA DE COMPATIBILIDAD DE IDS PARA RADMIN ───
    if (idVendedor) {
      const condicionesId = [
        { "vendedor._id": idVendedor },
        { "vendedor._id": idVendedor.toString() }
      ];

      // Si el string es un ObjectId válido de Mongo, sumamos los casters nativos
      if (mongoose.Types.ObjectId.isValid(idVendedor)) {
        condicionesId.push({ "vendedor._id": new mongoose.Types.ObjectId(idVendedor) });
        condicionesId.push({ "vendedor": new mongoose.Types.ObjectId(idVendedor) });
      }

      filtro.$or = condicionesId;
    }

    if (partido) filtro.partido = { $regex: `^${partido.trim()}$`, $options: "i" };
    if (localidad) filtro.localidad = { $regex: `^${localidad.trim()}$`, $options: "i" };
    if (categoria) filtro.categoria = { $regex: categoria.trim(), $options: "i" };

    // Si busca sus propias publicaciones, no le clavamos obligatoriamente el filtro de "disponible"
    if (!idVendedor) {
      if (estado) {
        filtro.estado = estado.trim();
      } else {
        filtro.estado = "disponible";
      }
    } else if (estado) {
      filtro.estado = estado.trim();
    }

    // Filtro de valoración: acepta el nuevo param 'valoracion' o el legado 'estrellas'
    const minValoracion = valoracion || estrellas;
    if (minValoracion) {
      filtro["vendedor.promedioValoracion"] = { $gte: Number(minValoracion) };
    }

    // ── Filtro de bounding box geográfico (viene del frontend ya calculado) ──
    if (minLat && maxLat && minLng && maxLng) {
      filtro.latitud  = { $gte: Number(minLat), $lte: Number(maxLat) };
      filtro.longitud = { $gte: Number(minLng), $lte: Number(maxLng) };
    }

    // ── Filtro de rango de precios ─────────────────────────────────────────
    if (precioMin !== undefined || precioMax !== undefined) {
      filtro.precioBase = {};
      if (precioMin !== undefined) filtro.precioBase.$gte = Number(precioMin);
      if (precioMax !== undefined) filtro.precioBase.$lte = Number(precioMax);
    }

    // ── Ordenamiento por precio ────────────────────────────────────────────
    const criterioOrden = orden === 'desc'
      ? { precioBase: -1 }
      : orden === 'asc'
        ? { precioBase: 1 }
        : { creadoEn: -1 };   // default: más recientes primero

    const listaArticulos = await Articulo.find(filtro).setOptions({ strict: false }).sort(criterioOrden);

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
    console.log("👀 DETECTIVE BACKEND - idVendedor recibido:", solicitud.query.idVendedor);
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

    // Adaptación para cuando envían campos simplificados desde un formulario normal
    if (solicitud.body.nombre) solicitud.body.titulo = solicitud.body.nombre;
    if (solicitud.body.precio) solicitud.body.precioBase = solicitud.body.precio;

    const articuloActualizado = await Articulo.findByIdAndUpdate(
      id,
      solicitud.body,
      {
        new: true,
        runValidators: true,
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