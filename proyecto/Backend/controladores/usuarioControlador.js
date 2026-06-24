const Usuario  = require("../modelos/Usuario");
const Articulo = require("../modelos/Articulo");
const Reseña   = require("../modelos/Reseña");
const bcrypt   = require('bcryptjs');

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

// ── POST /api/usuarios/registro ───────────────────────────────────────────────
const registrarUsuario = async (req, res, next) => {
    try {
        const sal = await bcrypt.genSalt(10);
        req.body.contraseña = await bcrypt.hash(req.body.contraseña, sal);
        const nuevoUsuario    = new Usuario(req.body);
        const usuarioGuardado = await nuevoUsuario.save();
        const respuesta       = usuarioGuardado.toObject();
        delete respuesta.contraseña;
        res.status(201).json({ mensaje: "Usuario registrado exitosamente.", usuario: respuesta });
    } catch (error) {
        console.error("Error real en el registro:", error);
        manejarErrorMongo(error, res, next);
    }
};

// ── GET /api/usuarios/:id ─────────────────────────────────────────────────────
const obtenerPerfil = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-contraseña");
        if (!usuario) return res.status(404).json({ error: `No se encontró ningún usuario con el ID: ${req.params.id}` });
        if (!usuario.activo) return res.status(404).json({ error: "Este usuario no está disponible." });
        res.status(200).json({ usuario });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/usuarios/login ──────────────────────────────────────────────────
const login = async (solicitud, respuesta, siguiente) => {
    try {
        const { email, contraseña } = solicitud.body;
        const usuario = await Usuario.findOne({ email }).select('+contraseña');
        if (!usuario) return respuesta.status(400).json({ error: "El email o la contraseña son incorrectos." });
        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!contraseñaValida) return respuesta.status(400).json({ error: "El email o la contraseña son incorrectos." });
        const usuarioLogueado = usuario.toObject();
        delete usuarioLogueado.contraseña;
        respuesta.status(200).json({ mensaje: "Inicio de sesion exitoso.", usuario: usuarioLogueado });
    } catch (error) {
        siguiente(error);
    }
};

// ── PUT /api/usuarios/actualizar/:id ─────────────────────────────────────────
const actualizarPerfil = async (solicitud, respuesta, siguiente) => {
    try {
        const idUsuario = solicitud.params.id || solicitud.body.idUsuario;
        const { nombre, apellido, email, telefono, direccion, ubicacionPreferida, latitud, longitud } = solicitud.body;
        const camposActualizables = {};
        if (nombre             !== undefined) camposActualizables.nombre             = nombre;
        if (apellido           !== undefined) camposActualizables.apellido           = apellido;
        if (email              !== undefined) camposActualizables.email              = email;
        if (telefono           !== undefined) camposActualizables.telefono           = telefono;
        if (direccion          !== undefined) camposActualizables.direccion          = direccion;
        if (ubicacionPreferida !== undefined) camposActualizables.ubicacionPreferida = ubicacionPreferida;
        if (latitud  !== undefined && latitud  !== null) camposActualizables.latitud  = Number(latitud);
        if (longitud !== undefined && longitud !== null) camposActualizables.longitud = Number(longitud);
        if (solicitud.file) camposActualizables.avatar = `/uploads/profiles/${solicitud.file.filename}`;

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            idUsuario,
            { $set: camposActualizables },
            { new: true, runValidators: true }
        ).select("-contraseña");

        if (!usuarioActualizado) return respuesta.status(404).json({ error: `No se encontró ningún usuario con el ID: ${idUsuario}` });

        if (camposActualizables.avatar) {
            try {
                await Articulo.updateMany(
                    { "vendedor._id": idUsuario.toString() },
                    { $set: { "vendedor.avatar": camposActualizables.avatar } }
                );
            } catch (errCascade) {
                console.error("[actualizarPerfil] Error al sincronizar avatar en artículos:", errCascade.message);
            }
        }

        respuesta.status(200).json({
            mensaje: "Perfil actualizado correctamente.",
            usuario: {
                id:                 usuarioActualizado._id,
                nombre:             usuarioActualizado.nombre,
                apellido:           usuarioActualizado.apellido,
                email:              usuarioActualizado.email,
                telefono:           usuarioActualizado.telefono           || null,
                direccion:          usuarioActualizado.direccion          || null,
                avatar:             usuarioActualizado.avatar             || null,
                ubicacionPreferida: usuarioActualizado.ubicacionPreferida || null,
                latitud:            usuarioActualizado.latitud            ?? null,
                longitud:           usuarioActualizado.longitud           ?? null,
            },
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        manejarErrorMongo(error, respuesta, siguiente);
    }
};

// ── PUT /api/usuarios/contrasena/:id ─────────────────────────────────────────
const cambiarContrasena = async (solicitud, respuesta, siguiente) => {
    try {
        const { contraseñaActual, nuevaContrasena, confirmarContrasena } = solicitud.body;
        if (!contraseñaActual || !nuevaContrasena || !confirmarContrasena)
            return respuesta.status(400).json({ error: "Todos los campos de contraseña son obligatorios." });
        if (nuevaContrasena !== confirmarContrasena)
            return respuesta.status(400).json({ error: "La nueva contraseña y su confirmación no coinciden." });
        if (nuevaContrasena.length < 6)
            return respuesta.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });

        const usuario = await Usuario.findById(solicitud.params.id).select('+contraseña');
        if (!usuario) return respuesta.status(404).json({ error: "Usuario no encontrado." });

        const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
        if (!contraseñaValida) return respuesta.status(400).json({ error: "La contraseña actual es incorrecta." });

        const sal = await bcrypt.genSalt(10);
        usuario.contraseña = await bcrypt.hash(nuevaContrasena, sal);
        await usuario.save();
        respuesta.status(200).json({ mensaje: "Contraseña actualizada correctamente." });
    } catch (error) {
        siguiente(error);
    }
};

// ── DELETE /api/usuarios/:id ──────────────────────────────────────────────────
const eliminarCuenta = async (solicitud, respuesta, siguiente) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(solicitud.params.id);
        if (!usuarioEliminado) return respuesta.status(404).json({ error: "Usuario no encontrado." });
        respuesta.status(200).json({ mensaje: "Cuenta eliminada correctamente. ¡Hasta pronto!" });
    } catch (error) {
        siguiente(error);
    }
};

// ── POST /api/usuarios/valorar ────────────────────────────────────────────────
// Guarda una reseña y recalcula el promedioValoracion del usuario calificado.
// Body: { usuarioCalificado, usuarioCalificador, puntuacion, comentario? }
const valorarUsuario = async (solicitud, respuesta, siguiente) => {
    try {
        const { usuarioCalificado, usuarioCalificador, puntuacion, comentario } = solicitud.body;

        if (!usuarioCalificado || !usuarioCalificador)
            return respuesta.status(400).json({ error: "Se requieren los IDs de ambos usuarios." });
        if (usuarioCalificado === usuarioCalificador)
            return respuesta.status(400).json({ error: "Un usuario no puede calificarse a si mismo." });

        const puntNum = Number(puntuacion);
        if (!puntNum || puntNum < 1 || puntNum > 5 || !Number.isInteger(puntNum))
            return respuesta.status(400).json({ error: "La puntuacion debe ser un entero entre 1 y 5." });

        // Upsert: un calificador puede editar su propia reseña posterior
        await Reseña.findOneAndUpdate(
            { usuarioCalificado, usuarioCalificador },
            { puntuacion: puntNum, comentario: comentario ? comentario.trim() : null },
            { upsert: true, new: true, runValidators: true }
        );

        // Recalcular promedio con aggregate
        const mongoose  = require('mongoose');
        const resultado = await Reseña.aggregate([
            { $match: { usuarioCalificado: new mongoose.Types.ObjectId(usuarioCalificado) } },
            { $group: { _id: null, promedio: { $avg: "$puntuacion" }, total: { $sum: 1 } } },
        ]);

        const nuevoPromedio = resultado.length ? parseFloat(resultado[0].promedio.toFixed(2)) : puntNum;
        const nuevaCantidad = resultado.length ? resultado[0].total : 1;

        await Usuario.findByIdAndUpdate(usuarioCalificado, {
            $set: {
                promedioValoracion: nuevoPromedio,
                cantidadReseñas:    nuevaCantidad,
                puntuacion:         nuevoPromedio,
            },
        });

        // Cascade: sincronizar en todos los artículos del vendedor
        try {
            await Articulo.updateMany(
                { "vendedor._id": usuarioCalificado.toString() },
                { $set: { "vendedor.promedioValoracion": nuevoPromedio } }
            );
        } catch (errCascade) {
            console.error("[valorarUsuario] Error al sincronizar en articulos:", errCascade.message);
        }

        respuesta.status(200).json({
            mensaje: "Valoracion guardada correctamente.",
            promedioValoracion: nuevoPromedio,
            cantidadReseñas:    nuevaCantidad,
        });
    } catch (error) {
        if (error.code === 11000)
            return respuesta.status(409).json({ error: "Ya existe una reseña de este usuario para ese vendedor." });
        siguiente(error);
    }
};

module.exports = {
    registrarUsuario,
    obtenerPerfil,
    login,
    actualizarPerfil,
    cambiarContrasena,
    eliminarCuenta,
    valorarUsuario,
};
