const Usuario = require("../modelos/Usuario");
const bcrypt  = require('bcryptjs');

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

        const nuevoUsuario  = new Usuario(req.body);
        const usuarioGuardado = await nuevoUsuario.save();

        const respuesta = usuarioGuardado.toObject();
        delete respuesta.contraseña;

        res.status(201).json({
            mensaje: "Usuario registrado exitosamente.",
            usuario: respuesta,
        });
    } catch (error) {
        console.error("Error real en el registro:", error);
        manejarErrorMongo(error, res, next);
    }
};

// ── GET /api/usuarios/:id ─────────────────────────────────────────────────────
const obtenerPerfil = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-contraseña");

        if (!usuario) {
            return res.status(404).json({
                error: `No se encontró ningún usuario con el ID: ${req.params.id}`,
            });
        }

        if (!usuario.activo) {
            return res.status(404).json({
                error: "Este usuario no está disponible.",
            });
        }

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

        if (!usuario) {
            return respuesta.status(400).json({ error: "El email o la contraseña son incorrectos." });
        }

        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!contraseñaValida) {
            return respuesta.status(400).json({ error: "El email o la contraseña son incorrectos." });
        }

        const usuarioLogueado = usuario.toObject();
        delete usuarioLogueado.contraseña;

        respuesta.status(200).json({
            mensaje: "Inicio de sesion exitoso.",
            usuario: usuarioLogueado,
        });
    } catch (error) {
        siguiente(error);
    }
};

// ── PUT /api/usuarios/actualizar/:id ─────────────────────────────────────────
// Actualiza datos del perfil. Acepta opcionalmente un archivo de imagen (via Multer).
// No permite modificar contraseña ni roles desde este endpoint.
const actualizarPerfil = async (solicitud, respuesta, siguiente) => {
    try {
        // ID flexible: primero params, luego body (para mayor compatibilidad con el frontend)
        const idUsuario = solicitud.params.id || solicitud.body.idUsuario;

        // Campos de texto permitidos para actualizar
        const { nombre, apellido, email, telefono, direccion } = solicitud.body;
        const camposActualizables = {};
        if (nombre    !== undefined) camposActualizables.nombre    = nombre;
        if (apellido  !== undefined) camposActualizables.apellido  = apellido;
        if (email     !== undefined) camposActualizables.email     = email;
        if (telefono  !== undefined) camposActualizables.telefono  = telefono;
        if (direccion !== undefined) camposActualizables.direccion = direccion;

        // Si Multer procesó un archivo, guardar la ruta relativa como avatar
        if (solicitud.file) {
            camposActualizables.avatar = `/uploads/profiles/${solicitud.file.filename}`;
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            idUsuario,
            { $set: camposActualizables },
            {
                new: true,           // Devuelve el documento ya modificado
                runValidators: true, // Aplica las validaciones del esquema al actualizar
            }
        ).select("-contraseña");

        if (!usuarioActualizado) {
            return respuesta.status(404).json({
                error: `No se encontró ningún usuario con el ID: ${idUsuario}`,
            });
        }

        // Respuesta con estructura explícita — nunca expone contraseña ni campos internos
        respuesta.status(200).json({
            mensaje: "Perfil actualizado correctamente.",
            usuario: {
                id:        usuarioActualizado._id,
                nombre:    usuarioActualizado.nombre,
                apellido:  usuarioActualizado.apellido,
                email:     usuarioActualizado.email,
                telefono:  usuarioActualizado.telefono  || null,
                direccion: usuarioActualizado.direccion || null,
                avatar:    usuarioActualizado.avatar    || null,
            },
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        manejarErrorMongo(error, respuesta, siguiente);
    }
};

module.exports = {
    registrarUsuario,
    obtenerPerfil,
    login,
    actualizarPerfil,
};