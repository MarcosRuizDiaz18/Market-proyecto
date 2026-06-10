const Usuario = require("../modelos/Usuario");
const bcrypt = require('bcryptjs');

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

// -- POST / api/usuarios/registro--
// Crea un nuevo usuario en la base de datos
// Por defecto recibe: nombre, apellido, email, contraseña, telefono (opcional)
// roles (opcional, default ["cliente"]) y perfilProfesional (opcional)
const registrarUsuario = async (req, res, next) => {
    try {
        //encriptamos la contraseña con bcrypt antes de guardar
        const sal = await bcrypt.genSalt(10);
        req.body.contraseña = await bcrypt.hash(req.body.contraseña, sal);

        const nuevoUsuario = new Usuario(req.body);
        const usuarioGuardado = await nuevoUsuario.save();

        // Armamos la respuesta manualmente para nunca exponer la contraseña
        // Incluso si en algun momento se remueve el select: false del modelo
        const respuesta = usuarioGuardado.toObject();
        delete respuesta.contraseña;

        res.status(201).json({
            mensaje: "Usuario registrado exitosamente.",
            usuario: respuesta,
        });
    } catch (error) {
    console.error("Error real en el registro:", error);
    /* res.status(500).json({ error: "Error interno del servidor.", detalles: error.stack }); */
    manejarErrorMongo(error, res, next);
    }
};

// -- GET /api/usuarios/:id --
// Devuelve el perfil publico de un usuario por su ID.
// Excluye la contraseña explicitamente como segunda capa de seguridad
const obtenerPerfil = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-contraseña");

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'No se encontro ningun usuario con el ID: ${req.params.id}',
            });
        }

        // Si la cuenta fue desactivada (baja logica), no la exponemos
        if (!usuario.activo) {
            return res.status(404).json({
                mensaje: "Este usuario no esta disponible",
            });
        }

        res.status(200).json({ usuario });
    } catch (error) {
        next(error);
    }
};

const login = async (solicitud, respuesta, siguiente) => {
    try {
        const {email, contraseña} = solicitud.body;

        // Buscamos el usuario por email y exigimos que traiga la contaseña oculta
        const usuario = await Usuario.findOne ({ email }).select('+contraseña');
        //si no existe el usuario, respondemos con un error generico por seguridad
        if (!usuario) {
            return respuesta.status(400).json({ error: "El email o la contraseña son incorrectos." });
        }
        //comparamos la contraseña desencriptando con bcrypt
        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        
        if (!contraseñaValida) {
            return respuesta.status(400).json({error: "El email o la contraseña son incorrectos. "});
        }
        //si las credenciales son validas, preparamos los datos para el front-end
        const usuarioLogueado = usuario.toObject();
        delete usuarioLogueado.contraseña //la borramos antes de enviarla para que no viaje por la red

        respuesta.status(200).json({
            mensaje : "Inicio de sesion exitoso.",
            usuario : usuarioLogueado
        });
    } catch (error) {
        siguiente(error);
    }
};
module.exports = {
    registrarUsuario,
    obtenerPerfil,
    login
};