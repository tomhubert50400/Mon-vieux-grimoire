const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Middleware d'authentification
const User = require("../models/user"); // Assurez-vous que le chemin est correct

// Route pour récupérer tous les utilisateurs
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclure le mot de passe
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;