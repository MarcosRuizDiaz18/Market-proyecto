// configuracion/baseDeDatos.js
const mongoose = require("mongoose");

const conectarBaseDeDatos = async () => {
  // FUSIÓN: Lee de las variables de entorno si existen; de lo contrario, 
  // apunta por defecto a la base de datos real "alquilapp" en tu entorno local.
  const uriMongo = process.env.MONGO_URI || "mongodb://localhost:27017/alquilapp";

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
