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
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden-modal');
            resetFormationForm();
        });
    }
    
    // Annuler l'édition
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
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
        closeBtn.addEventListener('click', () => {
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
    const closeBtn = document.getElementById('close-assign-soldiers');
    const cancelBtn = document.getElementById('cancel-assign');
    const confirmBtn = document.getElementById('confirm-assign');
    const searchInput = document.getElementById('soldier-search');
    const filterSelect = document.getElementById('soldier-filter');
    
    // Fermer la modale
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden-modal');
            selectedSoldiers = [];
        });
    }
    
    // Annuler l'assignation
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden-modal');
            selectedSoldiers = [];
        });
    }
    
    // Confirmer l'assignation
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            assignSelectedSoldiers();
            modal.classList.add('hidden-modal');
            selectedSoldiers = [];
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
                <span>${formation.duration} jour${formation.duration > 1 ? 's' : ''}</span>
                <span>${formation.prerequisites ? formation.prerequisites : 'Aucun prérequis'}</span>
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
    const soldiersList = document.getElementById('assignable-soldiers-list');
    
    if (!soldiersList) return;
    
    // Filtrer les soldats
    filterAssignableSoldiers();
}

/**
 * Filtre les soldats assignables selon les critères de recherche et de filtre
 */
function filterAssignableSoldiers() {
    const soldiersList = document.getElementById('assignable-soldiers-list');
    const searchInput = document.getElementById('soldier-search');
    const filterSelect = document.getElementById('soldier-filter');
    
    if (!soldiersList || !searchInput || !filterSelect) return;
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    
    if (!formation) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    
    // Vider la liste
    soldiersList.innerHTML = '';
    
    // Filtrer les soldats
    let filteredSoldiers = allSoldiersData.filter(soldier => {
        // Exclure les soldats déjà participants
        const isParticipant = formation.participants && formation.participants.includes(soldier.id);
        
        if (isParticipant) return false;
        
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
