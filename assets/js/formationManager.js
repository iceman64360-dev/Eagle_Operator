/**
 * Gestionnaire des formations pour Eagle Operator
 * Ce module gère l'affichage, l'ajout, la modification et l'assignation des soldats aux formations
 */

// Données des formations
let formationsData = [];
let allSoldiersData = [];
let selectedFormationId = null;
let selectedSoldiers = [];

// Initialisation du gestionnaire de formations
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données
    loadFormations();
    loadSoldiers();
    
    // Configurer les événements
    setupFormationEvents();
    setupFormationModals();
    setupFormationFilters();
});

/**
 * Charge les formations depuis le localStorage
 */
function loadFormations() {
    formationsData = JSON.parse(localStorage.getItem('eagleOperator_formations') || '[]');
    
    // Si aucune formation n'existe, créer des formations par défaut
    if (formationsData.length === 0) {
        formationsData = createDefaultFormations();
        saveFormations();
    }
    
    // Afficher les formations
    displayFormations(formationsData);
}

/**
 * Charge les données des soldats depuis le localStorage
 */
function loadSoldiers() {
    allSoldiersData = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
}

/**
 * Crée des formations par défaut
 * @returns {Array} Liste des formations par défaut
 */
function createDefaultFormations() {
    return [
        {
            id: generateUniqueId(),
            name: "Formation au combat rapproché",
            type: "combat",
            description: "Formation intensive aux techniques de combat rapproché et d'autodéfense. Les participants apprendront les bases du combat au corps à corps, les techniques de neutralisation et d'immobilisation.",
            duration: 5,
            capacity: 12,
            prerequisites: "Aucun",
            participants: []
        },
        {
            id: generateUniqueId(),
            name: "Tactiques d'infiltration",
            type: "tactique",
            description: "Formation avancée aux tactiques d'infiltration en territoire hostile. Les participants apprendront à se déplacer discrètement, à éviter la détection et à accomplir des missions d'infiltration.",
            duration: 7,
            capacity: 8,
            prerequisites: "Formation de base, Grade Caporal minimum",
            participants: []
        },
        {
            id: generateUniqueId(),
            name: "Premiers secours de combat",
            type: "medical",
            description: "Formation aux techniques de premiers secours en situation de combat. Les participants apprendront à traiter les blessures courantes sur le champ de bataille et à stabiliser les blessés.",
            duration: 3,
            capacity: 15,
            prerequisites: "Aucun",
            participants: []
        },
        {
            id: generateUniqueId(),
            name: "Maintenance d'équipement tactique",
            type: "technique",
            description: "Formation à la maintenance et à la réparation d'équipements tactiques sur le terrain. Les participants apprendront à diagnostiquer et à réparer les problèmes courants.",
            duration: 4,
            capacity: 10,
            prerequisites: "Aucun",
            participants: []
        },
        {
            id: generateUniqueId(),
            name: "Leadership et commandement",
            type: "leadership",
            description: "Formation au leadership et aux techniques de commandement. Les participants apprendront à diriger une équipe, à prendre des décisions sous pression et à communiquer efficacement.",
            duration: 6,
            capacity: 8,
            prerequisites: "Grade Sergent minimum, 1 an d'expérience",
            participants: []
        }
    ];
}

/**
 * Sauvegarde les formations dans le localStorage
 */
function saveFormations() {
    localStorage.setItem('eagleOperator_formations', JSON.stringify(formationsData));
}

/**
 * Génère un identifiant unique
 * @returns {string} Identifiant unique
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Configure les événements liés aux formations
 */
function setupFormationEvents() {
    // Bouton d'ajout de formation
    const btnAddFormation = document.getElementById('btn-add-formation');
    if (btnAddFormation) {
        btnAddFormation.addEventListener('click', () => {
            openFormationEditModal();
        });
    }
}

/**
 * Configure les modales liées aux formations
 */
function setupFormationModals() {
    // Modale d'édition de formation
    setupFormationEditModal();
    
    // Modale de détail de formation
    setupFormationDetailModal();
    
    // Modale d'assignation de soldats
    setupAssignSoldiersModal();
    
    // Permettre de fermer les modales en cliquant sur l'arrière-plan
    setupModalBackgroundClose();
}

/**
 * Configure la modale d'édition de formation
 */
function setupFormationEditModal() {
    const modal = document.getElementById('formation-edit-modal');
    const closeBtn = document.getElementById('close-formation-edit');
    const cancelBtn = document.getElementById('cancel-formation');
    const form = document.getElementById('formation-form');
    
    // Fermer la modale
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Bouton fermer formation-edit cliqué');
            modal.classList.add('hidden-modal');
            resetFormationForm();
        });
    }
    
    // Annuler l'édition
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Bouton annuler formation cliqué');
            modal.classList.add('hidden-modal');
            resetFormationForm();
        });
    }
    
    // Soumettre le formulaire
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFormationFromForm();
        });
    }
    
    // Gestion du nouveau bouton de fermeture
    const newCloseBtn = document.querySelector('#formation-edit-modal .close-formation-btn');
    if (newCloseBtn) {
        console.log('Nouveau bouton de fermeture trouvé pour formation-edit');
        newCloseBtn.addEventListener('click', function() {
            console.log('Nouveau bouton fermer formation-edit cliqué');
            modal.classList.add('hidden-modal');
            resetFormationForm();
        });
    }
}

/**
 * Configure la modale de détail de formation
 */
function setupFormationDetailModal() {
    const modal = document.getElementById('formation-detail-modal');
    const closeBtn = document.getElementById('close-formation-detail');
    const btnEditFormation = document.getElementById('btn-edit-formation');
    const btnAssignSoldiers = document.getElementById('btn-assign-soldiers');
    
    // Fermer la modale
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Bouton fermer formation-detail cliqué');
            modal.classList.add('hidden-modal');
        });
    }
    
    // Gestion du nouveau bouton de fermeture
    const newCloseBtn = document.querySelector('#formation-detail-modal .close-formation-btn');
    if (newCloseBtn) {
        console.log('Nouveau bouton de fermeture trouvé pour formation-detail');
        newCloseBtn.addEventListener('click', function() {
            console.log('Nouveau bouton fermer formation-detail cliqué');
            modal.classList.add('hidden-modal');
        });
    }
    
    // Modifier la formation
    if (btnEditFormation) {
        btnEditFormation.addEventListener('click', () => {
            if (selectedFormationId) {
                modal.classList.add('hidden-modal');
                openFormationEditModal(selectedFormationId);
            }
        });
    }
    
    // Assigner des soldats
    if (btnAssignSoldiers) {
        btnAssignSoldiers.addEventListener('click', () => {
            if (selectedFormationId) {
                modal.classList.add('hidden-modal');
                openAssignSoldiersModal(selectedFormationId);
            }
        });
    }
}

/**
 * Configure la modale d'assignation de soldats
 */
function setupAssignSoldiersModal() {
    const modal = document.getElementById('assign-soldiers-modal');
    const closeBtn = document.getElementById('close-assign-soldiers-btn');
    const cancelBtn = document.getElementById('cancel-assign-soldiers-btn');
    const confirmBtn = document.getElementById('confirm-assign-soldiers-btn');
    const soldierSearch = document.getElementById('soldier-search');
    const soldierFilter = document.getElementById('soldier-filter');
    const unitFilter = document.getElementById('unit-filter');
    
    // Configurer les boutons de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden-modal');
            selectedSoldiers = [];
            console.log('Modale d\'assignation fermée via bouton fermer');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.add('hidden-modal');
            selectedSoldiers = [];
            console.log('Modale d\'assignation fermée via bouton annuler');
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            assignSelectedSoldiersToFormation();
            modal.classList.add('hidden-modal');
            console.log('Soldats assignés à la formation et modale fermée');
        });
    }
    
    // Fermeture par Escape et clic sur l'arrière-plan
    if (modal) {
        // Fermeture par Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && !modal.classList.contains('hidden-modal')) {
                modal.classList.add('hidden-modal');
                selectedSoldiers = [];
                console.log('Modale d\'assignation fermée via touche Escape');
            }
        });
        
        // Fermeture par clic sur l'arrière-plan
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.add('hidden-modal');
                selectedSoldiers = [];
                console.log('Modale d\'assignation fermée via clic sur arrière-plan');
            }
        });
    }
    
    // Configurer les onglets
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Retirer la classe active de tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet cliqué
            this.classList.add('active');
            
            // Afficher le contenu correspondant
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${tabName}-tab-content`).classList.remove('hidden');
            
            // Charger les données spécifiques à l'onglet
            if (tabName === 'units') {
                loadAllUnits();
                console.log('Chargement des unités dans l\'onglet Unités');
            } else if (tabName === 'soldiers') {
                // Rafraîchir la liste des soldats si nécessaire
                if (allSoldiersData && allSoldiersData.length > 0) {
                    filterAssignableSoldiers();
                    console.log('Rafraîchissement de la liste des soldats dans l\'onglet Soldats');
                }
            }
        });
    });
    
    // Configurer les filtres et la recherche
    const searchInput = document.getElementById('soldier-search');
    const filterSelect = document.getElementById('soldier-filter');
    const unitFilterSelect = document.getElementById('unit-filter');
    
    // Remplir le filtre d'unités avec les unités disponibles
    if (unitFilterSelect) {
        // Conserver l'option 'Toutes les unités'
        unitFilterSelect.innerHTML = '<option value="all">Toutes les unités</option>';
        
        // Ajouter les unités disponibles
        const units = getAllUnits();
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.id;
            option.textContent = `${unit.name} (${unit.type})`;
            unitFilterSelect.appendChild(option);
        });
    }
    
    // Recherche de soldats
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAssignableSoldiers();
        });
    }
    
    // Filtre de soldats
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterAssignableSoldiers();
        });
    }
    
    // Filtre par unité
    if (unitFilterSelect) {
        // Remplir le sélecteur d'unités
        populateUnitFilter(unitFilterSelect);
        
        unitFilterSelect.addEventListener('change', () => {
            if (document.querySelector('.tab[data-tab="soldiers"]').classList.contains('active')) {
                filterAssignableSoldiers();
            } else {
                const selectedUnitId = unitFilterSelect.value;
                if (selectedUnitId !== 'all') {
                    displayUnitSoldiers(selectedUnitId);
                } else {
                    loadAllUnits();
                }
            }
        });
    }
    
    // Gestion des onglets
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les onglets et contenus
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet cliqué et au contenu correspondant
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Charger le contenu approprié
            if (tabId === 'units') {
                loadAllUnits();
            } else {
                filterAssignableSoldiers();
            }
        });
    });
}

/**
 * Configure les filtres de formations
 */
function setupFormationFilters() {
    const searchInput = document.getElementById('formation-search');
    const typeFilter = document.getElementById('formation-type-filter');
    
    // Recherche de formations
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterFormations();
        });
    }
    
    // Filtre par type
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            filterFormations();
        });
    }
}

/**
 * Filtre les formations selon les critères de recherche et de type
 */
function filterFormations() {
    const searchInput = document.getElementById('formation-search');
    const typeFilter = document.getElementById('formation-type-filter');
    
    if (!searchInput || !typeFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const typeValue = typeFilter.value;
    
    // Filtrer les formations
    let filteredFormations = formationsData.filter(formation => {
        // Filtre par recherche
        const matchesSearch = formation.name.toLowerCase().includes(searchTerm) || 
                             formation.description.toLowerCase().includes(searchTerm);
        
        // Filtre par type
        const matchesType = typeValue === 'all' || formation.type === typeValue;
        
        return matchesSearch && matchesType;
    });
    
    // Afficher les formations filtrées
    displayFormations(filteredFormations);
}

/**
 * Affiche les formations dans la grille
 * @param {Array} formations - Liste des formations à afficher
 */
function displayFormations(formations) {
    const grid = document.getElementById('formations-grid');
    
    if (!grid) return;
    
    // Vider la grille
    grid.innerHTML = '';
    
    // Si aucune formation, afficher un message
    if (formations.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'formation-card formation-placeholder';
        placeholder.innerHTML = '<h3>Aucune formation trouvée</h3>';
        grid.appendChild(placeholder);
        return;
    }
    
    // Afficher chaque formation
    formations.forEach(formation => {
        const card = createFormationCard(formation);
        grid.appendChild(card);
    });
}

/**
 * Crée une carte de formation
 * @param {Object} formation - Données de la formation
 * @returns {HTMLElement} Élément HTML de la carte
 */
function createFormationCard(formation) {
    const card = document.createElement('div');
    card.className = 'formation-card';
    card.setAttribute('data-formation-id', formation.id);
    
    // Calculer le statut de capacité
    const participantsCount = formation.participants ? formation.participants.length : 0;
    const capacityPercentage = (participantsCount / formation.capacity) * 100;
    let capacityStatus = 'available';
    
    if (capacityPercentage >= 100) {
        capacityStatus = 'full';
    } else if (capacityPercentage >= 75) {
        capacityStatus = 'limited';
    }
    
    // Contenu de la carte
    card.innerHTML = `
        <div class="formation-card-header">
            <h3>${formation.name}</h3>
            <div class="formation-type-badge ${formation.type}">${capitalizeFirstLetter(formation.type)}</div>
        </div>
        <div class="formation-card-body">
            <p class="formation-description">${formation.description}</p>
            <div class="formation-metadata">
                <div class="formation-metadata-item">
                    <span class="metadata-label">Durée:</span>
                    <span class="metadata-value">${formation.duration} jour${formation.duration > 1 ? 's' : ''}</span>
                </div>
                <div class="formation-metadata-item">
                    <span class="metadata-label">Prérequis:</span>
                    <span class="metadata-value">${formation.prerequisites ? formation.prerequisites : 'Aucun prérequis'}</span>
                </div>
            </div>
        </div>
        <div class="formation-card-footer">
            <div class="formation-capacity">
                <div class="capacity-indicator capacity-${capacityStatus}"></div>
                <span>${participantsCount}/${formation.capacity} places</span>
            </div>
            <button class="military-btn view-details-btn">Détails</button>
        </div>
    `;
    
    // Ajouter l'événement de clic pour voir les détails
    card.addEventListener('click', () => {
        openFormationDetailModal(formation.id);
    });
    
    return card;
}

/**
 * Ouvre la modale de détail d'une formation
 * @param {string} formationId - Identifiant de la formation
 */
function openFormationDetailModal(formationId) {
    const formation = formationsData.find(f => f.id === formationId);
    
    if (!formation) return;
    
    // Mettre à jour l'ID de la formation sélectionnée
    selectedFormationId = formationId;
    
    // Mettre à jour le contenu de la modale
    document.getElementById('formation-detail-title').textContent = formation.name;
    document.getElementById('formation-detail-type').textContent = capitalizeFirstLetter(formation.type);
    document.getElementById('formation-detail-type').className = `formation-type-badge ${formation.type}`;
    document.getElementById('formation-detail-description').textContent = formation.description;
    document.getElementById('formation-detail-duration').textContent = `${formation.duration} jour${formation.duration > 1 ? 's' : ''}`;
    document.getElementById('formation-detail-prerequisites').textContent = formation.prerequisites || 'Aucun';
    document.getElementById('formation-detail-capacity').textContent = `${formation.participants ? formation.participants.length : 0}/${formation.capacity} places`;
    
    // Afficher les participants
    displayParticipants(formation);
    
    // Afficher la modale
    const modal = document.getElementById('formation-detail-modal');
    if (modal) {
        // Assurer que la modale est centrée
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.classList.remove('hidden-modal');
    }
}

/**
 * Affiche les participants d'une formation
 * @param {Object} formation - Données de la formation
 */
function displayParticipants(formation) {
    const participantsList = document.getElementById('formation-participants-list');
    
    if (!participantsList) return;
    
    // Vider la liste
    participantsList.innerHTML = '';
    
    // Si aucun participant, afficher un message
    if (!formation.participants || formation.participants.length === 0) {
        participantsList.innerHTML = '<div class="empty-list">Aucun participant inscrit à cette formation</div>';
        return;
    }
    
    // Afficher chaque participant
    formation.participants.forEach(participantId => {
        const soldier = allSoldiersData.find(s => s.id === participantId);
        
        if (soldier) {
            const participantItem = document.createElement('div');
            participantItem.className = 'participant-item';
            
            participantItem.innerHTML = `
                <div class="participant-info">
                    <div class="participant-avatar">${soldier.firstName.charAt(0)}${soldier.lastName.charAt(0)}</div>
                    <div>
                        <div class="participant-name">${soldier.rank} ${soldier.lastName} ${soldier.firstName}</div>
                        <div class="participant-unit">${soldier.unit || 'Non assigné'}</div>
                    </div>
                </div>
                <div class="participant-actions">
                    <button class="military-btn remove-participant" data-soldier-id="${soldier.id}">Retirer</button>
                </div>
            `;
            
            participantsList.appendChild(participantItem);
            
            // Ajouter l'événement pour retirer le participant
            const removeBtn = participantItem.querySelector('.remove-participant');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeParticipant(soldier.id, formation.id);
                });
            }
        }
    });
}

/**
 * Retire un participant d'une formation
 * @param {string} soldierId - Identifiant du soldat
 * @param {string} formationId - Identifiant de la formation
 */
function removeParticipant(soldierId, formationId) {
    const formationIndex = formationsData.findIndex(f => f.id === formationId);
    
    if (formationIndex === -1) return;
    
    // Retirer le participant
    const participantIndex = formationsData[formationIndex].participants.indexOf(soldierId);
    
    if (participantIndex !== -1) {
        formationsData[formationIndex].participants.splice(participantIndex, 1);
        
        // Mettre à jour l'historique du soldat
        updateSoldierHistory(soldierId, `Retiré de la formation "${formationsData[formationIndex].name}"`);
        
        // Sauvegarder les modifications
        saveFormations();
        
        // Mettre à jour l'affichage
        displayParticipants(formationsData[formationIndex]);
        document.getElementById('formation-detail-capacity').textContent = `${formationsData[formationIndex].participants.length}/${formationsData[formationIndex].capacity} places`;
        displayFormations(formationsData);
    }
}

/**
 * Ouvre la modale d'édition de formation
 * @param {string} formationId - Identifiant de la formation (optionnel, pour modification)
 */
function openFormationEditModal(formationId = null) {
    const modal = document.getElementById('formation-edit-modal');
    const titleElement = document.getElementById('formation-edit-title');
    
    // Réinitialiser le formulaire
    resetFormationForm();
    
    // Si un ID est fourni, c'est une modification
    if (formationId) {
        const formation = formationsData.find(f => f.id === formationId);
        
        if (formation) {
            // Mettre à jour le titre
            if (titleElement) titleElement.textContent = 'Modifier la Formation';
            
            // Remplir le formulaire
            document.getElementById('formation-name').value = formation.name;
            document.getElementById('formation-type').value = formation.type;
            document.getElementById('formation-description').value = formation.description;
            document.getElementById('formation-duration').value = formation.duration;
            document.getElementById('formation-capacity').value = formation.capacity;
            document.getElementById('formation-prerequisites').value = formation.prerequisites || '';
            
            // Stocker l'ID pour la sauvegarde
            document.getElementById('formation-form').setAttribute('data-formation-id', formationId);
        }
    } else {
        // C'est un ajout
        if (titleElement) titleElement.textContent = 'Ajouter une Formation';
        document.getElementById('formation-form').removeAttribute('data-formation-id');
    }
    
    // Afficher la modale
    if (modal) {
        // Assurer que la modale est centrée
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.classList.remove('hidden-modal');
    }
}

/**
 * Réinitialise le formulaire de formation
 */
function resetFormationForm() {
    const form = document.getElementById('formation-form');
    
    if (form) {
        form.reset();
        form.removeAttribute('data-formation-id');
    }
}

/**
 * Sauvegarde la formation depuis le formulaire
 */
function saveFormationFromForm() {
    const form = document.getElementById('formation-form');
    
    if (!form) return;
    
    // Récupérer les valeurs du formulaire
    const name = document.getElementById('formation-name').value;
    const type = document.getElementById('formation-type').value;
    const description = document.getElementById('formation-description').value;
    const duration = parseInt(document.getElementById('formation-duration').value);
    const capacity = parseInt(document.getElementById('formation-capacity').value);
    const prerequisites = document.getElementById('formation-prerequisites').value;
    
    // Vérifier si c'est une modification ou un ajout
    const formationId = form.getAttribute('data-formation-id');
    
    if (formationId) {
        // Modification
        const formationIndex = formationsData.findIndex(f => f.id === formationId);
        
        if (formationIndex !== -1) {
            // Mettre à jour la formation
            formationsData[formationIndex].name = name;
            formationsData[formationIndex].type = type;
            formationsData[formationIndex].description = description;
            formationsData[formationIndex].duration = duration;
            formationsData[formationIndex].capacity = capacity;
            formationsData[formationIndex].prerequisites = prerequisites;
        }
    } else {
        // Ajout
        const newFormation = {
            id: generateUniqueId(),
            name,
            type,
            description,
            duration,
            capacity,
            prerequisites,
            participants: []
        };
        
        formationsData.push(newFormation);
    }
    
    // Sauvegarder les modifications
    saveFormations();
    
    // Fermer la modale
    document.getElementById('formation-edit-modal').classList.add('hidden-modal');
    
    // Mettre à jour l'affichage
    displayFormations(formationsData);
}

/**
 * Ouvre la modale d'assignation de soldats
 * @param {string} formationId - Identifiant de la formation
 */
function openAssignSoldiersModal(formationId) {
    const formation = formationsData.find(f => f.id === formationId);
    
    if (!formation) return;
    
    // Mettre à jour l'ID de la formation sélectionnée
    selectedFormationId = formationId;
    
    // Réinitialiser la liste des soldats sélectionnés
    selectedSoldiers = [];
    
    // Afficher les soldats assignables
    displayAssignableSoldiers(formation);
    
    // Afficher la modale
    const modal = document.getElementById('assign-soldiers-modal');
    if (modal) {
        // Assurer que la modale est centrée
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.classList.remove('hidden-modal');
    }
}

/**
 * Affiche les soldats assignables à une formation
 * @param {Object} formation - Données de la formation
 */
function displayAssignableSoldiers(formation) {
    // Récupérer tous les soldats
    allSoldiersData = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    
    // Afficher les soldats dans l'onglet Soldats
    const soldiersList = document.getElementById('assignable-soldiers-list');
    if (soldiersList) {
        soldiersList.innerHTML = '';
        
        if (allSoldiersData.length === 0) {
            soldiersList.innerHTML = '<div class="no-soldiers">Aucun soldat disponible</div>';
            return;
        }
        
        // Filtrer les soldats selon les critères
        filterAssignableSoldiers();
    }
    
    // Initialiser l'onglet Unités
    const unitsTab = document.querySelector('.tab[data-tab="units"]');
    if (unitsTab) {
        // Préparer l'onglet Unités pour le chargement ultérieur
        document.getElementById('assignable-units-list').innerHTML = '';
        document.getElementById('unit-soldiers-list').innerHTML = '';
    }
}

/**
 * Filtre les soldats assignables selon les critères de recherche et de filtre
 */
function filterAssignableSoldiers() {
    const soldiersList = document.getElementById('assignable-soldiers-list');
    const searchInput = document.getElementById('soldier-search');
    const filterSelect = document.getElementById('soldier-filter');
    const unitFilterSelect = document.getElementById('unit-filter');
    
    if (!soldiersList || !searchInput || !filterSelect) return;
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    
    if (!formation) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    const unitFilterValue = unitFilterSelect ? unitFilterSelect.value : 'all';
    
    // Vider la liste
    soldiersList.innerHTML = '';
    
    // Récupérer les unités si nécessaire
    let selectedUnitMembers = [];
    if (unitFilterValue !== 'all') {
        const units = getAllUnits();
        const selectedUnit = units.find(unit => unit.id === unitFilterValue);
        if (selectedUnit && selectedUnit.members) {
            selectedUnitMembers = selectedUnit.members;
        }
    }
    
    // Filtrer les soldats
    let filteredSoldiers = allSoldiersData.filter(soldier => {
        // Exclure les soldats déjà participants
        const isParticipant = formation.participants && formation.participants.includes(soldier.id);
        
        if (isParticipant) return false;
        
        // Filtre par unité
        const matchesUnit = unitFilterValue === 'all' || selectedUnitMembers.includes(soldier.id);
        if (!matchesUnit) return false;
        
        // Filtre par recherche
        const fullName = `${soldier.rank} ${soldier.lastName} ${soldier.firstName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm);
        
        // Filtre par disponibilité/éligibilité
        let matchesFilter = true;
        
        if (filterValue === 'available') {
            // Vérifier si le soldat est disponible (pas en mission, etc.)
            matchesFilter = soldier.status === 'Actif';
        } else if (filterValue === 'eligible') {
            // Vérifier si le soldat est éligible (prérequis remplis)
            matchesFilter = checkEligibility(soldier, formation);
        }
        
        return matchesSearch && matchesFilter;
    });
    
    // Si aucun soldat, afficher un message
    if (filteredSoldiers.length === 0) {
        soldiersList.innerHTML = '<div class="empty-list">Aucun soldat disponible</div>';
        return;
    }
    
    // Afficher chaque soldat
    filteredSoldiers.forEach(soldier => {
        const isEligible = checkEligibility(soldier, formation);
        const soldierItem = document.createElement('div');
        soldierItem.className = 'soldier-item';
        
        soldierItem.innerHTML = `
            <div class="soldier-info">
                <input type="checkbox" class="soldier-checkbox" data-soldier-id="${soldier.id}" ${!isEligible ? 'disabled' : ''}>
                <div>
                    <div class="soldier-name">${soldier.rank} ${soldier.lastName} ${soldier.firstName}</div>
                    <div class="soldier-details">${soldier.unit || 'Non assigné'} - ${soldier.status}</div>
                </div>
            </div>
            <div class="soldier-eligibility ${isEligible ? 'eligible' : 'ineligible'}">
                ${isEligible ? 'Éligible' : 'Non éligible'}
            </div>
        `;
        
        soldiersList.appendChild(soldierItem);
        
        // Ajouter l'événement pour sélectionner le soldat
        const checkbox = soldierItem.querySelector('.soldier-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedSoldiers.push(soldier.id);
                } else {
                    const index = selectedSoldiers.indexOf(soldier.id);
                    if (index !== -1) selectedSoldiers.splice(index, 1);
                }
            });
        }
    });
}

/**
 * Vérifie si un soldat est éligible à une formation
 * @param {Object} soldier - Données du soldat
 * @param {Object} formation - Données de la formation
 * @returns {boolean} True si le soldat est éligible, false sinon
 */
function checkEligibility(soldier, formation) {
    // Si pas de prérequis, tous les soldats sont éligibles
    if (!formation.prerequisites || formation.prerequisites === 'Aucun') return true;
    
    // Vérifier les prérequis
    const prerequisites = formation.prerequisites.toLowerCase();
    
    // Vérifier le grade minimum
    if (prerequisites.includes('grade')) {
        const requiredRank = prerequisites.match(/grade ([a-zA-Z]+) minimum/i);
        
        if (requiredRank && requiredRank[1]) {
            const rankHierarchy = ['Recrue', 'Soldat', 'Caporal', 'Sergent', 'Adjudant', 'Lieutenant', 'Capitaine', 'Commandant', 'Colonel'];
            const requiredRankIndex = rankHierarchy.findIndex(r => r.toLowerCase() === requiredRank[1].toLowerCase());
            const soldierRankIndex = rankHierarchy.findIndex(r => r === soldier.rank);
            
            if (requiredRankIndex !== -1 && soldierRankIndex !== -1 && soldierRankIndex < requiredRankIndex) {
                return false;
            }
        }
    }
    
    // Vérifier l'expérience minimum
    if (prerequisites.includes('expérience')) {
        // Implémentation simplifiée, à adapter selon les données disponibles
        // Par exemple, vérifier la date d'incorporation
    }
    
    // Vérifier les formations préalables
    if (prerequisites.includes('formation')) {
        // Implémentation simplifiée, à adapter selon les données disponibles
        // Par exemple, vérifier l'historique des formations
    }
    
    return true;
}

/**
 * Assigne les soldats sélectionnés à la formation
 */
function assignSelectedSoldiersToFormation() {
    if (!selectedFormationId || selectedSoldiers.length === 0) {
        console.log('Aucun soldat sélectionné ou aucune formation sélectionnée');
        return;
    }
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    if (!formation) {
        console.error('Formation non trouvée:', selectedFormationId);
        return;
    }
    
    // Stocker le nombre de soldats avant assignation pour le message
    const nbSoldiers = selectedSoldiers.length;
    
    // Ajouter les soldats sélectionnés à la formation
    selectedSoldiers.forEach(soldierId => {
        if (!formation.participants.includes(soldierId)) {
            formation.participants.push(soldierId);
            console.log(`Soldat ${soldierId} assigné à la formation ${formation.name}`);
        }
    });
    
    // Sauvegarder les modifications
    saveFormations();
    
    // Mettre à jour l'affichage
    displayFormations(formationsData);
    
    // Réinitialiser la sélection
    selectedSoldiers = [];
    
    // Afficher un message de confirmation
    alert(`${nbSoldiers} soldat${nbSoldiers > 1 ? 's' : ''} assigné${nbSoldiers > 1 ? 's' : ''} à la formation ${formation.name}`);
}

/**
 * Assigne les soldats sélectionnés à la formation
 */
function assignSelectedSoldiers() {
    if (selectedSoldiers.length === 0 || !selectedFormationId) return;
    
    const formationIndex = formationsData.findIndex(f => f.id === selectedFormationId);
    
    if (formationIndex === -1) return;
    
    // Récupérer la formation
    const formation = formationsData[formationIndex];
    
    // Vérifier la capacité
    const currentParticipants = formation.participants ? formation.participants.length : 0;
    const availableSlots = formation.capacity - currentParticipants;
    
    if (availableSlots <= 0) {
        alert('Cette formation est complète. Impossible d\'ajouter de nouveaux participants.');
        return;
    }
    
    // Limiter le nombre de soldats à assigner si nécessaire
    const soldiersToAssign = selectedSoldiers.slice(0, availableSlots);
    
    // Initialiser le tableau des participants si nécessaire
    if (!formation.participants) {
        formation.participants = [];
    }
    
    // Assigner les soldats
    soldiersToAssign.forEach(soldierId => {
        if (!formation.participants.includes(soldierId)) {
            formation.participants.push(soldierId);
            
            // Mettre à jour l'historique du soldat
            updateSoldierHistory(soldierId, `Assigné à la formation "${formation.name}"`);
        }
    });
    
    // Sauvegarder les modifications
    saveFormations();
    
    // Ouvrir la modale de détail pour voir les participants
    openFormationDetailModal(selectedFormationId);
}

/**
 * Met à jour l'historique d'un soldat
 * @param {string} soldierId - Identifiant du soldat
 * @param {string} event - Description de l'événement
 */
function updateSoldierHistory(soldierId, event) {
    const soldierIndex = allSoldiersData.findIndex(s => s.id === soldierId);
    
    if (soldierIndex === -1) return;
    
    // Initialiser l'historique si nécessaire
    if (!allSoldiersData[soldierIndex].history) {
        allSoldiersData[soldierIndex].history = [];
    }
    
    // Ajouter l'événement à l'historique
    allSoldiersData[soldierIndex].history.push({
        date: new Date().toISOString(),
        event: event,
        type: 'formation'
    });
    
    // Sauvegarder les modifications
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(allSoldiersData));
}

/**
 * Capitalise la première lettre d'une chaîne
 * @param {string} string - Chaîne à capitaliser
 * @returns {string} Chaîne avec la première lettre en majuscule
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Configure la fermeture des modales en cliquant sur l'arrière-plan
 */
function setupModalBackgroundClose() {
    // Récupérer toutes les modales
    const modals = document.querySelectorAll('.modal-bg');
    
    modals.forEach(modal => {
        // Ajouter un événement de clic sur l'arrière-plan
        modal.addEventListener('click', (e) => {
            // Si le clic est sur l'arrière-plan (modal-bg) et non sur le contenu de la modale
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
        
        // Ajouter un événement de touche Echap pour fermer la modale
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden-modal')) {
                closeModal(modal.id);
            }
        });
        
        // S'assurer que tous les boutons de fermeture fonctionnent
        const closeButtons = modal.querySelectorAll('.close-modal-btn, .cancel-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(modal.id);
            });
        });
    });
}

/**
 * Ferme une modale spécifique et réinitialise les données si nécessaire
 * @param {string} modalId - Identifiant de la modale à fermer
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('hidden-modal');
    
    // Réinitialiser les données spécifiques à chaque modale
    if (modalId === 'assign-soldiers-modal') {
        selectedSoldiers = [];
    } else if (modalId === 'formation-edit-modal') {
        resetFormationForm();
    }
    
    console.log(`Modale ${modalId} fermée`);
}

/**
 * Remplit le sélecteur d'unités avec les unités disponibles
 * @param {HTMLSelectElement} selectElement - Élément select à remplir
 */
function populateUnitFilter(selectElement) {
    // Vider le sélecteur sauf l'option "Toutes les unités"
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    // Récupérer les unités
    const units = getAllUnits();
    
    // Ajouter les options pour chaque unité
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `${unit.name} (${unit.type})`;
        selectElement.appendChild(option);
    });
}

/**
 * Récupère toutes les unités depuis le stockage local
 * @returns {Array} Tableau des unités
 */
function getAllUnits() {
    const unitsData = localStorage.getItem('eagleOperator_units');
    return unitsData ? JSON.parse(unitsData) : [];
}

/**
 * Charge et affiche toutes les unités dans la liste
 */
function loadAllUnits() {
    const unitsList = document.getElementById('assignable-units-list');
    if (!unitsList) return;
    
    // Vider la liste
    unitsList.innerHTML = '';
    
    // Récupérer toutes les unités
    const units = getAllUnits();
    
    if (units.length === 0) {
        unitsList.innerHTML = '<div class="no-units">Aucune unité disponible</div>';
        return;
    }
    
    // Trier les unités par type et nom
    units.sort((a, b) => {
        // D'abord par type d'unité (QG, Compagnie, Section, Escouade)
        const typeOrder = { 'QG': 0, 'Compagnie': 1, 'Section': 2, 'Escouade': 3 };
        const typeA = typeOrder[a.type] || 999;
        const typeB = typeOrder[b.type] || 999;
        
        if (typeA !== typeB) return typeA - typeB;
        
        // Ensuite par nom
        return a.name.localeCompare(b.name);
    });
    
    // Créer les éléments pour chaque unité
    units.forEach(unit => {
        // Créer l'élément d'unité
        const unitItem = document.createElement('div');
        unitItem.className = 'unit-item';
        unitItem.setAttribute('data-unit-id', unit.id);
        
        unitItem.innerHTML = `
            <div class="unit-info">
                <div class="unit-name">${unit.name}</div>
                <div class="unit-type">${unit.type}</div>
            </div>
            <div class="unit-count">${unit.members ? unit.members.length : 0} soldats</div>
        `;
        
        unitItem.addEventListener('click', () => {
            // Retirer la sélection de toutes les unités
            document.querySelectorAll('.unit-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Sélectionner cette unité
            unitItem.classList.add('selected');
            
            // Afficher les soldats de cette unité
            displayUnitSoldiers(unit.id);
        });
        
        unitsList.appendChild(unitItem);
    });
}

/**
 * Affiche les soldats d'une unité spécifique
 * @param {string} unitId - Identifiant de l'unité
 */
function displayUnitSoldiers(unitId) {
    const unitSoldiersList = document.getElementById('unit-soldiers-list');
    if (!unitSoldiersList) return;
    
    // Vider la liste
    unitSoldiersList.innerHTML = '';
    
    // Récupérer les soldats de l'unité
    const units = getAllUnits();
    const unit = units.find(u => u.id === unitId);
    
    if (!unit || !unit.members || unit.members.length === 0) {
        unitSoldiersList.innerHTML = '<div class="no-soldiers">Aucun soldat dans cette unité</div>';
        return;
    }
    
    // Récupérer tous les soldats
    const allSoldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    
    // Filtrer les soldats qui appartiennent à cette unité
    const unitSoldiers = allSoldiers.filter(soldier => unit.members.includes(soldier.id));
    
    // Afficher les soldats
    unitSoldiers.forEach(soldier => {
        const soldierItem = createSoldierItemForAssignment(soldier);
        unitSoldiersList.appendChild(soldierItem);
    });
}

/**
 * Filtre les soldats assignables selon les critères de recherche et de filtre
 */
function filterAssignableSoldiers() {
    const searchInput = document.getElementById('soldier-search');
    const filterSelect = document.getElementById('soldier-filter');
    const unitFilterSelect = document.getElementById('unit-filter');
    const soldiersList = document.getElementById('assignable-soldiers-list');
    
    if (!soldiersList || !searchInput || !filterSelect || !unitFilterSelect) return;
    
    // Vider la liste
    soldiersList.innerHTML = '';
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    if (!formation) return;
    
    // Récupérer les valeurs des filtres
    const searchValue = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    const unitFilterValue = unitFilterSelect.value;
    
    // Filtrer les soldats selon les critères
    let filteredSoldiers = allSoldiersData.filter(soldier => {
        // Filtre de recherche
        const nameMatch = `${soldier.firstName} ${soldier.lastName}`.toLowerCase().includes(searchValue) ||
                         `${soldier.lastName} ${soldier.firstName}`.toLowerCase().includes(searchValue) ||
                         (soldier.id && soldier.id.toLowerCase().includes(searchValue));
        
        // Filtre de statut
        let statusMatch = true;
        if (filterValue === 'available') {
            statusMatch = !formation.participants.includes(soldier.id);
        } else if (filterValue === 'eligible') {
            statusMatch = checkEligibility(soldier, formation) && !formation.participants.includes(soldier.id);
        }
        
        // Filtre d'unité
        let unitMatch = true;
        if (unitFilterValue !== 'all') {
            // Vérifier si le soldat appartient à l'unité sélectionnée
            const units = getAllUnits();
            const unit = units.find(u => u.id === unitFilterValue);
            if (unit && unit.members) {
                unitMatch = unit.members.includes(soldier.id);
            } else {
                unitMatch = false;
            }
        }
        
        return nameMatch && statusMatch && unitMatch;
    });
    
    // Afficher les soldats filtrés
    if (filteredSoldiers.length === 0) {
        soldiersList.innerHTML = '<div class="no-soldiers">Aucun soldat ne correspond aux critères de recherche</div>';
        return;
    }
    
    // Trier les soldats par nom
    filteredSoldiers.sort((a, b) => a.lastName.localeCompare(b.lastName));
    
    // Créer les éléments pour chaque soldat
    filteredSoldiers.forEach(soldier => {
        const soldierItem = createSoldierItemForAssignment(soldier);
        soldiersList.appendChild(soldierItem);
    });
}

/**
 * Crée un élément HTML pour un soldat dans la liste d'assignation
 * @param {Object} soldier - Données du soldat
 * @returns {HTMLElement} Élément HTML du soldat
 */
function createSoldierItemForAssignment(soldier) {
    const formation = formationsData.find(f => f.id === selectedFormationId);
    const isParticipant = formation && formation.participants.includes(soldier.id);
    const isEligible = formation ? checkEligibility(soldier, formation) : true;
    
    const soldierItem = document.createElement('div');
    soldierItem.className = `soldier-item ${isParticipant ? 'participant' : ''} ${!isEligible ? 'ineligible' : ''}`;
    soldierItem.setAttribute('data-soldier-id', soldier.id);
    
    // Créer le contenu HTML du soldat
    soldierItem.innerHTML = `
        <div class="soldier-checkbox">
            <input type="checkbox" id="soldier-${soldier.id}" ${isParticipant ? 'checked disabled' : ''} ${!isEligible && !isParticipant ? 'disabled' : ''}>
        </div>
        <div class="soldier-info">
            <div class="soldier-name">${soldier.rank} ${soldier.lastName} ${soldier.firstName}</div>
            <div class="soldier-details">
                <span class="soldier-id">ID: ${soldier.id}</span>
                <span class="soldier-unit">${soldier.unit ? soldier.unit : 'Sans unité'}</span>
                <span class="soldier-status">${soldier.status}</span>
            </div>
        </div>
    `;
    
    // Ajouter un gestionnaire d'événement pour la sélection
    const checkbox = soldierItem.querySelector(`#soldier-${soldier.id}`);
    if (checkbox && !isParticipant && isEligible) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedSoldiers.includes(soldier.id)) {
                    selectedSoldiers.push(soldier.id);
                }
            } else {
                const index = selectedSoldiers.indexOf(soldier.id);
                if (index !== -1) {
                    selectedSoldiers.splice(index, 1);
                }
            }
            console.log('Soldats sélectionnés:', selectedSoldiers);
        });
    }
    
    return soldierItem;
}

// Fin du fichier formationManager.js
