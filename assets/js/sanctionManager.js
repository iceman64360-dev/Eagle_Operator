// assets/js/sanctionManager.js
// Gestion des sanctions pour les soldats

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation du module de sanctions');
    setupSanctionModal();
});

/**
 * Configure la modale d'ajout de sanction
 */
function setupSanctionModal() {
    const modal = document.getElementById('sanction-modal');
    const btnAddSanction = document.getElementById('btn-add-sanction');
    const closeModalBtn = document.getElementById('close-sanction-modal');
    const cancelBtn = document.getElementById('cancel-sanction');
    const form = document.getElementById('sanction-form');
    
    // Définir la date du jour comme valeur par défaut
    const dateInput = document.getElementById('sanction-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Ouvrir la modale
    if (btnAddSanction) {
        btnAddSanction.addEventListener('click', () => {
            // Assurer que la modale est centrée
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.classList.remove('hidden-modal');
        });
    }
    
    // Fermer la modale
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden-modal');
            resetSanctionForm();
        });
    }
    
    // Annuler l'ajout
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden-modal');
            resetSanctionForm();
        });
    }
    
    // Soumettre le formulaire
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addSanction();
        });
    }
}

/**
 * Réinitialise le formulaire de sanction
 */
function resetSanctionForm() {
    const form = document.getElementById('sanction-form');
    if (form) {
        form.reset();
        
        // Réinitialiser la date à aujourd'hui
        const dateInput = document.getElementById('sanction-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }
}

/**
 * Ajoute une sanction au soldat actuellement affiché
 */
function addSanction() {
    // Récupérer l'ID du soldat actuel depuis le dossier ouvert
    const soldierId = document.getElementById('file-id').textContent;
    if (!soldierId) {
        console.error('Impossible d\'ajouter une sanction : aucun soldat sélectionné');
        return;
    }
    
    // Récupérer les valeurs du formulaire
    const type = document.getElementById('sanction-type').value;
    const motif = document.getElementById('sanction-motif').value;
    const date = document.getElementById('sanction-date').value;
    const observateur = document.getElementById('sanction-observateur').value;
    
    // Valider les données
    if (!type || !motif || !date || !observateur) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    // Créer l'objet sanction
    const sanction = {
        id: generateUniqueId(),
        type,
        motif,
        date,
        observateur,
        timestamp: new Date().getTime()
    };
    
    // Récupérer les données des soldats
    let soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    
    // Trouver le soldat concerné
    const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
    if (soldierIndex === -1) {
        console.error(`Soldat avec ID ${soldierId} non trouvé`);
        return;
    }
    
    // Ajouter la sanction au soldat
    if (!soldiers[soldierIndex].sanctions) {
        soldiers[soldierIndex].sanctions = [];
    }
    
    soldiers[soldierIndex].sanctions.push(sanction);
    
    // Ajouter l'entrée dans l'historique
    if (typeof addHistoryEntry === 'function') {
        addHistoryEntry(soldiers[soldierIndex], 'sanction', '', `${type}: ${motif}`);
    } else {
        // Créer une entrée d'historique si la fonction n'existe pas
        if (!soldiers[soldierIndex].historique) {
            soldiers[soldierIndex].historique = [];
        }
        
        soldiers[soldierIndex].historique.push({
            type: 'sanction',
            date: new Date().toISOString(),
            ancienne_valeur: '',
            nouvelle_valeur: `${type}: ${motif}`,
            timestamp: new Date().getTime()
        });
    }
    
    // Sauvegarder les données
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
    
    // Fermer la modale et réinitialiser le formulaire
    document.getElementById('sanction-modal').classList.add('hidden-modal');
    resetSanctionForm();
    
    // Mettre à jour l'affichage des sanctions
    displaySanctions(soldiers[soldierIndex]);
    
    // Mettre à jour l'historique si la fonction existe
    if (typeof displayHistory === 'function') {
        displayHistory(soldiers[soldierIndex]);
    } else {
        // Rafraîchir l'historique dans la modale du dossier soldat
        refreshHistoryTab(soldiers[soldierIndex]);
    }
    
    // Synchroniser les données si la fonction existe
    if (typeof synchronizeRecruitData === 'function') {
        synchronizeRecruitData(soldiers[soldierIndex]);
    }
    
    console.log(`Sanction ajoutée au soldat ${soldierId}`);
}

/**
 * Affiche les sanctions d'un soldat
 * @param {Object} soldier - Objet soldat
 */
function displaySanctions(soldier) {
    const container = document.getElementById('sanctions-container');
    const noSanctionsMsg = document.getElementById('no-sanctions-message');
    
    container.innerHTML = '';
    
    if (!soldier.sanctions || soldier.sanctions.length === 0) {
        const noSanctionsMsg = document.createElement('p');
        noSanctionsMsg.className = 'no-sanctions-message';
        noSanctionsMsg.textContent = 'Aucune sanction enregistrée.';
        container.appendChild(noSanctionsMsg);
        return;
    }
    
    // Trier les sanctions par date (plus récentes en premier)
    const sortedSanctions = [...soldier.sanctions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedSanctions.forEach(sanction => {
        const sanctionElement = document.createElement('div');
        sanctionElement.className = 'sanction-item';
        sanctionElement.dataset.id = sanction.id;
        
        // Ajouter une classe en fonction de la gravité
        let severityClass = '';
        switch(sanction.type) {
            case 'Avertissement':
                severityClass = 'avertissement';
                break;
            case 'Blâme':
                severityClass = 'blame';
                break;
            case 'Consigne':
                severityClass = 'consigne';
                break;
            case 'Suspension':
                severityClass = 'suspension';
                break;
            default:
                severityClass = '';
        }
        
        // Formater la date
        const sanctionDate = new Date(sanction.date);
        const formattedDate = sanctionDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        sanctionElement.innerHTML = `
            <div class="sanction-header ${severityClass}">
                <span class="sanction-type">${sanction.type}</span>
                <span class="sanction-date">${formattedDate}</span>
            </div>
            <div class="sanction-content">
                <p class="sanction-motif">${sanction.motif}</p>
                <p class="sanction-observer">Observateur: ${sanction.observateur}</p>
                <div class="sanction-actions">
                    <button class="delete-sanction-btn" data-id="${sanction.id}">Supprimer</button>
                </div>
            </div>
        `;
        
        container.appendChild(sanctionElement);
    });
    
    // Ajouter les écouteurs d'événements pour les boutons de suppression
    addDeleteSanctionListeners(soldier.id);
}

/**
 * Ajoute les écouteurs d'événements pour les boutons de suppression de sanctions
 * @param {string} soldierId - ID du soldat
 */
function addDeleteSanctionListeners(soldierId) {
    const deleteBtns = document.querySelectorAll('.delete-sanction-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sanctionId = btn.dataset.id;
            
            // Récupérer le type de sanction pour l'afficher dans la confirmation
            let soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
            const soldier = soldiers.find(s => s.id === soldierId);
            if (!soldier) return;
            
            const sanction = soldier.sanctions.find(s => s.id === sanctionId);
            if (!sanction) return;
            
            // Créer la boîte de dialogue de confirmation
            showConfirmationDialog(
                'Confirmation de suppression',
                `Voulez-vous vraiment supprimer cette sanction de type "${sanction.type}" ?`,
                () => {
                    // Action à effectuer si confirmé
                    deleteSanction(soldierId, sanctionId);
                }
            );
        });
    });
}

/**
 * Affiche une boîte de dialogue de confirmation personnalisée
 * @param {string} title - Titre de la boîte de dialogue
 * @param {string} message - Message à afficher
 * @param {Function} onConfirm - Fonction à exécuter si l'utilisateur confirme
 */
function showConfirmationDialog(title, message, onConfirm) {
    // Créer l'élément de la boîte de dialogue
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    
    dialog.innerHTML = `
        <div class="confirmation-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button class="cancel-btn">Annuler</button>
                <button class="confirm-btn">Confirmer</button>
            </div>
        </div>
    `;
    
    // Ajouter la boîte de dialogue au document
    document.body.appendChild(dialog);
    
    // Ajouter les écouteurs d'événements
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.confirm-btn');
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(dialog);
    });
}

/**
 * Supprime une sanction pour un soldat
 * @param {string} soldierId - ID du soldat
 * @param {string} sanctionId - ID de la sanction à supprimer
 */
function deleteSanction(soldierId, sanctionId) {
    // Récupérer les données des soldats
    let soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    
    // Trouver le soldat concerné
    const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
    if (soldierIndex === -1) {
        console.error(`Soldat avec ID ${soldierId} non trouvé`);
        return;
    }
    
    // Trouver la sanction à supprimer
    const sanctionIndex = soldiers[soldierIndex].sanctions.findIndex(s => s.id === sanctionId);
    if (sanctionIndex === -1) {
        console.error(`Sanction avec ID ${sanctionId} non trouvée`);
        return;
    }
    
    // Récupérer les informations de la sanction pour l'historique
    const sanction = soldiers[soldierIndex].sanctions[sanctionIndex];
    
    // Supprimer la sanction
    soldiers[soldierIndex].sanctions.splice(sanctionIndex, 1);
    
    // Ajouter un événement à l'historique du soldat
    if (!soldiers[soldierIndex].history) {
        soldiers[soldierIndex].history = [];
    }
    
    soldiers[soldierIndex].history.push({
        id: generateUniqueId(),
        date: new Date().toISOString(),
        type: 'sanction',
        description: `Suppression de la sanction: ${sanction.type} - ${sanction.motif}`,
        details: {
            sanctionType: sanction.type,
            motif: sanction.motif,
            action: 'suppression'
        }
    });
    
    // Sauvegarder les données
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
    
    // Mettre à jour l'affichage des sanctions
    displaySanctions(soldiers[soldierIndex]);
}

/**
 * Rafraîchit l'onglet historique dans la modale du dossier soldat
 * @param {Object} soldier - Objet soldat
 */
function refreshHistoryTab(soldier) {
    const historyList = document.getElementById('history-list');
    const historyPlaceholder = document.getElementById('history-placeholder');
    
    if (!historyList || !historyPlaceholder) {
        console.error('Éléments d\'historique non trouvés');
        return;
    }
    
    // Vérifier si le soldat a un historique
    if (!soldier.historique || soldier.historique.length === 0) {
        historyList.innerHTML = '';
        historyPlaceholder.style.display = 'block';
        return;
    }
    
    // Masquer le message "aucun historique"
    historyPlaceholder.style.display = 'none';
    
    // Trier l'historique par date (plus récentes d'abord)
    const sortedHistory = [...soldier.historique].sort((a, b) => {
        return b.timestamp - a.timestamp;
    });
    
    // Générer le HTML pour l'historique
    let historyHTML = '';
    
    sortedHistory.forEach(entry => {
        const date = new Date(entry.date);
        const formattedDate = `${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
        
        let typeLabel = '';
        let typeClass = '';
        let contentHTML = '';
        
        switch (entry.type) {
            case 'grade':
                typeLabel = 'Changement de Grade';
                typeClass = 'grade-change';
                contentHTML = `<p>${entry.ancienne_valeur} → ${entry.nouvelle_valeur}</p>`;
                break;
            case 'statut':
                typeLabel = 'Changement de Statut';
                typeClass = 'status-change';
                contentHTML = `<p>${entry.ancienne_valeur} → ${entry.nouvelle_valeur}</p>`;
                break;
            case 'unite':
                typeLabel = 'Changement d\'Unité';
                typeClass = 'unit-change';
                contentHTML = `<p>${entry.ancienne_valeur} → ${entry.nouvelle_valeur}</p>`;
                break;
            case 'sanction':
                typeLabel = 'Sanction';
                typeClass = 'sanction-entry';
                contentHTML = `<p>${entry.nouvelle_valeur}</p>`;
                break;
            default:
                typeLabel = 'Modification';
                typeClass = 'other-change';
                contentHTML = `<p>${entry.nouvelle_valeur}</p>`;
        }
        
        historyHTML += `
            <li class="history-item ${typeClass}" data-type="${entry.type}">
                <div class="history-header">
                    <span class="history-type">${typeLabel}</span>
                    <span class="history-date">${formattedDate}</span>
                </div>
                <div class="history-content">
                    ${contentHTML}
                </div>
            </li>
        `;
    });
    
    historyList.innerHTML = historyHTML;
}

/**
 * Formate une date au format JJ/MM/AAAA
 * @param {string} dateString - La date au format AAAA-MM-JJ
 * @returns {string} La date formatée
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

/**
 * Génère un identifiant unique
 * @returns {string} Un identifiant unique
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Initialise le gestionnaire de sanctions pour un soldat spécifique
 * Cette fonction est appelée lorsqu'un dossier soldat est ouvert
 * @param {string} soldierId - ID du soldat dont le dossier est ouvert
 */
function initSanctionManager(soldierId) {
    console.log('Initialisation du gestionnaire de sanctions pour le soldat:', soldierId);
    
    // Récupérer les données du soldat
    const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    const soldier = soldiers.find(s => s.id === soldierId);
    
    if (!soldier) {
        console.error(`Soldat avec ID ${soldierId} non trouvé`);
        return;
    }
    
    // Configurer la modale d'ajout de sanction
    setupSanctionModal();
    
    // Afficher les sanctions existantes
    displaySanctions(soldier);
    
    // Configurer le bouton d'ajout de sanction
    const btnAddSanction = document.getElementById('btn-add-sanction');
    if (btnAddSanction) {
        // Supprimer les écouteurs d'événements existants pour éviter les doublons
        const newBtn = btnAddSanction.cloneNode(true);
        btnAddSanction.parentNode.replaceChild(newBtn, btnAddSanction);
        
        // Ajouter le nouvel écouteur d'événement
        newBtn.addEventListener('click', () => {
            const modal = document.getElementById('sanction-modal');
            if (modal) {
                // Assurer que la modale est centrée
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.classList.remove('hidden-modal');
            }
        });
    }
}

// Exporter les fonctions pour les rendre disponibles globalement
window.initSanctionManager = initSanctionManager;
window.displaySanctions = displaySanctions;
