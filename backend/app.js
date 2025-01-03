const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const bookRoutes = require("./routes/book");
const authRoute = require("./routes/auth");
const auth = require("./middleware/auth");
const userRoutes = require("./routes/user");
const path = require("path");
const Book = require("./models/book");
const dotenv = require("dotenv");

// Configuration des variables d'environnement
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

// reconstruire l'URI de connexion à MongoDB

const MONGO_URI_TEMPLATE = process.env.MONGO_URI_TEMPLATE;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

const MONGO_URI = MONGO_URI_TEMPLATE.replace("{USER}", MONGO_USER).replace(
  "{PASSWORD}",
  MONGO_PASSWORD
);

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/auth", authRoute);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);

// Route par défaut pour tester le serveur
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

module.exports = app;
