#### `.env.local`

Créez un fichier `.env.local` à la racine de votre projet pour stocker vos informations sensibles. Ajoutez-y les variables suivantes :

```txt
MONGO_USER=votre_nom_utilisateur
MONGO_PASSWORD=votre_mot_de_passe
```

### 3. Ajouter `.env.local` au fichier `.gitignore`

Pour éviter de commettre vos informations sensibles sur votre système de contrôle de version (par exemple, Git), ajoutez `.env.local` à votre fichier `.gitignore` :

### 3. Le dossier .env est déjà commit, nul besoin de le recréer.
