/**
 * Gestionnaire des missions pour Eagle Operator
 * Ce module gère l'affichage, l'ajout, la modification et l'assignation des soldats aux missions
 */

// Variables globales
let missionsData = [];
let allSoldiersData = [];
let selectedMissionId = null;
let selectedSoldiers = [];
let currentView = 'list';

// Initialisation du gestionnaire de missions
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du gestionnaire de missions');
    
    // Charger les soldats d'abord pour s'assurer que allSoldiersData est initialisé
    loadSoldiers();
    
    // Charger les missions
    loadMissions();
    
    // Configurer les événements
    setupMissionEvents();
    setupMissionModals();
    setupMissionFilters();
});

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification ('success', 'error', 'warning', 'info')
 */
function showNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Ajouter la notification au document
    document.body.appendChild(notification);
    
    // Ajouter l'écouteur d'événement pour fermer la notification
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
    }
    
    // Fermer automatiquement la notification après 5 secondes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Charge les missions depuis le localStorage
 */
function loadMissions() {
    missionsData = JSON.parse(localStorage.getItem('eagleOperator_missions') || '[]');
    
    // Si aucune mission n'existe, créer des missions par défaut
    if (missionsData.length === 0) {
        missionsData = createDefaultMissions();
        saveMissions();
    }
    
    // Afficher les missions
    displayMissions(missionsData);
}

/**
 * Récupère le nom d'une unité à partir de son ID
 * @param {string} unitId - L'ID de l'unité
 * @returns {string} Le nom de l'unité ou 'Sans unité' si non trouvé
 */
function getUnitNameById(unitId) {
    if (!unitId) return 'Sans unité';
    
    const units = getAllUnits();
    const unit = units.find(u => u.id === unitId);
    
    return unit ? (unit.name || unit.nom || 'Unité sans nom') : 'Sans unité';
}

/**
 * Génère un ID unique pour une unité basé sur son type et son nom
 * @param {Object} unit - L'unité pour laquelle générer un ID
 * @returns {string} ID unique au format préfixe_type + suffixe_nom + timestamp
 */
function generateUnitId(unit) {
    try {
        // Définir le préfixe basé sur le type d'unité
        let prefix = 'unit';
        if (unit.type) {
            const type = unit.type.toLowerCase();
            if (type === 'qg') prefix = 'qg';
            else if (type === 'compagnie') prefix = 'cmp';
            else if (type === 'section') prefix = 'sec';
            else if (type === 'escouade') prefix = 'sqd';
        }
        
        // Créer un suffixe basé sur le nom de l'unité (sans espaces, caractères spéciaux)
        let suffix = '';
        if (unit.name) {
            suffix = unit.name.toLowerCase()
                .replace(/[^a-z0-9]/g, '') // Supprimer tous les caractères non alphanumériques
                .substring(0, 10); // Limiter à 10 caractères
        }
        
        // Ajouter un timestamp pour garantir l'unicité
        const timestamp = Date.now().toString().slice(-6);
        
        return `${prefix}_${suffix}_${timestamp}`;
    } catch (error) {
        console.error('Erreur lors de la génération de l\'ID d\'unité:', error);
        return `unit_${Date.now()}`;
    }
}

/**
 * Récupère toutes les unités depuis le localStorage et s'assure qu'elles ont toutes un ID unique
 * @returns {Array} Liste des unités avec IDs uniques
 */
function getAllUnits() {
    try {
        // Récupérer les unités depuis le localStorage
        const units = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
        
        // Vérifier et générer des IDs pour les unités qui n'en ont pas
        const unitsWithIds = units.map(unit => {
            // Si l'unité n'a pas d'ID, en générer un
            if (!unit.id) {
                unit.id = generateUnitId(unit);
            }
            return unit;
        });
        
        // Sauvegarder les unités mises à jour si nécessaire
        if (JSON.stringify(units) !== JSON.stringify(unitsWithIds)) {
            localStorage.setItem('eagleOperator_units', JSON.stringify(unitsWithIds));
            console.log('IDs d\'unités générés et sauvegardés');
        }
        
        return unitsWithIds;
    } catch (error) {
        console.error('Erreur lors de la récupération des unités:', error);
        return [];
    }
}

/**
 * Charge les données des soldats depuis le localStorage
 */
function loadSoldiers() {
    try {
        const soldiersData = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        allSoldiersData = validateAndFixSoldierData(soldiersData);
        console.log(`${allSoldiersData.length} soldats chargés`);
    } catch (error) {
        console.error('Erreur lors du chargement des soldats:', error);
        allSoldiersData = [];
    }
}

/**
 * Vérifie et corrige les données des soldats
 * @param {Array} soldiers - Liste des soldats à vérifier
 * @returns {Array} Liste des soldats avec données corrigées
 */
function validateAndFixSoldierData(soldiers) {
    return soldiers.map(soldier => {
        // S'assurer que les propriétés essentielles existent
        if (!soldier.id) {
            soldier.id = generateUniqueId();
        }
        
        if (!soldier.firstName) {
            soldier.firstName = soldier.firstName || 'Sans prénom';
        }
        
        if (!soldier.lastName) {
            soldier.lastName = soldier.lastName || 'Sans nom';
        }
        
        if (!soldier.rank) {
            soldier.rank = soldier.rank || 'Soldat';
        }
        
        if (!soldier.status) {
            soldier.status = soldier.status || 'Actif';
        }
        
        // S'assurer que les missions existent
        if (!soldier.missions) {
            soldier.missions = [];
        }
        
        return soldier;
    });
}

/**
 * Crée des missions par défaut
 * @returns {Array} Liste des missions par défaut
 */
function createDefaultMissions() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    return [
        {
            id: generateUniqueId(),
            name: "Opération Aigle Noir",
            type: "combat",
            description: "Mission de combat contre des forces hostiles dans la région montagneuse du nord. Objectif principal: neutraliser les positions ennemies et sécuriser la zone.",
            startDate: formatDateForInput(tomorrow),
            endDate: formatDateForInput(nextWeek),
            status: "planifiee",
            location: "Région montagneuse du Nord",
            objectives: [
                "Neutraliser les positions ennemies",
                "Sécuriser la zone d'opération",
                "Établir un périmètre de sécurité"
            ],
            participants: []
        },
        {
            id: generateUniqueId(),
            name: "Reconnaissance Delta",
            type: "reconnaissance",
            description: "Mission de reconnaissance dans la zone urbaine de l'est. Objectif: collecter des informations sur les mouvements ennemis et identifier les points stratégiques.",
            startDate: formatDateForInput(now),
            endDate: formatDateForInput(tomorrow),
            status: "en_cours",
            location: "Zone urbaine Est",
            objectives: [
                "Observer les mouvements ennemis",
                "Identifier les points stratégiques",
                "Rapporter les informations au QG"
            ],
            participants: []
        },
        {
            id: generateUniqueId(),
            name: "Extraction Phoenix",
            type: "extraction",
            description: "Mission d'extraction d'un agent infiltré dans le territoire ennemi. Haute priorité et discrétion absolue requise.",
            startDate: formatDateForInput(nextWeek),
            endDate: formatDateForInput(twoWeeksLater),
            status: "planifiee",
            location: "Territoire ennemi - Secteur 7",
            objectives: [
                "Localiser l'agent infiltré",
                "Sécuriser l'extraction",
                "Retour à la base sans être détecté"
            ],
            participants: []
        }
    ];
}

/**
 * Sauvegarde les missions dans le localStorage
 */
function saveMissions() {
    localStorage.setItem('eagleOperator_missions', JSON.stringify(missionsData));
}

/**
 * Génère un identifiant unique
 * @returns {string} Identifiant unique
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Formate une date pour l'affichage
 * @param {string} dateString - Chaîne de date au format ISO
 * @returns {string} Date formatée (JJ/MM/AAAA)
 */
function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formate une date pour les champs input de type date
 * @param {Date} date - Objet Date
 * @returns {string} Date formatée (AAAA-MM-JJ)
 */
function formatDateForInput(date) {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Configure les événements liés aux missions
 */
function setupMissionEvents() {
    // Bouton d'ajout de mission
    const addMissionBtn = document.getElementById('btn-add-mission');
    if (addMissionBtn) {
        addMissionBtn.addEventListener('click', () => openMissionEditModal());
    }
}

/**
 * Configure les modales liées aux missions
 */
function setupMissionModals() {
    setupMissionEditModal();
    setupMissionDetailModal();
    setupAssignSoldiersModal();
    setupStatusChangeModal();
}

/**
 * Configure la modale d'édition de mission
 */
function setupMissionEditModal() {
    // Fermeture de la modale
    const closeBtn = document.getElementById('close-mission-edit-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('mission-edit-modal').classList.add('hidden-modal');
        });
    }
    
    // Bouton d'annulation
    const cancelBtn = document.getElementById('cancel-mission');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('mission-edit-modal').classList.add('hidden-modal');
        });
    }
    
    // Ajout d'objectif
    const addObjectiveBtn = document.getElementById('add-objective-btn');
    if (addObjectiveBtn) {
        addObjectiveBtn.addEventListener('click', addObjectiveField);
    }
    
    // Soumission du formulaire
    const missionForm = document.getElementById('mission-form');
    if (missionForm) {
        missionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveMissionFromForm();
        });
    }
}

/**
 * Ajoute un champ d'objectif dans le formulaire
 */
function addObjectiveField() {
    const container = document.getElementById('objectives-container');
    if (!container) return;
    
    const objectiveCount = container.querySelectorAll('.objective-item').length + 1;
    
    const objectiveItem = document.createElement('div');
    objectiveItem.className = 'objective-item';
    objectiveItem.innerHTML = `
        <input type="text" class="military-input objective-input" placeholder="Objectif ${objectiveCount}" required>
        <button type="button" class="remove-objective-btn">-</button>
    `;
    
    container.appendChild(objectiveItem);
    
    // Ajouter l'événement pour supprimer l'objectif
    const removeBtn = objectiveItem.querySelector('.remove-objective-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            container.removeChild(objectiveItem);
        });
    }
}

/**
 * Configure la modale de détail de mission
 */
function setupMissionDetailModal() {
    // Fermeture de la modale
    const closeBtn = document.getElementById('close-mission-detail-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('mission-detail-modal').classList.add('hidden-modal');
        });
    }
    
    // Bouton de modification
    const editBtn = document.getElementById('btn-edit-mission');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (selectedMissionId) {
                document.getElementById('mission-detail-modal').classList.add('hidden-modal');
                openMissionEditModal(selectedMissionId);
            }
        });
    }
    
    // Bouton d'assignation de soldats
    const assignBtn = document.getElementById('btn-assign-soldiers');
    if (assignBtn) {
        assignBtn.addEventListener('click', () => {
            if (selectedMissionId) {
                document.getElementById('mission-detail-modal').classList.add('hidden-modal');
                openAssignSoldiersModal(selectedMissionId);
            }
        });
    }
    
    // Bouton de changement de statut
    const statusBtn = document.getElementById('btn-change-status');
    if (statusBtn) {
        statusBtn.addEventListener('click', () => {
            if (selectedMissionId) {
                openStatusChangeModal(selectedMissionId);
            }
        });
    }
    
    // Bouton de suppression
    const deleteBtn = document.getElementById('btn-delete-mission');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (selectedMissionId) {
                confirmDeleteMission(selectedMissionId);
            }
        });
    }
}

/**
 * Configure la modale de changement de statut
 */
function setupStatusChangeModal() {
    // Fermeture de la modale
    const closeBtn = document.getElementById('close-status-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('change-status-modal').classList.add('hidden-modal');
        });
    }
    
    // Bouton d'annulation
    const cancelBtn = document.getElementById('cancel-status-change');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('change-status-modal').classList.add('hidden-modal');
        });
    }
    
    // Bouton de confirmation
    const confirmBtn = document.getElementById('confirm-status-change');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedMissionId) {
                changeMissionStatus(selectedMissionId);
            }
        });
    }
}

/**
 * Configure la modale d'assignation de soldats
 */
function setupAssignSoldiersModal() {
    // Fermeture de la modale
    const closeBtn = document.getElementById('close-assign-soldiers-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('assign-soldiers-modal').classList.add('hidden-modal');
        });
    }
    
    // Bouton d'annulation
    const cancelBtn = document.getElementById('cancel-assign');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('assign-soldiers-modal').classList.add('hidden-modal');
        });
    }
    
    // Bouton de confirmation
    const confirmBtn = document.getElementById('confirm-assign');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedMissionId && selectedSoldiers.length > 0) {
                assignSelectedSoldiers(selectedMissionId);
            }
        });
    }
    
    // Filtre d'unité
    const unitFilter = document.getElementById('unit-filter');
    if (unitFilter) {
        unitFilter.addEventListener('change', function() {
            const selectedUnit = this.value;
            const unitName = this.options[this.selectedIndex].text;
            
            document.getElementById('selected-unit-name').textContent = unitName;
            filterAssignableSoldiers(selectedUnit);
        });
    }
    
    // Recherche de soldat
    const searchInput = document.getElementById('soldier-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterAssignableSoldiers(document.getElementById('unit-filter').value, searchTerm);
        });
    }
}

/**
 * Configure les filtres de missions
 */
function setupMissionFilters() {
    // Filtre par type
    const typeFilter = document.getElementById('mission-type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterMissions);
    }
    
    // Filtre par statut
    const statusFilter = document.getElementById('mission-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterMissions);
    }
    
    // Recherche par nom
    const searchInput = document.getElementById('mission-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterMissions);
    }
    
    // Remplir le filtre d'unités pour la modale d'assignation
    populateUnitFilter();
}

/**
 * Remplit le sélecteur d'unités avec les noms des escouades uniquement
 */
function populateUnitFilter() {
    const unitFilter = document.getElementById('unit-filter');
    if (!unitFilter) return;
    
    // Vider le sélecteur sauf l'option "Toutes les unités"
    while (unitFilter.options.length > 1) {
        unitFilter.remove(1);
    }
    
    // Récupérer toutes les unités
    const units = getAllUnits();
    
    // Filtrer pour n'avoir que les escouades
    const squads = units.filter(unit => {
        return unit.type && unit.type.toLowerCase() === 'escouade';
    });
    
    // Ajouter les escouades au sélecteur
    squads.forEach(squad => {
        const option = document.createElement('option');
        option.value = squad.id;
        option.textContent = squad.name || squad.nom || 'Escouade sans nom';
        unitFilter.appendChild(option);
    });
    
    console.log(`${squads.length} escouades ajoutées au filtre d'unités`);
}

/**
 * Filtre les missions selon les critères de recherche et de type
 */
function filterMissions() {
    const searchTerm = document.getElementById('mission-search').value.toLowerCase();
    const typeFilter = document.getElementById('mission-type-filter').value;
    const statusFilter = document.getElementById('mission-status-filter').value;
    
    const filteredMissions = missionsData.filter(mission => {
        // Filtre par recherche
        const matchesSearch = mission.name.toLowerCase().includes(searchTerm) || 
                             mission.description.toLowerCase().includes(searchTerm);
        
        // Filtre par type
        const matchesType = typeFilter === 'all' || mission.type === typeFilter;
        
        // Filtre par statut
        const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    displayMissions(filteredMissions);
}

/**
 * Affiche les missions dans la grille
 * @param {Array} missions - Liste des missions à afficher
 */
function displayMissions(missions) {
    const missionsGrid = document.getElementById('missions-grid');
    if (!missionsGrid) return;
    
    // Vider la grille
    missionsGrid.innerHTML = '';
    
    // Si aucune mission, afficher un message
    if (missions.length === 0) {
        missionsGrid.innerHTML = `
            <div class="mission-card mission-placeholder">
                <h3>Aucune mission trouvée</h3>
            </div>
        `;
        return;
    }
    
    // Ajouter chaque mission à la grille
    missions.forEach(mission => {
        const missionCard = createMissionCard(mission);
        missionsGrid.appendChild(missionCard);
    });
}

/**
 * Crée une carte de mission
 * @param {Object} mission - Données de la mission
 * @returns {HTMLElement} Élément HTML de la carte
 */
function createMissionCard(mission) {
    const card = document.createElement('div');
    card.className = 'mission-card';
    card.dataset.id = mission.id;
    
    // Formater les dates
    const startDate = formatDate(mission.startDate);
    const endDate = formatDate(mission.endDate);
    
    // Créer le contenu de la carte
    card.innerHTML = `
        <div class="mission-card-header">
            <h3>${mission.name}</h3>
            <div class="mission-type-badge ${mission.type}">${getTypeName(mission.type)}</div>
        </div>
        <div class="mission-card-body">
            <p class="mission-description">${mission.description.substring(0, 100)}${mission.description.length > 100 ? '...' : ''}</p>
            <div class="mission-metadata">
                <div class="metadata-item">
                    <span class="metadata-label">Statut:</span>
                    <span class="mission-status ${mission.status}">${getStatusName(mission.status)}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Début:</span>
                    <span>${startDate}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Fin:</span>
                    <span>${endDate}</span>
                </div>
            </div>
        </div>
        <div class="mission-card-footer">
            <button class="military-btn detail-btn" onclick="openMissionDetailModal('${mission.id}')">Détails</button>
            <div>
                <span>${mission.participants ? mission.participants.length : 0} participant(s)</span>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Retourne le nom lisible d'un type de mission
 * @param {string} type - Type de mission
 * @returns {string} Nom lisible du type
 */
function getTypeName(type) {
    const types = {
        'combat': 'Combat',
        'reconnaissance': 'Reconnaissance',
        'extraction': 'Extraction',
        'escorte': 'Escorte',
        'securisation': 'Sécurisation'
    };
    
    return types[type] || type;
}

/**
 * Retourne le nom lisible d'un statut de mission
 * @param {string} status - Statut de mission
 * @returns {string} Nom lisible du statut
 */
function getStatusName(status) {
    const statuses = {
        'planifiee': 'Planifiée',
        'en_cours': 'En cours',
        'terminee': 'Terminée',
        'annulee': 'Annulée'
    };
    
    return statuses[status] || status;
}

/**
 * Ouvre la modale de détail d'une mission
 * @param {string} missionId - Identifiant de la mission
 */
function openMissionDetailModal(missionId) {
    console.log('Ouverture de la modale de détail pour la mission:', missionId);
    
    // Trouver la mission dans les données
    const mission = missionsData.find(m => m.id === missionId);
    if (!mission) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Mettre à jour l'ID de la mission sélectionnée
    selectedMissionId = missionId;
    
    // Mettre à jour les éléments de la modale
    document.getElementById('mission-detail-title').textContent = mission.name;
    document.getElementById('mission-detail-type').textContent = getTypeName(mission.type);
    document.getElementById('mission-detail-type').className = `mission-type-badge ${mission.type}`;
    document.getElementById('mission-detail-description').textContent = mission.description;
    document.getElementById('mission-detail-start-date').textContent = formatDate(mission.startDate);
    document.getElementById('mission-detail-end-date').textContent = formatDate(mission.endDate);
    document.getElementById('mission-detail-status').textContent = getStatusName(mission.status);
    document.getElementById('mission-detail-status').className = `mission-status ${mission.status}`;
    document.getElementById('mission-detail-location').textContent = mission.location;
    
    // Afficher les objectifs
    const objectivesList = document.getElementById('mission-detail-objectives');
    objectivesList.innerHTML = '';
    if (mission.objectives && mission.objectives.length > 0) {
        mission.objectives.forEach(objective => {
            const li = document.createElement('li');
            li.textContent = objective;
            objectivesList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Aucun objectif défini';
        objectivesList.appendChild(li);
    }
    
    // Afficher les participants
    displayParticipants(mission);
    
    // Ouvrir la modale
    document.getElementById('mission-detail-modal').classList.remove('hidden-modal');
}

/**
 * Affiche les participants d'une mission
 * @param {Object} mission - Données de la mission
 */
function displayParticipants(mission) {
    const participantsList = document.getElementById('mission-participants-list');
    if (!participantsList) return;
    
    // Vider la liste
    participantsList.innerHTML = '';
    
    // Si aucun participant, afficher un message
    if (!mission.participants || mission.participants.length === 0) {
        participantsList.innerHTML = `
            <div class="participant-placeholder">
                <p>Aucun participant assigné à cette mission</p>
            </div>
        `;
        return;
    }
    
    // Ajouter chaque participant à la liste
    mission.participants.forEach(participantId => {
        // Trouver le soldat correspondant
        const soldier = allSoldiersData.find(s => s.id === participantId);
        if (!soldier) return;
        
        // Créer l'élément du participant
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        
        // Obtenir le nom de l'unité du soldat
        const unitName = getUnitNameById(soldier.unit);
        
        // Créer les initiales pour l'avatar
        const initials = (soldier.firstName.charAt(0) + soldier.lastName.charAt(0)).toUpperCase();
        
        participantItem.innerHTML = `
            <div class="participant-info">
                <div class="participant-avatar">${initials}</div>
                <div class="participant-details">
                    <div class="participant-name">${soldier.rank} ${soldier.lastName} ${soldier.firstName}</div>
                    <div class="participant-unit">${unitName}</div>
                </div>
            </div>
            <button class="remove-participant-btn" onclick="removeParticipant('${soldier.id}', '${mission.id}')">×</button>
        `;
        
        participantsList.appendChild(participantItem);
    });
}

/**
 * Retire un participant d'une mission
 * @param {string} soldierId - Identifiant du soldat
 * @param {string} missionId - Identifiant de la mission
 */
function removeParticipant(soldierId, missionId) {
    console.log('Retrait du participant:', soldierId, 'de la mission:', missionId);
    
    // Trouver la mission dans les données
    const missionIndex = missionsData.findIndex(m => m.id === missionId);
    if (missionIndex === -1) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Trouver le soldat dans les données
    const soldier = allSoldiersData.find(s => s.id === soldierId);
    if (!soldier) {
        console.error('Soldat non trouvé:', soldierId);
        return;
    }
    
    // Retirer le soldat des participants de la mission
    const mission = missionsData[missionIndex];
    if (!mission.participants) mission.participants = [];
    
    const participantIndex = mission.participants.indexOf(soldierId);
    if (participantIndex !== -1) {
        mission.participants.splice(participantIndex, 1);
    }
    
    // Mettre à jour le localStorage
    saveMissions();
    
    // Mettre à jour l'affichage des participants
    displayParticipants(mission);
    
    // Mettre à jour l'affichage des missions
    displayMissions(missionsData);
    
    // Afficher une notification
    showNotification(`${soldier.rank} ${soldier.lastName} ${soldier.firstName} a été retiré de la mission ${mission.name}`, 'success');
}

/**
 * Ouvre la modale d'édition de mission
 * @param {string} missionId - Identifiant de la mission (optionnel, pour modification)
 */
function openMissionEditModal(missionId = null) {
    console.log('Ouverture de la modale d\'\u00e9dition pour la mission:', missionId);
    
    // Réinitialiser le formulaire
    resetMissionForm();
    
    // Mettre à jour le titre de la modale
    const modalTitle = document.getElementById('mission-edit-title');
    if (modalTitle) {
        modalTitle.textContent = missionId ? 'Modifier la Mission' : 'Ajouter une Mission';
    }
    
    // Si un ID de mission est fourni, pré-remplir le formulaire
    if (missionId) {
        const mission = missionsData.find(m => m.id === missionId);
        if (mission) {
            // Mettre à jour l'ID de la mission sélectionnée
            selectedMissionId = missionId;
            
            // Remplir les champs du formulaire
            document.getElementById('mission-name').value = mission.name;
            document.getElementById('mission-type').value = mission.type;
            document.getElementById('mission-description').value = mission.description;
            document.getElementById('mission-start-date').value = mission.startDate;
            document.getElementById('mission-end-date').value = mission.endDate;
            document.getElementById('mission-location').value = mission.location;
            document.getElementById('mission-status').value = mission.status;
            
            // Remplir les objectifs
            const objectivesContainer = document.getElementById('objectives-container');
            if (objectivesContainer) {
                objectivesContainer.innerHTML = '';
                
                if (mission.objectives && mission.objectives.length > 0) {
                    mission.objectives.forEach((objective, index) => {
                        const objectiveItem = document.createElement('div');
                        objectiveItem.className = 'objective-item';
                        objectiveItem.innerHTML = `
                            <input type="text" class="military-input objective-input" placeholder="Objectif ${index + 1}" value="${objective}" required>
                            <button type="button" class="remove-objective-btn">-</button>
                        `;
                        
                        objectivesContainer.appendChild(objectiveItem);
                        
                        // Ajouter l'événement pour supprimer l'objectif
                        const removeBtn = objectiveItem.querySelector('.remove-objective-btn');
                        if (removeBtn) {
                            removeBtn.addEventListener('click', function() {
                                objectivesContainer.removeChild(objectiveItem);
                            });
                        }
                    });
                } else {
                    // Ajouter un champ d'objectif vide
                    addObjectiveField();
                }
            }
        }
    } else {
        // Réinitialiser l'ID de la mission sélectionnée
        selectedMissionId = null;
        
        // Ajouter un champ d'objectif vide
        const objectivesContainer = document.getElementById('objectives-container');
        if (objectivesContainer && objectivesContainer.children.length === 0) {
            addObjectiveField();
        }
        
        // Définir la date de début à aujourd'hui par défaut
        const today = new Date();
        document.getElementById('mission-start-date').value = formatDateForInput(today);
        
        // Définir la date de fin à une semaine plus tard par défaut
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('mission-end-date').value = formatDateForInput(nextWeek);
    }
    
    // Ouvrir la modale
    document.getElementById('mission-edit-modal').classList.remove('hidden-modal');
}

/**
 * Réinitialise le formulaire de mission
 */
function resetMissionForm() {
    const form = document.getElementById('mission-form');
    if (form) form.reset();
    
    // Vider le conteneur d'objectifs
    const objectivesContainer = document.getElementById('objectives-container');
    if (objectivesContainer) objectivesContainer.innerHTML = '';
}

/**
 * Formate une date pour un champ input de type date
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée (YYYY-MM-DD)
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Sauvegarde les données d'une mission depuis le formulaire
 * @param {Event} event - Événement de soumission du formulaire
 */
function saveMissionFromForm(event) {
    event.preventDefault();
    
    console.log('Sauvegarde de la mission depuis le formulaire');
    
    // Récupérer les valeurs du formulaire
    const name = document.getElementById('mission-name').value.trim();
    const type = document.getElementById('mission-type').value;
    const description = document.getElementById('mission-description').value.trim();
    const startDate = document.getElementById('mission-start-date').value;
    const endDate = document.getElementById('mission-end-date').value;
    const location = document.getElementById('mission-location').value.trim();
    const status = document.getElementById('mission-status').value;
    
    // Valider les données
    if (!name || !type || !startDate || !endDate || !location || !status) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Valider les dates
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('La date de début doit être antérieure à la date de fin', 'error');
        return;
    }
    
    // Récupérer les objectifs
    const objectives = [];
    const objectiveInputs = document.querySelectorAll('.objective-input');
    objectiveInputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            objectives.push(value);
        }
    });
    
    // Créer ou mettre à jour la mission
    if (selectedMissionId) {
        // Mise à jour d'une mission existante
        const missionIndex = missionsData.findIndex(m => m.id === selectedMissionId);
        if (missionIndex !== -1) {
            const existingMission = missionsData[missionIndex];
            
            // Mettre à jour les données
            existingMission.name = name;
            existingMission.type = type;
            existingMission.description = description;
            existingMission.startDate = startDate;
            existingMission.endDate = endDate;
            existingMission.location = location;
            existingMission.status = status;
            existingMission.objectives = objectives;
            
            // Conserver les participants existants
            if (!existingMission.participants) {
                existingMission.participants = [];
            }
            
            showNotification(`Mission ${name} mise à jour avec succès`, 'success');
        }
    } else {
        // Création d'une nouvelle mission
        const newMission = {
            id: generateUniqueId(),
            name,
            type,
            description,
            startDate,
            endDate,
            location,
            status,
            objectives,
            participants: []
        };
        
        missionsData.push(newMission);
        showNotification(`Mission ${name} créée avec succès`, 'success');
    }
    
    // Sauvegarder les données
    saveMissions();
    
    // Fermer la modale
    document.getElementById('mission-edit-modal').classList.add('hidden-modal');
    
    // Mettre à jour l'affichage des missions
    displayMissions(missionsData);
}

/**
 * Ouvre la modale d'assignation de soldats
 * @param {string} missionId - Identifiant de la mission
 */
function openAssignSoldiersModal(missionId) {
    console.log('Ouverture de la modale d\'assignation pour la mission:', missionId);
    
    // Trouver la mission dans les données
    const mission = missionsData.find(m => m.id === missionId);
    if (!mission) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Mettre à jour l'ID de la mission sélectionnée
    selectedMissionId = missionId;
    
    // Mettre à jour le titre de la modale
    document.getElementById('assign-soldiers-title').textContent = `Assigner des soldats à ${mission.name}`;
    
    // Charger les unités pour le filtre
    populateUnitFilter();
    
    // Charger les soldats assignables
    loadAssignableSoldiers();
    
    // Ouvrir la modale
    document.getElementById('assign-soldiers-modal').classList.remove('hidden-modal');
}

/**
 * Remplit le sélecteur d'unités dans la modale d'assignation
 */
function populateUnitFilter() {
    const unitFilter = document.getElementById('unit-filter');
    if (!unitFilter) return;
    
    // Vider le sélecteur
    unitFilter.innerHTML = '<option value="all">Toutes les unités</option>';
    
    // Récupérer les unités (escouades uniquement)
    const units = getAllUnits().filter(unit => unit.type === 'escouade');
    
    // Ajouter les unités au sélecteur
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = unit.name;
        unitFilter.appendChild(option);
    });
}

/**
 * Charge les soldats assignables dans la modale
 */
function loadAssignableSoldiers() {
    const soldiersList = document.getElementById('assignable-soldiers-list');
    if (!soldiersList) return;
    
    // Vider la liste
    soldiersList.innerHTML = '';
    
    // Récupérer la mission sélectionnée
    const mission = missionsData.find(m => m.id === selectedMissionId);
    if (!mission) return;
    
    // Récupérer le filtre d'unité sélectionné
    const unitFilter = document.getElementById('unit-filter').value;
    
    // Récupérer le terme de recherche
    const searchTerm = document.getElementById('soldier-search').value.toLowerCase();
    
    // Filtrer les soldats
    const filteredSoldiers = filterAssignableSoldiers(unitFilter, searchTerm, mission.participants || []);
    
    // Afficher les soldats filtrés
    if (filteredSoldiers.length === 0) {
        soldiersList.innerHTML = '<div class="no-results">Aucun soldat disponible</div>';
    } else {
        filteredSoldiers.forEach(soldier => {
            const soldierItem = createSoldierItemForAssignment(soldier, mission);
            soldiersList.appendChild(soldierItem);
        });
    }
}

/**
 * Filtre les soldats assignables selon les critères
 * @param {string} unitFilter - ID de l'unité sélectionnée ou 'all'
 * @param {string} searchTerm - Terme de recherche
 * @param {Array} currentParticipants - Liste des IDs des participants actuels
 * @returns {Array} Liste des soldats filtrés
 */
function filterAssignableSoldiers(unitFilter, searchTerm, currentParticipants) {
    // Filtrer les soldats selon les critères
    return allSoldiersData.filter(soldier => {
        // Exclure les soldats déjà assignés
        if (currentParticipants.includes(soldier.id)) {
            return false;
        }
        
        // Filtrer par unité
        if (unitFilter !== 'all' && soldier.unit !== unitFilter) {
            return false;
        }
        
        // Filtrer par terme de recherche
        if (searchTerm) {
            const fullName = `${soldier.rank} ${soldier.lastName} ${soldier.firstName}`.toLowerCase();
            return fullName.includes(searchTerm);
        }
        
        return true;
    });
}

/**
 * Crée un élément de soldat pour l'assignation
 * @param {Object} soldier - Données du soldat
 * @param {Object} mission - Données de la mission
 * @returns {HTMLElement} Élément du soldat
 */
function createSoldierItemForAssignment(soldier, mission) {
    const soldierItem = document.createElement('div');
    soldierItem.className = 'soldier-item';
    
    // Obtenir le nom de l'unité du soldat
    const unitName = getUnitNameById(soldier.unit);
    
    // Créer les initiales pour l'avatar
    const initials = (soldier.firstName.charAt(0) + soldier.lastName.charAt(0)).toUpperCase();
    
    soldierItem.innerHTML = `
        <div class="soldier-info">
            <div class="soldier-avatar">${initials}</div>
            <div class="soldier-details">
                <div class="soldier-name">${soldier.rank} ${soldier.lastName} ${soldier.firstName}</div>
                <div class="soldier-unit">${unitName}</div>
            </div>
        </div>
        <button class="assign-soldier-btn" data-soldier-id="${soldier.id}">Assigner</button>
    `;
    
    // Ajouter l'événement pour assigner le soldat
    const assignBtn = soldierItem.querySelector('.assign-soldier-btn');
    if (assignBtn) {
        assignBtn.addEventListener('click', function() {
            assignSoldierToMission(soldier.id, mission.id);
        });
    }
    
    return soldierItem;
}

/**
 * Assigne un soldat à une mission
 * @param {string} soldierId - Identifiant du soldat
 * @param {string} missionId - Identifiant de la mission
 */
function assignSoldierToMission(soldierId, missionId) {
    console.log('Assignation du soldat:', soldierId, 'à la mission:', missionId);
    
    // Trouver la mission dans les données
    const missionIndex = missionsData.findIndex(m => m.id === missionId);
    if (missionIndex === -1) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Trouver le soldat dans les données
    const soldier = allSoldiersData.find(s => s.id === soldierId);
    if (!soldier) {
        console.error('Soldat non trouvé:', soldierId);
        return;
    }
    
    // Ajouter le soldat aux participants de la mission
    const mission = missionsData[missionIndex];
    if (!mission.participants) mission.participants = [];
    
    // Vérifier si le soldat est déjà assigné
    if (mission.participants.includes(soldierId)) {
        showNotification(`${soldier.rank} ${soldier.lastName} ${soldier.firstName} est déjà assigné à cette mission`, 'warning');
        return;
    }
    
    // Ajouter le soldat aux participants
    mission.participants.push(soldierId);
    
    // Mettre à jour le localStorage
    saveMissions();
    
    // Mettre à jour l'affichage des soldats assignables
    loadAssignableSoldiers();
    
    // Afficher une notification
    showNotification(`${soldier.rank} ${soldier.lastName} ${soldier.firstName} a été assigné à la mission ${mission.name}`, 'success');
}

/**
 * Ouvre la modale de changement de statut d'une mission
 * @param {string} missionId - Identifiant de la mission
 */
function openChangeStatusModal(missionId) {
    console.log('Ouverture de la modale de changement de statut pour la mission:', missionId);
    
    // Trouver la mission dans les données
    const mission = missionsData.find(m => m.id === missionId);
    if (!mission) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Mettre à jour l'ID de la mission sélectionnée
    selectedMissionId = missionId;
    
    // Mettre à jour le titre de la modale
    document.getElementById('change-status-title').textContent = `Changer le statut de ${mission.name}`;
    
    // Sélectionner le statut actuel
    document.getElementById('mission-status-select').value = mission.status;
    
    // Ouvrir la modale
    document.getElementById('change-status-modal').classList.remove('hidden-modal');
}

/**
 * Change le statut d'une mission
 */
function changeMissionStatus() {
    console.log('Changement du statut de la mission:', selectedMissionId);
    
    // Vérifier si une mission est sélectionnée
    if (!selectedMissionId) {
        console.error('Aucune mission sélectionnée');
        return;
    }
    
    // Trouver la mission dans les données
    const missionIndex = missionsData.findIndex(m => m.id === selectedMissionId);
    if (missionIndex === -1) {
        console.error('Mission non trouvée:', selectedMissionId);
        return;
    }
    
    // Récupérer le nouveau statut
    const newStatus = document.getElementById('mission-status-select').value;
    
    // Mettre à jour le statut de la mission
    const mission = missionsData[missionIndex];
    const oldStatus = mission.status;
    mission.status = newStatus;
    
    // Mettre à jour le localStorage
    saveMissions();
    
    // Fermer la modale
    document.getElementById('change-status-modal').classList.add('hidden-modal');
    
    // Mettre à jour l'affichage des missions
    displayMissions(missionsData);
    
    // Fermer la modale de détail si elle est ouverte
    document.getElementById('mission-detail-modal').classList.add('hidden-modal');
    
    // Afficher une notification
    showNotification(`Le statut de la mission ${mission.name} a été changé de ${getStatusName(oldStatus)} à ${getStatusName(newStatus)}`, 'success');
}

/**
 * Confirme la suppression d'une mission
 * @param {string} missionId - Identifiant de la mission
 */
function confirmDeleteMission(missionId) {
    console.log('Confirmation de suppression pour la mission:', missionId);
    
    // Trouver la mission dans les données
    const mission = missionsData.find(m => m.id === missionId);
    if (!mission) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Demander confirmation
    if (confirm(`Êtes-vous sûr de vouloir supprimer la mission ${mission.name} ? Cette action est irréversible.`)) {
        deleteMission(missionId);
    }
}

/**
 * Supprime une mission
 * @param {string} missionId - Identifiant de la mission
 */
function deleteMission(missionId) {
    console.log('Suppression de la mission:', missionId);
    
    // Trouver la mission dans les données
    const missionIndex = missionsData.findIndex(m => m.id === missionId);
    if (missionIndex === -1) {
        console.error('Mission non trouvée:', missionId);
        return;
    }
    
    // Récupérer le nom de la mission avant suppression
    const missionName = missionsData[missionIndex].name;
    
    // Supprimer la mission
    missionsData.splice(missionIndex, 1);
    
    // Mettre à jour le localStorage
    saveMissions();
    
    // Fermer la modale de détail si elle est ouverte
    document.getElementById('mission-detail-modal').classList.add('hidden-modal');
    
    // Mettre à jour l'affichage des missions
    displayMissions(missionsData);
    
    // Afficher une notification
    showNotification(`La mission ${missionName} a été supprimée`, 'success');
}

// Initialisation du gestionnaire de missions au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du gestionnaire de missions');
    
    // Charger les données des missions
    loadMissions();
    
    // Charger les données des soldats
    loadSoldiers();
    
    // Configurer les événements
    setupMissionEvents();
    
    // Configurer les modales
    setupMissionModals();
    
    // Afficher les missions
    displayMissions(missionsData);
});
