// configuracion/baseDeDatos.js
const mongoose = require("mongoose");

const conectarBaseDeDatos = async () => {
  const uriMongo = "mongodb://26.146.117.180:27017/alquilapp";

  try {
    await mongoose.connect(uriMongo);
    console.log(`✅ MongoDB conectado: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error.message);
    process.exit(1); // Detiene el proceso si no hay DB
  }
};

// Eventos de conexión para debugging
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB desconectado.");
});

module.exports = conectarBaseDeDatos;
