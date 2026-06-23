// controladores/usuarioControlador.js
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

// ─── POST /api/usuarios/registro ───────────────────────────────────────────
// Crea un nuevo usuario aplicando encriptación segura mediante bcrypt
const registrarUsuario = async (req, res, next) => {
  try {
    // Encriptamos la contraseña con bcrypt antes de guardar
    const sal = await bcrypt.genSalt(10);
    req.body.contraseña = await bcrypt.hash(req.body.contraseña, sal);

    const nuevoUsuario = new Usuario(req.body);
    const usuarioGuardado = await nuevoUsuario.save();

    // Capa de seguridad activa: quitamos la contraseña del objeto de respuesta
    const respuesta = usuarioGuardado.toObject();
    delete respuesta.contraseña;

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente.",
      usuario: respuesta,
    });
  } catch (error) {
    console.error("🔥 Error real en el registro:", error);
    manejarErrorMongo(error, res, next);
  }
};

// ─── GET /api/usuarios/:id ────────────────────────────────────────────────
// Devuelve el perfil público de un usuario aplicando baja lógica
const obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-contraseña");

    if (!usuario) {
      // CORRECCIÓN: Se cambiaron comillas simples por backticks para interpolar el ID real
      return res.status(404).json({
        mensaje: `No se encontró ningún usuario con el ID: ${req.params.id}`,
      });
    }

    // Si la cuenta fue desactivada (baja lógica), no la exponemos
    if (!usuario.activo) {
      return res.status(404).json({
        mensaje: "Este usuario no está disponible",
      });
    }

    res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/usuarios/login ──────────────────────────────────────────────
// Control de acceso de credenciales con validación de estados y descifrado seguro
const iniciarSesion = async (req, res, next) => {
  try {
    const { email, contraseña } = req.body;

    // 1. Validar que ingresen ambos campos obligatorios
    if (!email || !contraseña) {
      return res.status(400).json({ error: "El email y la contraseña son obligatorios." });
    }

    // 2. Buscar al usuario por email e incluir la contraseña oculta del esquema
    const usuario = await Usuario.findOne({ email }).select('+contraseña');
    
    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas. El usuario no existe o la contraseña es incorrecta." });
    }

    // 3. Verificar si el usuario está activo (baja lógica)
    if (!usuario.activo) {
      return res.status(403).json({ error: "Esta cuenta se encuentra desactivada." });
    }

    // 4. Comparación criptográfica segura de la contraseña con bcrypt
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    
    if (!contraseñaValida) {
      return res.status(401).json({ error: "Credenciales inválidas. El usuario no existe o la contraseña es incorrecta." });
    }

    // 5. Preparar datos limpios para el front-end
    const usuarioLogueado = usuario.toObject();
    delete usuarioLogueado.contraseña; // Jamás viaja por la red

    res.status(200).json({
      mensaje: "¡Inicio de sesión exitoso!",
      usuario: usuarioLogueado
    });
  } catch (error) {
    console.error("🔥 Error interno en el login:", error);
    next(error);
  }
};

// Exportación limpia y centralizada de módulos
module.exports = {
  registrarUsuario,
  obtenerPerfil,
  iniciarSesion
};