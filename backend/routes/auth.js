const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Création d'un compte utilisateur
router.post("/signup", (req, res) => {
  // On hash le mot de passe (10 tours pour un bon compromis sécurité/performance)
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      // Création d'un nouvel utilisateur avec email et mot de passe hashé
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      // Sauvegarde dans la DB
      user
        .save()
        .then(() => res.status(201).json({ message: "Compté créé" }))
        .catch((error) => res.status(400).json({ error })); // Erreur si email déjà utilisé par exemple
    })
    .catch((error) => res.status(500).json({ error })); // Erreur pendant le hashage
});

// Connexion d'un utilisateur
router.post("/login", (req, res) => {
  // On cherche l'utilisateur par son email
  User.findOne({ email: req.body.email })
    .then((user) => {
      // Si l'email n'existe pas
      if (!user) {
        return res.status(401).json({ message: "Compte introuvable" });
      }
      // On compare le mot de passe envoyé avec le hash stocké
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          // Si le mot de passe ne correspond pas
          if (!valid) {
            return res.status(401).json({ message: "Mot de passe incorrect" });
          }
          // Création d'un token JWT valable 24h avec l'ID de l'utilisateur
          const token = jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
            expiresIn: "24h",
          });
          // Envoi du token et de l'ID au front
          res.status(200).json({
            userId: user._id,
            token: token,
          });
        })
        .catch((error) => res.status(500).json({ error })); // Erreur pendant la comparaison
    })
    .catch((error) => res.status(500).json({ error })); // Erreur lors de la recherche
});

module.exports = router;
