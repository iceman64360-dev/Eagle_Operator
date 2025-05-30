// Gestionnaire d'exportation et d'importation des données
document.addEventListener('DOMContentLoaded', () => {
    // Récupérer les éléments du DOM
    const exportDataBtn = document.getElementById('exportData');
    const importDataBtn = document.getElementById('importData');
    const importFileInput = document.getElementById('importFile');
    
    // Gérer le clic sur le bouton d'exportation
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    // Gérer le clic sur le bouton d'importation
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            // Déclencher le clic sur l'input file
            importFileInput.click();
        });
    }
    
    // Gérer le changement de fichier
    if (importFileInput) {
        importFileInput.addEventListener('change', importData);
    }
});

// Fonction pour exporter les données
function exportData() {
    try {
        // Récupérer les données des soldats
        const soldiersData = localStorage.getItem('eagle_soldiers');
        
        if (!soldiersData) {
            alert('Aucune donnée à exporter.');
            return;
        }
        
        // Créer un objet avec toutes les données à exporter
        const exportData = {
            soldiers: JSON.parse(soldiersData),
            units: JSON.parse(localStorage.getItem('eagle_units') || '[]'),
            version: '1.0',
            exportDate: new Date().toISOString()
        };
        
        // Convertir en JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Créer un Blob avec les données
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Créer une URL pour le Blob
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = `eagle_data_${new Date().toISOString().split('T')[0]}.json`;
        
        // Ajouter le lien au document et cliquer dessus
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Données exportées avec succès !');
    } catch (error) {
        console.error('Erreur lors de l\'exportation des données:', error);
        alert('Erreur lors de l\'exportation des données.');
    }
}

// Fonction pour importer les données
function importData(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        // Vérifier que c'est bien un fichier JSON
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert('Veuillez sélectionner un fichier JSON.');
            return;
        }
        
        // Lire le fichier
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Vérifier que les données sont valides
                if (!importedData.soldiers) {
                    alert('Le fichier ne contient pas de données de soldats valides.');
                    return;
                }
                
                // Confirmation avant d'écraser les données existantes
                if (confirm('Cette action va remplacer toutes les données existantes. Continuer ?')) {
                    // Sauvegarder les données importées dans le localStorage
                    localStorage.setItem('eagle_soldiers', JSON.stringify(importedData.soldiers));
                    
                    if (importedData.units) {
                        localStorage.setItem('eagle_units', JSON.stringify(importedData.units));
                    }
                    
                    alert('Données importées avec succès ! La page va être rechargée.');
                    
                    // Recharger la page pour afficher les nouvelles données
                    window.location.reload();
                }
            } catch (error) {
                console.error('Erreur lors du parsing du fichier JSON:', error);
                alert('Le fichier sélectionné n\'est pas un JSON valide.');
            }
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Erreur lors de l\'importation des données:', error);
        alert('Erreur lors de l\'importation des données.');
    }
    
    // Réinitialiser l'input file pour permettre de sélectionner le même fichier plusieurs fois
    event.target.value = '';
}
