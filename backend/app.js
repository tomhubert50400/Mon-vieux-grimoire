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

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

mongoose
  .connect(
    "mongodb+srv://tomhrt50:ijJMY0oR7PA8dpF4@cluster0.g2ibet6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
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

// Route pour créer un livre
app.post("/api/books", (req, res) => {
  const book = new Book({ ...req.body });
  book
    .save()
    .then(() => res.status(201).json({ message: "Book created!" }))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour obtenir tous les livres
app.get("/api/books", (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

module.exports = app;
