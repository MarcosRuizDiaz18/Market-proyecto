// servidor.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const conectarBaseDeDatos = require("./configuracion/baseDeDatos");

const app = express();
const PUERTO = process.env.PUERTO || 3000;

// ─── Conexión a la base de datos ───────────────────────────────────────────
conectarBaseDeDatos();

// ─── Configuración de CORS ────────────────────────────────────────────────
// CORS (Cross-Origin Resource Sharing) le dice al navegador qué orígenes
// externos tienen permiso para hacer peticiones a este servidor.
//
// Sin esto, cuando el HTML abre desde file:// o desde un puerto distinto
// (ej: Vite en :5173), el navegador bloquea las peticiones al backend (:3000).
//
// En desarrollo aceptamos cualquier origen. Antes de salir a producción
// hay que reemplazar origin: true por la URL real del frontend.
const opcionesCors = {
  origin: true,             // Desarrollo: acepta CUALQUIER origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,        // Necesario si en el futuro usan cookies/JWT
};

app.use(cors(opcionesCors));

// Responde al preflight OPTIONS que el navegador manda antes de cada request
// con cabeceras personalizadas (como Authorization)
app.options(/(.*)/, cors(opcionesCors));

// ─── Middlewares globales ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
// ─── Middleware de logging (solo en desarrollo) ───────────────────────────
if (process.env.NODE_ENV !== "produccion") {
  app.use((solicitud, respuesta, siguiente) => {
    console.log(`[${new Date().toLocaleTimeString("es-AR")}] ${solicitud.method} ${solicitud.url}`);
    siguiente();
  });
}

// ─── Rutas ─────────────────────────────────────────────────────────────────
app.get("/api/estado", (solicitud, respuesta) => {
  respuesta.json({
    mensaje: "¡Servidor funcionando correctamente!",
    entorno: process.env.NODE_ENV || "desarrollo",
    hora: new Date().toLocaleString("es-AR"),
  });
});

const rutasArticulos = require("./rutas/articuloRutas");
app.use("/api/articulos", rutasArticulos);

const rutasUsuarios = require("./rutas/usuarioRutas");
app.use("/api/usuarios", rutasUsuarios);

// ─── Middleware de errores 404 ─────────────────────────────────────────────
app.use((solicitud, respuesta) => {
  respuesta.status(404).json({ error: "Ruta no encontrada." });
});

// ─── Middleware de errores globales ───────────────────────────────────────
app.use((error, solicitud, respuesta, siguiente) => {
  console.error("🔥 Error interno:", error.message);
  respuesta.status(error.estado || 500).json({
    error: error.message || "Error interno del servidor.",
  });
});

// ─── Inicio del servidor ───────────────────────────────────────────────────
app.listen(PUERTO, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PUERTO}`);
});

module.exports = app;