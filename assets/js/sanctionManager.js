// assets/js/sanctionManager.js
// Gestion des sanctions pour les soldats

/**
 * Initialise le module de sanctions
 */
function initSanctionManager() {
    console.log('Initialisation du module de sanctions');
    setupSanctionModal();
}

/**
 * Configure la modale d'ajout de sanction
 */
function setupSanctionModal() {
    const modal = document.getElementById('sanction-modal');
    const btnAddSanction = document.getElementById('btn-add-sanction');
    const closeModal = document.querySelector('#sanction-modal .close-modal');
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
            modal.classList.remove('hidden-modal');
        });
    }
    
    // Fermer la modale
    if (closeModal) {
        closeModal.addEventListener('click', () => {
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
    // Récupérer l'ID du soldat actuel
    const soldierId = document.getElementById('soldier-id').textContent;
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
    addHistoryEntry(soldiers[soldierIndex], 'sanction', '', `${type}: ${motif}`);
    
    // Sauvegarder les données
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
    
    // Fermer la modale et réinitialiser le formulaire
    document.getElementById('sanction-modal').classList.add('hidden-modal');
    resetSanctionForm();
    
    // Mettre à jour l'affichage
    displaySanctions(soldiers[soldierIndex]);
    
    // Mettre à jour l'historique
    displayHistory(soldiers[soldierIndex]);
    
    // Synchroniser les données
    if (typeof synchronizeRecruitData === 'function') {
        synchronizeRecruitData(soldiers[soldierIndex]);
    }
    
    console.log(`Sanction ajoutée au soldat ${soldierId}`);
}

/**
 * Affiche les sanctions d'un soldat
 * @param {Object} soldier - Le soldat dont on veut afficher les sanctions
 */
function displaySanctions(soldier) {
    const sanctionsList = document.getElementById('sanctions-list');
    const noSanctionsMessage = document.getElementById('no-sanctions-message');
    
    if (!sanctionsList) return;
    
    // Vider la liste des sanctions (sauf le message "aucune sanction")
    const elementsToRemove = Array.from(sanctionsList.querySelectorAll('.sanction-card'));
    elementsToRemove.forEach(el => el.remove());
    
    // Vérifier si le soldat a des sanctions
    if (!soldier.sanctions || soldier.sanctions.length === 0) {
        if (noSanctionsMessage) noSanctionsMessage.style.display = 'block';
        return;
    }
    
    // Masquer le message "aucune sanction"
    if (noSanctionsMessage) noSanctionsMessage.style.display = 'none';
    
    // Trier les sanctions par date (la plus récente en premier)
    const sortedSanctions = [...soldier.sanctions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // Afficher chaque sanction
    sortedSanctions.forEach(sanction => {
        const sanctionCard = document.createElement('div');
        sanctionCard.className = 'sanction-card';
        sanctionCard.dataset.id = sanction.id;
        
        // Formater la date
        const formattedDate = formatDate(sanction.date);
        
        sanctionCard.innerHTML = `
            <div class="sanction-header">
                <span class="sanction-type">${sanction.type}</span>
                <span class="sanction-date">${formattedDate}</span>
            </div>
            <div class="sanction-motif">${sanction.motif}</div>
            <div class="sanction-observateur">Observé par: ${sanction.observateur}</div>
        `;
        
        sanctionsList.appendChild(sanctionCard);
    });
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

// Exporter les fonctions pour les rendre disponibles globalement
window.initSanctionManager = initSanctionManager;
window.displaySanctions = displaySanctions;
