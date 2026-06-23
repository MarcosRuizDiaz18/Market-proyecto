// rutas/usuarioRutas.js
const express = require("express");
const router = express.Router();
const usuarioControlador = require("../controladores/usuarioControlador");

// ┌─────────────────────────────────────────────────────────────┐
// │  Método  │  Ruta                  │  Acción                 │
// ├─────────────────────────────────────────────────────────────┤
// │  POST    │  /api/usuarios/registro│  Registrar nuevo usuario│
// │  POST    │  /api/usuarios/login   │  Login de usuario seguro│
// │  GET     │  /api/usuarios/:id     │  Obtener perfil por ID  │
// └─────────────────────────────────────────────────────────────┘

// Ruta para el registro de nuevos usuarios
router.post("/registro", usuarioControlador.registrarUsuario);

// Ruta para el inicio de sesión (Apunta a la función definitiva 'iniciarSesion')
router.post("/login", usuarioControlador.iniciarSesion);

// Ruta para obtener el perfil público de un usuario específico por su ID de MongoDB
router.get("/:id", usuarioControlador.obtenerPerfil);

module.exports = router;