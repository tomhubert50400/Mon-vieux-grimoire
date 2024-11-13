const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharp = require("../middleware/sharp-config");
const Book = require("../models/book");

// Création d'un nouveau livre
router.post("/", auth, multer, (req, res) => {
  // On log les infos pour le debug
  console.log("Request body:", req.body);
  console.log("File info:", req.file);

  // On récupère les données du livre (gestion de la casse Book/book)
  const bookData = req.body.book || req.body.Book;
  if (!bookData) {
    return res.status(400).json({ error: "Aucune donnée trouvée" });
  }

  // Parse des données JSON du livre
  let bookObject;
  try {
    bookObject = JSON.parse(bookData);
  } catch (error) {
    console.error("JSON parsing error:", error);
    return res.status(400).json({ error: "Data JSON non valide" });
  }

  // Vérif si une image a été uploadée
  if (!req.file) {
    return res.status(400).json({ error: "Données de fichier manquantes" });
  }

  // Création de l'objet livre avec l'URL de l'image
  const book = new Book({
    ...bookObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  // Sauvegarde dans la DB
  book
    .save()
    .then(() => res.status(201).json({ message: "Livré créé !" }))
    .catch((error) => {
      console.error("Error saving book:", error);
      res.status(400).json({ error });
    });
});

// Ajout d'une note à un livre
router.post("/:id/rating", auth, async (req, res) => {
  try {
    // Récupération du livre
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Livre introuvable" });
    }

    const { userId, rating } = req.body;

    // Vérifications basiques
    if (!userId) {
      return res.status(400).json({ error: "un userId est nécéssaire" });
    }
    if (rating === undefined || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "Un note entre 1 et 5 est nécéssaire" });
    }

    // Mise à jour ou ajout de la note
    const existingRating = book.ratings.find((r) => r.userId === userId);
    if (existingRating) {
      // Si l'utilisateur a déjà noté, on update sa note
      existingRating.rating = rating;
    } else {
      // Sinon on ajoute une nouvelle note
      book.ratings.push({ userId, rating });
    }

    // Calcul de la moyenne
    if (book.ratings.length > 0) {
      const totalRatings = book.ratings.reduce((acc, r) => acc + r.rating, 0);
      book.averageRating = Math.round(totalRatings / book.ratings.length);
    } else {
      book.averageRating = Math.round(rating);
    }

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupération des 3 meilleurs livres
router.get("/bestrating", async (req, res) => {
  try {
    // On cherche tous les livres, triés par note et limité à 3
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);

    // Formatage pour le front (conversion _id en id)
    const formattedBooks = books.map((book) => ({
      id: book._id,
      userId: book.userId,
      title: book.title,
      author: book.author,
      imageUrl: book.imageUrl,
      year: book.year,
      genre: book.genre,
      ratings: book.ratings,
      averageRating: book.averageRating,
    }));

    res.status(200).json(formattedBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes basiques CRUD
// Récupération de tous les livres
router.get("/", (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

// Récupération d'un livre par son ID
router.get("/:id", (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Livre introuvable" });
      }
      res.status(200).json(book);
    })
    .catch((error) => res.status(404).json({ error }));
});

// Mise à jour d'un livre
router.put("/:id", auth, multer, sharp, (req, res) => {
  let bookObject;
  // Si une nouvelle image est fournie
  if (req.file) {
    if (!req.body.book) {
      return res.status(400).json({ error: "Donnée du livre manquante" });
    }
    // Parse des données et ajout de la nouvelle URL d'image
    try {
      bookObject = JSON.parse(req.body.book);
    } catch (error) {
      return res.status(400).json({ error: "Json invalide" });
    }
    bookObject.imageUrl = `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`;
  } else {
    // Si pas de nouvelle image, on prend juste le body
    bookObject = { ...req.body };
  }

  // Update dans la DB
  Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: "Livre mis à jour !" }))
    .catch((error) => res.status(400).json({ error }));
});

// Suppression d'un livre
router.delete("/:id", auth, (req, res) => {
  Book.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: "Livre supprimé !" }))
    .catch((error) => res.status(400).json({ error }));
});

module.exports = router;
