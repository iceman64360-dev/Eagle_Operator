const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware pour parser le JSON
app.use(bodyParser.json({limit: '50mb'}));

// Servir les fichiers statiques
app.use(express.static('.'));

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Chemin des fichiers de données
const soldiersFile = path.join(dataDir, 'soldiers.json');
const unitsFile = path.join(dataDir, 'units.json');
const photosDir = path.join(dataDir, 'photos');

// Créer le dossier photos s'il n'existe pas
if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir);
}

// API pour sauvegarder les soldats
app.post('/api/soldiers', (req, res) => {
    try {
        fs.writeFileSync(soldiersFile, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des soldats:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde des données' });
    }
});

// API pour charger les soldats
app.get('/api/soldiers', (req, res) => {
    try {
        if (fs.existsSync(soldiersFile)) {
            const data = fs.readFileSync(soldiersFile, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des soldats:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des données' });
    }
});

// API pour sauvegarder les unités
app.post('/api/units', (req, res) => {
    try {
        fs.writeFileSync(unitsFile, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des unités:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde des données' });
    }
});

// API pour charger les unités
app.get('/api/units', (req, res) => {
    try {
        if (fs.existsSync(unitsFile)) {
            const data = fs.readFileSync(unitsFile, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des unités:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des données' });
    }
});

// API pour sauvegarder une photo de soldat
app.post('/api/photos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { photoData } = req.body;
        
        // Extraire les données de l'image (supprimer le préfixe data:image/...)
        const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Sauvegarder l'image dans un fichier
        const photoPath = path.join(photosDir, `${id}.jpg`);
        fs.writeFileSync(photoPath, buffer);
        
        res.json({ success: true, path: `/data/photos/${id}.jpg` });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la photo:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de la photo' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Données stockées dans ${dataDir}`);
});
