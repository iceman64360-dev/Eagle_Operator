// Configuration Firebase pour Eagle Operator
// Créez un projet Firebase sur https://console.firebase.google.com/ et remplacez les valeurs ci-dessous

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "votre-messagingSenderId",
  appId: "votre-appId",
  databaseURL: "https://votre-projet-default-rtdb.firebaseio.com"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Référence à la base de données Firestore
const db = firebase.firestore();

// Référence au stockage Firebase (pour les photos)
const storage = firebase.storage();

// Collection pour les soldats
const soldiersCollection = db.collection('soldiers');

// Collection pour les unités
const unitsCollection = db.collection('units');

// Fonctions d'accès aux données

// Récupérer tous les soldats
async function getAllSoldiers() {
  try {
    const snapshot = await soldiersCollection.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des soldats:", error);
    return [];
  }
}

// Récupérer toutes les unités
async function getAllUnits() {
  try {
    const snapshot = await unitsCollection.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des unités:", error);
    return [];
  }
}

// Ajouter ou mettre à jour un soldat
async function saveSoldier(soldier) {
  try {
    if (soldier.id) {
      // Mise à jour d'un soldat existant
      await soldiersCollection.doc(soldier.id).set(soldier);
    } else {
      // Création d'un nouveau soldat
      const docRef = await soldiersCollection.add(soldier);
      soldier.id = docRef.id;
    }
    return soldier;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du soldat:", error);
    throw error;
  }
}

// Ajouter ou mettre à jour une unité
async function saveUnit(unit) {
  try {
    if (unit.id_unite) {
      // Mise à jour d'une unité existante
      await unitsCollection.doc(unit.id_unite).set(unit);
    } else {
      // Création d'une nouvelle unité
      const docRef = await unitsCollection.add(unit);
      unit.id_unite = docRef.id;
    }
    return unit;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'unité:", error);
    throw error;
  }
}

// Supprimer un soldat
async function deleteSoldier(soldierId) {
  try {
    await soldiersCollection.doc(soldierId).delete();
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du soldat:", error);
    throw error;
  }
}

// Supprimer une unité
async function deleteUnit(unitId) {
  try {
    await unitsCollection.doc(unitId).delete();
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'unité:", error);
    throw error;
  }
}

// Sauvegarder une photo de soldat
async function saveSoldierPhoto(soldierId, photoData) {
  try {
    // Extraire les données de l'image (supprimer le préfixe data:image/...)
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const photoRef = storage.ref(`photos/${soldierId}.jpg`);
    
    // Convertir en blob pour le stockage
    const blob = await (await fetch(photoData)).blob();
    
    // Télécharger l'image
    await photoRef.put(blob);
    
    // Obtenir l'URL de téléchargement
    const downloadURL = await photoRef.getDownloadURL();
    
    // Mettre à jour le soldat avec l'URL de la photo
    await soldiersCollection.doc(soldierId).update({
      photoURL: downloadURL
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la photo:", error);
    throw error;
  }
}
