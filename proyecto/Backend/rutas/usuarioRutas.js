const express = require("express");
const router = express.Router();

const { registrarUsuario, obtenerPerfil } = require("../controladores/usuarioControlador");

// POST: /api/usuarios/registro
// Llama a la funcion registraUsuario cuando alguien envia datos a esta URL
router.post("/registro", registrarUsuario);

//GET: /api/usuarios/:id
//LLama a la funcion obtenerPerfil cuando alguien busca un ID especifico
router.get("/:id", obtenerPerfil);

module.exports = router;