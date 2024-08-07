const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharp = require("../middleware/sharp-config");
const Book = require("../models/book");

// Route pour créer un livre
router.post("/", auth, multer, (req, res) => {
  console.log("Request body:", req.body);
  console.log("File info:", req.file);

  const bookData = req.body.book || req.body.Book;
  if (!bookData) {
    return res.status(400).json({ error: "Missing book data" });
  }

  let bookObject;
  try {
    bookObject = JSON.parse(bookData);
  } catch (error) {
    console.error("JSON parsing error:", error);
    return res.status(400).json({ error: "Invalid JSON data" });
  }

  console.log("Parsed book object:", bookObject);

  if (!req.file) {
    return res.status(400).json({ error: "Missing file data" });
  }

  const book = new Book({
    ...bookObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => res.status(201).json({ message: "Book created!" }))
    .catch((error) => {
      console.error("Error saving book:", error);
      res.status(400).json({ error });
    });
});

// Route pour noter un livre
router.post("/:id/rating", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const { userId, rating } = req.body;

    // Vérifiez que userId est fourni
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Vérifiez que rating est fourni et valide
    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Valid rating (1-5) is required" });
    }

    // Vérifiez si l'utilisateur a déjà noté ce livre
    const existingRating = book.ratings.find((r) => r.userId === userId);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      let actRatings = book.ratings;
      actRatings.push({ userId, rating });
      book.ratings = actRatings;
    }

    // Recalculez la moyenne des notes
    if (book.ratings.length > 0) {
      const bookRatings = book.ratings;
      const totalRatings = bookRatings.reduce((acc, r) => acc + r.rating, 0);
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

// Route pour obtenir tous les livres
router.get("/", (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour obtenir un livre par ID
router.get("/:id", (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.status(200).json(book);
    })
    .catch((error) => res.status(404).json({ error }));
});

// Route pour mettre à jour un livre par ID
router.put("/:id", auth, multer, sharp, (req, res) => {
  let bookObject;
  if (req.file) {
    if (!req.body.book) {
      return res.status(400).json({ error: "Missing book data" });
    }
    try {
      bookObject = JSON.parse(req.body.book);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON data" });
    }
    bookObject.imageUrl = `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`;
  } else {
    bookObject = { ...req.body };
  }
  Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: "Book updated!" }))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour supprimer un livre par ID
router.delete("/:id", auth, (req, res) => {
  Book.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: "Book deleted!" }))
    .catch((error) => res.status(400).json({ error }));
});

module.exports = router;
