/**
 * Gestionnaire des formations pour Eagle Operator
 * Ce module gère l'affichage, l'ajout, la modification et l'assignation des soldats aux formations
 */

// Variables globales
let formationsData = [];
let allSoldiersData = [];
let selectedFormationId = null;
let selectedSoldiers = [];
let currentView = 'list';

// Initialisation du gestionnaire de formations
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du gestionnaire de formations');
    
    // Charger les soldats d'abord pour s'assurer que allSoldiersData est initialisé
    loadSoldiers();
    
    // Charger les formations
    loadFormations();
    
    // Configurer les événements
    setupFormationEvents();
    setupFormationModals();
    setupFormationFilters();
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
        const timestamp = Date.now().toString().substring(6); // Prendre les 7 derniers chiffres
        
        // Assembler l'ID
        return `${prefix}_${suffix}_${timestamp}`;
    } catch (error) {
        console.error('Erreur lors de la génération de l\'ID d\'unité:', error);
        return `unit_${Date.now()}`; // ID de secours en cas d'erreur
    }
}

/**
 * Récupère toutes les unités depuis le localStorage et s'assure qu'elles ont toutes un ID unique
 * @returns {Array} Liste des unités avec IDs uniques
 */
function getAllUnits() {
    try {
        // Vérifier si la clé existe dans le localStorage
        const unitsData = localStorage.getItem('eagleOperator_units');
        
        if (!unitsData) {
            console.warn('Aucune donnée d\'unité trouvée dans localStorage');
            return [];
        }
        
        // Parser les données
        const units = JSON.parse(unitsData);
        console.log(`${units.length} unités récupérées depuis localStorage`);
        
        // Vérifier que les unités ont les propriétés nécessaires et ajouter des IDs uniques si nécessaire
        let hasChanges = false;
        
        units.forEach((unit, index) => {
            // Standardiser les propriétés nom/name
            if (!unit.name && unit.nom) {
                unit.name = unit.nom;
                hasChanges = true;
            } else if (!unit.nom && unit.name) {
                unit.nom = unit.name;
                hasChanges = true;
            }
            
            // S'assurer que l'unité a un type
            if (!unit.type) {
                unit.type = 'escouade'; // Type par défaut
                hasChanges = true;
            }
            
            // Ajouter un ID unique si nécessaire ou si l'ID ne suit pas le format attendu
            if (!unit.id || !unit.id.includes('_')) {
                const oldId = unit.id || `unit_${index + 1}`;
                unit.id = generateUnitId(unit);
                console.log(`Nouvel ID généré pour l'unité ${unit.name}: ${oldId} -> ${unit.id}`);
                hasChanges = true;
            }
        });
        
        // Sauvegarder les unités si des modifications ont été apportées
        if (hasChanges) {
            localStorage.setItem('eagleOperator_units', JSON.stringify(units));
            console.log('Unités mises à jour dans localStorage avec des IDs uniques');
        }
        
        return units;
    } catch (error) {
        console.error('Erreur lors de la récupération des unités:', error);
        return [];
    }
}

/**
 * Récupère le nom d'une unité à partir de son ID
 * @param {string} unitId - ID de l'unité
 * @returns {string} Nom de l'unité ou valeur par défaut si non trouvée
 */
function getUnitNameById(unitId) {
    try {
        // Si pas d'ID d'unité, retourner 'Sans unité'
        if (!unitId) {
            return 'Sans unité';
        }
        
        // Récupérer toutes les unités
        const units = getAllUnits();
        
        // Chercher l'unité correspondante
        const unit = units.find(u => u && u.id === unitId);
        
        // Si unité trouvée, retourner son nom
        if (unit) {
            return unit.name || unit.nom || 'Unité sans nom';
        }
        
        // Si unité non trouvée, retourner une valeur par défaut
        return 'Unité inconnue';
    } catch (error) {
        console.error('Erreur lors de la récupération du nom de l\'unité:', error);
        return 'Erreur unité';
    }
}

/**
 * Charge les données des soldats depuis le localStorage
 */
function loadSoldiers() {
    console.log('Chargement des données des soldats');
    try {
        // Utiliser la clé harmonisée eagleOperator_soldiers comme indiqué dans les mémoires
        const rawData = localStorage.getItem('eagleOperator_soldiers');
        console.log('Données brutes des soldats:', rawData ? 'Données trouvées' : 'Aucune donnée');
        
        allSoldiersData = JSON.parse(rawData || '[]');
        
        if (!Array.isArray(allSoldiersData)) {
            console.error('Les données des soldats ne sont pas un tableau valide');
            allSoldiersData = [];
        }
        
        // Vérifier et corriger les données des soldats
        allSoldiersData = validateAndFixSoldierData(allSoldiersData);
        console.log('Nombre de soldats chargés après validation:', allSoldiersData.length);
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
    if (!Array.isArray(soldiers)) return [];
    
    console.log('Validation et correction des données de', soldiers.length, 'soldats');
    
    return soldiers.map(soldier => {
        if (!soldier) return null;
        
        // Créer une copie pour ne pas modifier l'original
        const fixedSoldier = { ...soldier };
        
        // S'assurer que les propriétés essentielles existent
        fixedSoldier.id = fixedSoldier.id || generateUniqueId();
        fixedSoldier.matricule = fixedSoldier.matricule || fixedSoldier.id.substring(0, 6).toUpperCase();
        fixedSoldier.pseudo = fixedSoldier.pseudo || 
                            fixedSoldier.lastName || 
                            fixedSoldier.nom || 
                            'Sans nom';
        fixedSoldier.grade = fixedSoldier.grade || 
                           fixedSoldier.rank || 
                           'Soldat';
        fixedSoldier.status = fixedSoldier.status || 
                            fixedSoldier.statut || 
                            'Actif';
        
        // Harmoniser les propriétés pour la compatibilité avec le code existant
        // Ces propriétés seront progressivement remplacées par pseudo/matricule
        fixedSoldier.lastName = fixedSoldier.pseudo;
        fixedSoldier.nom = fixedSoldier.pseudo;
        fixedSoldier.rank = fixedSoldier.grade;
        
        // Vérifier l'unité du soldat
        if (!fixedSoldier.unit) {
            const units = getAllUnits();
            
            // Chercher si le soldat est membre d'une unité
            for (const unit of units) {
                if (Array.isArray(unit.members) && unit.members.includes(fixedSoldier.id)) {
                    fixedSoldier.unit = unit.id;
                    console.log(`Unité trouvée pour le soldat ${fixedSoldier.pseudo}: ${unit.name}`);
                    break;
                }
                
                // Vérifier si le soldat est commandant
                if (unit.commander === fixedSoldier.id) {
                    fixedSoldier.unit = unit.id;
                    fixedSoldier.isCommander = true;
                    console.log(`Soldat ${fixedSoldier.pseudo} identifié comme commandant de l'unité: ${unit.name}`);
                    break;
                }
            }
        }
        
        // Harmoniser les propriétés d'unité
        if (fixedSoldier.unit) {
            fixedSoldier.unité = fixedSoldier.unit;
            fixedSoldier.unite = fixedSoldier.unit;
        } else if (fixedSoldier.unité) {
            fixedSoldier.unit = fixedSoldier.unité;
            fixedSoldier.unite = fixedSoldier.unité;
        } else if (fixedSoldier.unite) {
            fixedSoldier.unit = fixedSoldier.unite;
            fixedSoldier.unité = fixedSoldier.unite;
        }
        
        return fixedSoldier;
    }).filter(soldier => soldier !== null); // Supprimer les soldats null
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
        console.log('Bouton assigner des soldats trouvé');
        btnAssignSoldiers.addEventListener('click', () => {
            console.log('Bouton assigner des soldats cliqué');
            if (selectedFormationId) {
                console.log('Formation sélectionnée ID:', selectedFormationId);
                modal.classList.add('hidden-modal');
                openAssignSoldiersModal(selectedFormationId);
            } else {
                console.error('Aucune formation sélectionnée');
            }
        });
    } else {
        console.error('Bouton assigner des soldats non trouvé');
    }
    
    // Supprimer la formation
    const btnDeleteFormation = document.getElementById('btn-delete-formation');
    if (btnDeleteFormation) {
        console.log('Bouton supprimer formation trouvé');
        btnDeleteFormation.addEventListener('click', () => {
            console.log('Bouton supprimer formation cliqué');
            if (selectedFormationId) {
                console.log('Formation à supprimer ID:', selectedFormationId);
                
                // Récupérer le nom de la formation pour l'afficher dans la confirmation
                const formation = formationsData.find(f => f.id === selectedFormationId);
                if (!formation) {
                    console.error('Formation non trouvée pour la suppression');
                    return;
                }
                
                // Utiliser la boîte de dialogue personnalisée
                showConfirmationDialog(
                    'Confirmation de suppression',
                    `Êtes-vous sûr de vouloir supprimer la formation "${formation.name}" ? Cette action est irréversible.`,
                    () => {
                        // Action à effectuer si confirmé
                        deleteFormation(selectedFormationId);
                        modal.classList.add('hidden-modal');
                    }
                );
            } else {
                console.error('Aucune formation sélectionnée pour la suppression');
            }
        });
    } else {
        console.error('Bouton supprimer formation non trouvé');
    }
}

/**
 * Configure la modale d'assignation de soldats
 */
function setupAssignSoldiersModal() {
    const modal = document.getElementById('assign-soldiers-modal');
    const closeBtn = document.getElementById('close-assign-soldiers-btn');
    const cancelBtn = document.getElementById('cancel-assign');
    const confirmBtn = document.getElementById('confirm-assign');
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
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Configuration des onglets de la modale d\'assignation');
    console.log('Nombre d\'onglets trouvés:', tabs.length);
    console.log('Nombre de contenus d\'onglets trouvés:', tabContents.length);
    
    // Vérifier si des onglets ont été trouvés avant d'ajouter des écouteurs
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                try {
                    const tabName = this.getAttribute('data-tab');
                    console.log(`Clic sur l'onglet ${tabName}`);
                    
                    // Retirer la classe active de tous les onglets
                    tabs.forEach(t => {
                        if (t && t.classList) {
                            t.classList.remove('active');
                            console.log(`Classe active retirée de l'onglet ${t.getAttribute('data-tab')}`);
                        }
                    });
                    
                    // Ajouter la classe active à l'onglet cliqué
                    if (this && this.classList) {
                        this.classList.add('active');
                        console.log(`Classe active ajoutée à l'onglet ${tabName}`);
                    }
                    
                    // Masquer tous les contenus d'onglets
                    const allTabContents = document.querySelectorAll('.tab-content');
                    if (allTabContents && allTabContents.length > 0) {
                        allTabContents.forEach(content => {
                            if (content && content.classList) {
                                content.classList.add('hidden');
                                console.log(`Contenu ${content.id} masqué`);
                            }
                        });
                    }
                    
                    // Afficher le contenu correspondant
                    const tabContentId = `${tabName}-tab-content`;
                    const tabContent = document.getElementById(tabContentId);
                    
                    if (tabContent && tabContent.classList) {
                        tabContent.classList.remove('hidden');
                        console.log(`Contenu de l'onglet ${tabName} (${tabContentId}) affiché`);
                    } else {
                        console.warn(`Contenu de l'onglet ${tabName} (${tabContentId}) introuvable dans le DOM`);
                    }
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
                    } else {
                        console.log(`Onglet ${tabName} sélectionné`);
                    }
                } catch (error) {
                    console.error('Erreur lors du changement d\'onglet:', error);
                }
            });
        });
    }
    
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
    
    // Cette section est redondante avec la gestion des onglets ci-dessus
    // et peut être supprimée car elle cause des conflits
    /*
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Code de gestion des onglets supprimé car déjà géré plus haut
        });
    });
    */
}

/**
 * Configure les filtres de formations
 */
function setupFormationFilters() {
    console.log('Configuration des filtres de formations');
    
    // Configurer le filtre de recherche
    const searchInput = document.getElementById('formation-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterFormations();
        });
    }
    
    // Configurer le filtre de type
    const typeSelect = document.getElementById('formation-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            filterFormations();
        });
    }
    
    // Configurer le filtre de statut
    const statusSelect = document.getElementById('formation-status');
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            filterFormations();
        });
    }
    
    // Remplir le sélecteur d'unités pour le filtre d'assignation
    const unitFilterSelect = document.getElementById('unit-filter');
    if (unitFilterSelect) {
        // Remplir le sélecteur avec les unités
        populateUnitFilter(unitFilterSelect);
        
        // Configurer le filtre d'unités pour l'assignation de soldats
        console.log('Configuration du filtre d\'unités pour l\'assignation');
        unitFilterSelect.addEventListener('change', function() {
            filterAssignableSoldiers();
        });
    } else {
        console.warn("L'élément select 'unit-filter' n'a pas été trouvé");
    }
    
    // Configurer le filtre de statut pour l'assignation de soldats
    const soldierStatusSelect = document.getElementById('status-filter');
    if (soldierStatusSelect) {
        console.log('Configuration du filtre de statut pour l\'assignation');
        soldierStatusSelect.addEventListener('change', function() {
            filterAssignableSoldiers();
        });
    }
}

/**
 * Remplit le sélecteur d'unités avec les noms des escouades uniquement
 */
function populateUnitFilter() {
    console.log('Remplissage du sélecteur d\'unités (escouades uniquement)');
    const unitFilterSelect = document.getElementById('unit-filter');
    
    if (!unitFilterSelect) {
        console.error('Sélecteur d\'unités non trouvé dans le DOM');
        return;
    }
    
    try {
        // Vider le sélecteur sauf l'option "Toutes les unités"
        while (unitFilterSelect.options.length > 1) {
            unitFilterSelect.remove(1);
        }
        
        // S'assurer que l'option "Toutes les unités" existe et est sélectionnée par défaut
        if (unitFilterSelect.options.length === 0) {
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'Toutes les unités';
            unitFilterSelect.appendChild(allOption);
        }
        
        // Récupérer toutes les unités
        const units = getAllUnits();
        console.log('Unités récupérées pour le sélecteur:', units.length);
        
        // Filtrer pour ne garder que les escouades
        const squads = units.filter(unit => unit && unit.type && unit.type.toLowerCase() === 'escouade');
        console.log('Escouades filtrées pour le sélecteur:', squads.length);
        
        // Trier les escouades par nom
        const sortedSquads = [...squads].sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });
        
        // Ajouter chaque escouade au sélecteur
        sortedSquads.forEach(squad => {
            if (!squad || !squad.id) return;
            
            const option = document.createElement('option');
            option.value = squad.id;
            option.textContent = squad.name || 'Escouade sans nom';
            
            unitFilterSelect.appendChild(option);
            console.log(`Option d'escouade ajoutée: ${option.textContent} avec ID: ${squad.id}`);
        });
        
        // Si aucune escouade n'a été ajoutée, ajouter un message
        if (sortedSquads.length === 0) {
            const noSquadOption = document.createElement('option');
            noSquadOption.value = 'none';
            noSquadOption.textContent = 'Aucune escouade disponible';
            noSquadOption.disabled = true;
            unitFilterSelect.appendChild(noSquadOption);
        }
    } catch (error) {
        console.error('Erreur lors du remplissage du sélecteur d\'unités:', error);
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
    
    // Récupérer les données les plus récentes des soldats depuis localStorage
    let soldiers = [];
    try {
        soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        console.log(`Récupération de ${soldiers.length} soldats depuis localStorage pour affichage des participants`);
    } catch (error) {
        console.error('Erreur lors de la récupération des données des soldats:', error);
        soldiers = allSoldiersData; // Utiliser les données en mémoire en cas d'erreur
    }
    
    // Mettre à jour allSoldiersData avec les données les plus récentes
    allSoldiersData = soldiers;
    
    // Afficher chaque participant
    formation.participants.forEach(participantId => {
        // Recherche du soldat par ID
        const soldier = soldiers.find(s => s.id === participantId);
        
        if (soldier) {
            console.log('Données du soldat participant:', soldier);
            const participantItem = document.createElement('div');
            participantItem.className = 'participant-item';
            
            // Vérification complète des propriétés du soldat
            console.log('Propriétés du soldat:', Object.keys(soldier));
            
            // S'assurer que les propriétés existent pour éviter les erreurs (gérer les différentes variantes)
            const matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
            const pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
            const grade = soldier.grade || soldier.rank || '';
            
            // Récupérer le nom de l'unité à partir de l'ID en utilisant la fonction centralisée
            // Gérer les différentes variantes de la propriété unit
            const unitId = soldier.unit || soldier.unité || soldier.unite;
            console.log('ID de l\'unité du soldat:', unitId, 'Type:', typeof unitId);
            
            // Vérifier si l'ID de l'unité est valide
            if (unitId) {
                console.log('ID de l\'unité valide:', unitId);
            } else {
                console.log('ID de l\'unité invalide ou manquant');
            }
            
            // Récupérer le nom de l'unité
            const unitName = getUnitNameById(unitId);
            console.log(`Participant ${pseudo} (${matricule}): unité=${unitId}, nom unité=${unitName}`);
            
            // Construire le nom complet avec vérification pour un affichage plus robuste
            let fullName = '';
            if (grade) fullName += grade + ' ';
            fullName += pseudo || 'Sans nom';
            
            // Compatibilité avec le code existant
            const firstName = soldier.firstName || soldier.prenom || '';
            const lastName = pseudo;
            const rank = grade;
            
            // Créer l'élément HTML du participant
            participantItem.innerHTML = `
                <div class="participant-info">
                    <div class="participant-avatar">${pseudo.charAt(0) || '?'}</div>
                    <div>
                        <div class="participant-name">${fullName}</div>
                        <div class="participant-details">
                            <span class="participant-matricule">${matricule}</span> - 
                            <span class="participant-unit">${unitName || 'Sans unité'}</span>
                        </div>
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
        } else {
            console.warn(`Soldat ${participantId} non trouvé dans les données pour l'affichage des participants`);
        }
    });
}

/**
 * Retire un participant d'une formation
 * @param {string} soldierId - Identifiant du soldat
 * @param {string} formationId - Identifiant de la formation
 */
function removeParticipant(soldierId, formationId) {
    console.log(`[removeParticipant] Tentative de retrait du soldat ${soldierId} de la formation ${formationId}`);
    
    const formationIndex = formationsData.findIndex(f => f.id === formationId);
    
    if (formationIndex === -1) {
        console.error(`[removeParticipant] Formation avec ID ${formationId} non trouvée`);
        return;
    }
    
    // Standardiser le nom de la formation
    const formationName = formationsData[formationIndex].name || formationsData[formationIndex].nom || 'Formation inconnue';
    formationsData[formationIndex].name = formationName;
    formationsData[formationIndex].nom = formationName;
    
    console.log(`[removeParticipant] Formation trouvée: ${formationName} (index: ${formationIndex})`);
    
    // Retirer le participant
    const participantIndex = formationsData[formationIndex].participants.indexOf(soldierId);
    
    if (participantIndex !== -1) {
        formationsData[formationIndex].participants.splice(participantIndex, 1);
        console.log(`[removeParticipant] Soldat ${soldierId} retiré de la liste des participants`);
        
        // Mettre à jour l'historique du soldat
        updateSoldierHistory(soldierId, `Retiré de la formation "${formationName}"`);
        
        // Mettre à jour les données du soldat
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
        
        if (soldierIndex !== -1) {
            const soldier = soldiers[soldierIndex];
            
            // Standardiser les propriétés du soldat
            soldier.matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
            soldier.pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
            soldier.grade = soldier.grade || soldier.rank || 'Soldat';
            
            // Harmoniser les propriétés pour la compatibilité avec le code existant
            soldier.lastName = soldier.pseudo;
            soldier.nom = soldier.pseudo;
            soldier.rank = soldier.grade;
            
            console.log(`[removeParticipant] Soldat trouvé: ${soldier.pseudo} (${soldier.matricule})`);
            
            // Vérifier si le soldat a des formations
            if (soldier.formations && Array.isArray(soldier.formations)) {
                // Trouver et supprimer la formation des données du soldat
                const soldierFormationIndex = soldier.formations.findIndex(f => f.formationId === formationId);
                
                if (soldierFormationIndex !== -1) {
                    // Supprimer la formation
                    soldier.formations.splice(soldierFormationIndex, 1);
                    console.log(`[removeParticipant] Formation ${formationName} (ID: ${formationId}) retirée des données du soldat ${soldier.pseudo} (${soldier.matricule})`);
                    
                    // Mettre à jour le soldat dans le tableau
                    soldiers[soldierIndex] = soldier;
                    
                    // Mettre à jour allSoldiersData si elle est déjà chargée
                    if (allSoldiersData.length > 0) {
                        const globalSoldierIndex = allSoldiersData.findIndex(s => s.id === soldierId);
                        if (globalSoldierIndex !== -1) {
                            allSoldiersData[globalSoldierIndex] = soldier;
                            console.log('[removeParticipant] Données globales des soldats mises à jour');
                        }
                    }
                    
                    // Sauvegarder les modifications des soldats
                    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
                    console.log('[removeParticipant] Données des soldats sauvegardées dans le localStorage');
                } else {
                    console.warn(`[removeParticipant] Formation ${formationId} non trouvée dans les données du soldat ${soldier.pseudo}`);
                }
            } else {
                console.warn(`[removeParticipant] Le soldat ${soldier.pseudo} n'a pas de formations enregistrées`);
            }
        } else {
            console.error(`[removeParticipant] Soldat avec ID ${soldierId} non trouvé dans les données`);
        }
        
        // Sauvegarder les modifications des formations
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
    console.log('Ouverture de la modale d\'assignation pour la formation:', formationId);
    selectedFormationId = formationId;
    selectedSoldiers = [];
    
    // Afficher la modale
    const modal = document.getElementById('assign-soldiers-modal');
    if (modal) {
        console.log('Modale d\'assignation trouvée, ouverture...');
        // Assurer que la modale est centrée
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.classList.remove('hidden-modal');
        console.log('Modale d\'assignation ouverte');
        
        try {
            // Initialiser les onglets - s'assurer que l'onglet Soldats est actif par défaut
            const soldiersTab = document.querySelector('.tab[data-tab="soldiers"]');
            const tabs = document.querySelectorAll('.tab');
            
            if (tabs && tabs.length > 0) {
                tabs.forEach(tab => {
                    if (tab && tab.classList) {
                        tab.classList.remove('active');
                    }
                });
            }
            
            if (soldiersTab && soldiersTab.classList) {
                soldiersTab.classList.add('active');
            }
            
            // Masquer tous les contenus d'onglets
            const tabContents = document.querySelectorAll('.tab-content');
            if (tabContents && tabContents.length > 0) {
                tabContents.forEach(content => {
                    if (content && content.classList) {
                        content.classList.add('hidden');
                    }
                });
            }
            
            // Afficher le contenu de l'onglet Soldats
            const soldiersContent = document.getElementById('soldiers-tab-content');
            if (soldiersContent && soldiersContent.classList) {
                soldiersContent.classList.remove('hidden');
            }
            
            // Vider les listes
            const soldiersList = document.getElementById('assignable-soldiers-list');
            if (soldiersList) {
                soldiersList.innerHTML = '';
            }
            
            const unitsList = document.getElementById('assignable-units-list');
            if (unitsList) {
                unitsList.innerHTML = '';
            }
            
            const unitSoldiersList = document.getElementById('unit-soldiers-list');
            if (unitSoldiersList) {
                unitSoldiersList.innerHTML = '';
            }
            
            // Récupérer les éléments de filtre
            const searchInput = document.getElementById('soldier-search');
            const unitFilterSelect = document.getElementById('unit-filter');
            
            // Réinitialiser les filtres
            if (searchInput) {
                searchInput.value = '';
            }
            
            if (unitFilterSelect) {
                // Remplir le sélecteur d'unités
                try {
                    populateUnitFilter(unitFilterSelect);
                    unitFilterSelect.value = 'all';
                } catch (error) {
                    console.error('Erreur lors du remplissage du sélecteur d\'unités:', error);
                }
            }
            
            // Filtrer les soldats assignables
            filterAssignableSoldiers();
            
            // Ajouter les écouteurs d'événements pour les filtres
            if (searchInput) {
                // Supprimer les écouteurs existants pour éviter les doublons
                searchInput.removeEventListener('input', filterAssignableSoldiers);
                // Ajouter le nouvel écouteur
                searchInput.addEventListener('input', filterAssignableSoldiers);
                console.log('Écouteur ajouté sur le champ de recherche');
            }
            
            if (unitFilterSelect) {
                // Supprimer les écouteurs existants pour éviter les doublons
                unitFilterSelect.removeEventListener('change', filterAssignableSoldiers);
                // Ajouter le nouvel écouteur
                unitFilterSelect.addEventListener('change', filterAssignableSoldiers);
                console.log('Écouteur ajouté sur le sélecteur d\'unités');
            }
            
            // Ajouter les écouteurs d'événements pour les boutons
            const cancelBtn = document.getElementById('cancel-assign');
            const confirmBtn = document.getElementById('confirm-assign');
            
            if (cancelBtn) {
                cancelBtn.removeEventListener('click', closeAssignSoldiersModal);
                cancelBtn.addEventListener('click', closeAssignSoldiersModal);
                console.log('Écouteur ajouté sur le bouton Annuler');
            }
            
            if (confirmBtn) {
                confirmBtn.removeEventListener('click', confirmAssignSoldiers);
                confirmBtn.addEventListener('click', confirmAssignSoldiers);
                // Désactiver le bouton par défaut
                confirmBtn.disabled = true;
                console.log('Écouteur ajouté sur le bouton Confirmer');
            }
        } catch (error) {
            console.error('Erreur lors de la configuration de la modale d\'assignation:', error);
        }
    } else {
        console.error('Modale d\'assignation non trouvée dans le DOM');
    }
}

/**
 * Met à jour l'état du bouton de confirmation en fonction du nombre de soldats sélectionnés
 */
function updateAssignButtonState() {
    try {
        const confirmBtn = document.getElementById('confirm-assign');
        const countElement = document.getElementById('filtered-soldiers-count');
        
        if (confirmBtn) {
            // Activer le bouton uniquement si des soldats sont sélectionnés
            confirmBtn.disabled = selectedSoldiers.length === 0;
        }
        
        // Mettre à jour le compteur de soldats sélectionnés
        if (countElement) {
            const totalSoldiers = document.querySelectorAll('#assignable-soldiers-list .soldier-item').length || 0;
            countElement.textContent = `${totalSoldiers} soldat(s) trouvé(s), ${selectedSoldiers.length} sélectionné(s)`;
        }
        
        console.log(`État du bouton de confirmation mis à jour: ${selectedSoldiers.length} soldat(s) sélectionné(s)`);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'état du bouton d\'assignation:', error);
    }
}

/**
 * Ferme la modale d'assignation de soldats
 */
function closeAssignSoldiersModal() {
    try {
        console.log('Fermeture de la modale d\'assignation');
        
        // Vider la liste des soldats sélectionnés
        selectedSoldiers = [];
        
        // Masquer la modale
        const modal = document.getElementById('assign-soldiers-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden-modal');
            
            // Réinitialiser les filtres
            const searchInput = document.getElementById('soldier-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            const unitFilterSelect = document.getElementById('unit-filter');
            if (unitFilterSelect) {
                unitFilterSelect.value = 'all';
            }
            
            // Vider les listes
            const soldiersList = document.getElementById('assignable-soldiers-list');
            if (soldiersList) {
                soldiersList.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Erreur lors de la fermeture de la modale d\'assignation:', error);
    }
}

/**
 * Confirme l'assignation des soldats sélectionnés à la formation
 */
function confirmAssignSoldiers() {
    console.log('Confirmation de l\'assignation des soldats');
    
    if (selectedSoldiers.length === 0) {
        console.warn('Aucun soldat sélectionné pour l\'assignation');
        return;
    }
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    
    if (!formation) {
        console.error('Formation non trouvée avec ID:', selectedFormationId);
        return;
    }
    
    console.log(`Assignation de ${selectedSoldiers.length} soldat(s) à la formation ${formation.name}`);
    
    // Initialiser le tableau des participants si nécessaire
    if (!formation.participants) {
        formation.participants = [];
    }
    
    // Ajouter les soldats sélectionnés aux participants
    selectedSoldiers.forEach(soldierId => {
        if (!formation.participants.includes(soldierId)) {
            formation.participants.push(soldierId);
            console.log(`Soldat ${soldierId} assigné à la formation ${formation.name}`);
        }
    });
    
    // Mettre à jour les formations dans le localStorage
    localStorage.setItem('eagleOperator_formations', JSON.stringify(formationsData));
    
    // Mettre à jour les soldats pour ajouter la formation à leur historique
    const allSoldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    
    selectedSoldiers.forEach(soldierId => {
        const soldier = allSoldiers.find(s => s.id === soldierId);
        
        if (soldier) {
            // Initialiser le tableau des formations si nécessaire
            if (!soldier.formations) {
                soldier.formations = [];
            }
            
            // Vérifier si la formation est déjà dans l'historique du soldat
            const existingFormation = soldier.formations.find(f => f.id === formation.id);
            
            if (!existingFormation) {
                // Ajouter la formation à l'historique du soldat
                soldier.formations.push({
                    id: formation.id,
                    name: formation.name,
                    type: formation.type,
                    date: formation.date,
                    status: 'assigned' // statut initial: assigné
                });
                
                console.log(`Formation ${formation.name} ajoutée à l'historique du soldat ${soldier.nom || soldier.lastName}`);
            }
        }
    });
    
    // Sauvegarder les soldats mis à jour
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(allSoldiers));
    
    // Fermer la modale
    closeAssignSoldiersModal();
    
    // Rafraîchir l'affichage des formations
    displayFormations(formationsData);
    
    // Afficher un message de succès
    showNotification(`${selectedSoldiers.length} soldat(s) assigné(s) avec succès à la formation ${formation.name}`, 'success');
}

/**
 * Affiche les soldats assignables à une formation
 * @param {Object} formation - Données de la formation
 */
function displayAssignableSoldiers(formation) {
    console.log(`[displayAssignableSoldiers] Affichage des soldats assignables pour la formation: ${formation.name || formation.nom}`);
    
    // Récupérer tous les soldats depuis la clé localStorage harmonisée
    allSoldiersData = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    console.log(`[displayAssignableSoldiers] Nombre de soldats chargés: ${allSoldiersData.length}`);
    
    // Vérifier et compléter les données des soldats pour éviter les erreurs
    allSoldiersData = allSoldiersData.map(soldier => {
        // S'assurer que chaque soldat a un ID valide
        if (!soldier.id) {
            console.warn('[displayAssignableSoldiers] Soldat sans ID détecté, génération d\'un ID temporaire');
            soldier.id = 'temp_' + Math.random().toString(36).substring(2, 15);
        }
        
        // Standardiser les propriétés du soldat
        soldier.matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
        soldier.pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
        soldier.grade = soldier.grade || soldier.rank || 'Soldat';
        
        // Harmoniser les propriétés pour la compatibilité avec le code existant
        soldier.lastName = soldier.pseudo;
        soldier.nom = soldier.pseudo;
        soldier.rank = soldier.grade;
        
        return soldier;
    });
    
    // Filtrer pour ne garder que les soldats avec des données valides
    allSoldiersData = allSoldiersData.filter(soldier => {
        if (!soldier || typeof soldier !== 'object') {
            console.error('[displayAssignableSoldiers] Données de soldat invalides détectées et filtrées');
            return false;
        }
        return true;
    });
    
    // Afficher les soldats dans l'onglet Soldats
    const soldiersList = document.getElementById('assignable-soldiers-list');
    if (soldiersList) {
        console.log('Liste des soldats assignables trouvée dans le DOM');
        soldiersList.innerHTML = '';
        
        if (allSoldiersData.length === 0) {
            console.warn('Aucun soldat disponible dans la base de données');
            soldiersList.innerHTML = '<div class="no-soldiers">Aucun soldat disponible</div>';
            return;
        }
        
        // Filtrer les soldats selon les critères
        console.log('Filtrage des soldats assignables...');
        filterAssignableSoldiers();
    } else {
        console.error('Élément assignable-soldiers-list non trouvé dans le DOM');
    }
    
    // Vérifier si l'onglet Unités existe avant d'essayer de l'initialiser
    // Cette partie est optionnelle et ne devrait pas bloquer le fonctionnement principal
    try {
        const unitsTab = document.querySelector('.tab[data-tab="units"]');
        if (unitsTab) {
            console.log('Initialisation de l\'onglet Unités');
            // Préparer l'onglet Unités pour le chargement ultérieur
            const unitsList = document.getElementById('assignable-units-list');
            const unitSoldiersList = document.getElementById('unit-soldiers-list');
            
            if (unitsList && unitSoldiersList) {
                unitsList.innerHTML = '';
                unitSoldiersList.innerHTML = '';
            } else {
                console.log('Éléments de liste d\'unités non trouvés dans le DOM - normal si l\'interface a été simplifiée');
            }
        } else {
            console.log('Onglet Unités non trouvé dans le DOM - normal si l\'interface a été simplifiée');
        }
    } catch (error) {
        console.log('Erreur lors de l\'initialisation de l\'onglet Unités (non critique):', error);
    }
}

/**
 * Remplit le sélecteur d'unités avec toutes les unités disponibles
 * @param {HTMLSelectElement} selectElement - L'élément select à remplir
 */
function populateUnitFilter(selectElement) {
    console.log('Remplissage du sélecteur d\'unités...');
    
    // Récupérer toutes les unités
    const units = getAllUnits();
    
    // Vider et ajouter l'option "Toutes les unités"
    selectElement.innerHTML = '<option value="all">Toutes les unités</option>';
    
    // Filtrer pour ne garder que les escouades
    const squads = units.filter(unit => unit.type === 'escouade');
    
    // Trier les escouades par nom
    squads.sort((a, b) => {
        const nameA = a.name || a.nom || '';
        const nameB = b.name || b.nom || '';
        return nameA.localeCompare(nameB);
    });
    
    // Ajouter chaque escouade comme option
    squads.forEach(squad => {
        const option = document.createElement('option');
        option.value = squad.id;
        option.textContent = squad.name || squad.nom || 'Escouade sans nom';
        selectElement.appendChild(option);
    });
    
    console.log(`Filtre d'unités rempli avec ${squads.length} escouades`);
}

/**
 * Filtre les soldats assignables selon les critères de recherche et de filtre d'unité (version simplifiée)
 */
function filterAssignableSoldiers() {
    console.log('Filtrage des soldats assignables (version simplifiée)...');
    const soldiersList = document.getElementById('assignable-soldiers-list');
    const searchInput = document.getElementById('soldier-search');
    const unitFilterSelect = document.getElementById('unit-filter');
    
    // Vérification de sécurité pour la liste des soldats
    if (!soldiersList) {
        console.error('Liste des soldats non trouvée dans le DOM');
        return;
    }
    
    // Vérification de sécurité pour le champ de recherche
    // Si non trouvé, on continue avec une valeur par défaut vide
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Vérification de sécurité pour le sélecteur d'unités
    // Si non trouvé, on continue avec 'all' comme valeur par défaut
    let unitFilterValue = 'all';
    
    // Remplir le sélecteur d'unités s'il existe
    if (unitFilterSelect) {
        try {
            populateUnitFilter(unitFilterSelect);
            unitFilterValue = unitFilterSelect.value;
        } catch (error) {
            console.error('Erreur lors du remplissage du sélecteur d\'unités:', error);
        }
    } else {
        console.warn('Sélecteur d\'unités non trouvé dans le DOM');
    }
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    
    if (!formation) {
        console.error('Formation non trouvée avec ID:', selectedFormationId);
        return;
    }
    
    console.log('Formation sélectionnée pour le filtrage:', formation.name);
    
    // Les variables searchTerm et unitFilterValue sont déjà définies plus haut
    console.log('Critères de filtrage simplifiés - Recherche:', searchTerm, '| Unité:', unitFilterValue);
    
    // Vider la liste
    soldiersList.innerHTML = '';
    
    // Mettre à jour l'affichage de l'unité sélectionnée
    let selectedUnitName = 'Toutes les unités';
    
    if (unitFilterValue !== 'all') {
        const units = getAllUnits();
        const selectedUnit = units.find(unit => unit.id === unitFilterValue);
        
        if (selectedUnit) {
            selectedUnitName = selectedUnit.name || 'Unité sans nom';
            console.log('Unité sélectionnée pour le filtrage:', selectedUnitName);
        } else {
            console.warn('Unité non trouvée avec ID:', unitFilterValue);
        }
    }
    
    // Afficher l'unité sélectionnée dans l'interface
    const selectedUnitElement = document.getElementById('selected-unit-name');
    if (selectedUnitElement) {
        selectedUnitElement.textContent = selectedUnitName;
    }
    
    // Récupérer tous les soldats depuis localStorage
    const allSoldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    console.log('Nombre total de soldats récupérés:', allSoldiers.length);
    
    // Filtrer les soldats avec une logique simplifiée
    let filteredSoldiers = allSoldiers.filter(soldier => {
        if (!soldier) return false;
        
        // Par défaut, on ne montre que les soldats actifs
        if (soldier.status === 'Inactif' || soldier.statut === 'Inactif') {
            return false;
        }
        
        // Exclure les soldats déjà participants à la formation
        if (formation.participants && formation.participants.includes(soldier.id)) {
            return false;
        }
        
        // Standardiser les propriétés pour la recherche
        const nom = soldier.nom || soldier.lastName || '';
        const prenom = soldier.prenom || soldier.firstName || '';
        const matricule = soldier.matricule || '';
        const grade = soldier.grade || soldier.rank || '';
        
        // Filtre par recherche textuelle
        const matchesSearch = searchTerm === '' || 
                             nom.toLowerCase().includes(searchTerm) || 
                             prenom.toLowerCase().includes(searchTerm) || 
                             matricule.toLowerCase().includes(searchTerm) || 
                             grade.toLowerCase().includes(searchTerm);
        
        // Filtre par unité
        const soldierUnitId = soldier.unitId || soldier.unit || '';
        
        // Si "Toutes les unités" est sélectionné, afficher tous les soldats
        if (unitFilterValue === 'all') {
            return matchesSearch;
        } else {
            // Si une escouade spécifique est sélectionnée, afficher tous ses membres
            return matchesSearch && soldierUnitId === unitFilterValue;
        }
    });
    
    console.log('Nombre de soldats après filtrage simplifié:', filteredSoldiers.length);
    
    // Si aucun soldat, afficher un message
    if (filteredSoldiers.length === 0) {
        soldiersList.innerHTML = '<div class="empty-list">Aucun soldat disponible avec ces critères</div>';
        return;
    }
    
    // Afficher chaque soldat
    filteredSoldiers.forEach(soldier => {
        // Standardiser les propriétés pour l'affichage
        const id = soldier.id || generateUniqueId();
        const matricule = soldier.matricule || id.substring(0, 6).toUpperCase();
        const nom = soldier.nom || soldier.lastName || 'Sans nom';
        const prenom = soldier.prenom || soldier.firstName || '';
        const grade = soldier.grade || soldier.rank || 'Soldat';
        const unitId = soldier.unitId || soldier.unit || '';
        
        // Récupérer le nom de l'unité à partir de l'ID
        const unitName = getUnitNameById(unitId);
        
        // Créer l'élément du soldat
        const soldierItem = document.createElement('div');
        soldierItem.className = 'soldier-item';
        soldierItem.dataset.id = id;
        
        // Ajouter le contenu HTML
        soldierItem.innerHTML = `
            <div class="soldier-checkbox">
                <input type="checkbox" id="soldier-${id}" data-id="${id}">
                <label for="soldier-${id}"></label>
            </div>
            <div class="soldier-info">
                <div class="soldier-name">${grade} ${nom} ${prenom}</div>
                <div class="soldier-matricule">${matricule}</div>
                <div class="soldier-unit">${unitName}</div>
            </div>
        `;
        
        // Ajouter l'écouteur d'événement pour la sélection
        const checkbox = soldierItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            const soldierId = this.dataset.id;
            
            if (this.checked) {
                // Ajouter le soldat à la liste des sélectionnés
                if (!selectedSoldiers.includes(soldierId)) {
                    selectedSoldiers.push(soldierId);
                    console.log(`Soldat ${soldierId} sélectionné, total: ${selectedSoldiers.length}`);
                }
            } else {
                // Retirer le soldat de la liste des sélectionnés
                const index = selectedSoldiers.indexOf(soldierId);
                if (index !== -1) {
                    selectedSoldiers.splice(index, 1);
                    console.log(`Soldat ${soldierId} désélectionné, total: ${selectedSoldiers.length}`);
                }
            }
            
            // Mettre à jour le bouton de confirmation
            updateAssignButtonState();
        });
        
        // Ajouter l'élément à la liste
        soldiersList.appendChild(soldierItem);
    });
}

/**
 * Vérifie si un soldat est éligible à une formation
 * @param {Object} soldier - Données du soldat
 * @param {Object} formation - Données de la formation
 * @returns {boolean} True si le soldat est éligible, false sinon
 */
function checkEligibility(soldier, formation) {
    console.log(`[checkEligibility] Vérification de l'éligibilité du soldat ${soldier.pseudo || soldier.lastName || soldier.nom || soldier.id}`);
    
    // Si pas de prérequis, tous les soldats sont éligibles
    if (!formation.prerequisites || formation.prerequisites === 'Aucun') {
        console.log('[checkEligibility] Pas de prérequis, soldat éligible');
        return true;
    }
    
    // Standardiser la propriété grade du soldat
    const soldierGrade = soldier.grade || soldier.rank || 'Soldat';
    console.log(`[checkEligibility] Grade du soldat: ${soldierGrade}`);
    
    // Vérifier les prérequis
    const prerequisites = formation.prerequisites.toLowerCase();
    console.log(`[checkEligibility] Prérequis de la formation: ${prerequisites}`);
    
    // Vérifier le grade minimum
    if (prerequisites.includes('grade')) {
        const requiredRank = prerequisites.match(/grade ([a-zA-Z]+) minimum/i);
        
        if (requiredRank && requiredRank[1]) {
            const requiredGrade = requiredRank[1];
            console.log(`[checkEligibility] Grade requis: ${requiredGrade}`);
            
            const rankHierarchy = ['Recrue', 'Soldat', 'Caporal', 'Sergent', 'Adjudant', 'Lieutenant', 'Capitaine', 'Commandant', 'Colonel'];
            const requiredRankIndex = rankHierarchy.findIndex(r => r.toLowerCase() === requiredGrade.toLowerCase());
            const soldierRankIndex = rankHierarchy.findIndex(r => r.toLowerCase() === soldierGrade.toLowerCase());
            
            console.log(`[checkEligibility] Index du grade requis: ${requiredRankIndex}, Index du grade du soldat: ${soldierRankIndex}`);
            
            if (requiredRankIndex !== -1 && soldierRankIndex !== -1 && soldierRankIndex < requiredRankIndex) {
                console.log(`[checkEligibility] Soldat non éligible: grade insuffisant (${soldierGrade} < ${requiredGrade})`);
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
    console.log('Début de l\'assignation des soldats...');
    console.log('Formation ID:', selectedFormationId);
    console.log('Soldats sélectionnés:', selectedSoldiers);
    
    if (!selectedFormationId) {
        console.error('Aucune formation sélectionnée pour l\'assignation');
        showConfirmationDialog('Erreur', 'Aucune formation sélectionnée', () => {});
        return;
    }
    
    if (selectedSoldiers.length === 0) {
        console.error('Aucun soldat sélectionné pour l\'assignation');
        showConfirmationDialog('Erreur', 'Veuillez sélectionner au moins un soldat à assigner', () => {});
        return;
    }
    
    // Récupérer la formation sélectionnée
    const formation = formationsData.find(f => f.id === selectedFormationId);
    if (!formation) {
        console.error('Formation non trouvée dans les données:', selectedFormationId);
        showConfirmationDialog('Erreur', 'Formation introuvable', () => {});
        return;
    }
    
    console.log('Formation trouvée:', formation.name);
    
    // Standardiser le nom de la formation
    const formationName = formation.name || formation.nom;
    formation.name = formationName; // Assurer que la propriété name existe
    formation.nom = formationName;  // Assurer que la propriété nom existe aussi pour compatibilité
    
    // S'assurer que la formation a un tableau participants
    if (!formation.participants) {
        formation.participants = [];
        console.log('Initialisation du tableau participants pour la formation');
    }
    
    // Vérifier la capacité de la formation
    const capacity = parseInt(formation.capacity) || Infinity;
    const currentParticipants = formation.participants.length;
    const availableSlots = capacity - currentParticipants;
    
    console.log('Capacité de la formation:', capacity);
    console.log('Participants actuels:', currentParticipants);
    console.log('Places disponibles:', availableSlots);
    
    if (availableSlots <= 0) {
        console.warn('La formation est déjà complète');
        showConfirmationDialog(
            'Formation complète',
            `La formation ${formationName} est déjà complète (${currentParticipants}/${capacity}).`,
            () => {}
        );
        return;
    }
    
    // Limiter le nombre de soldats à assigner si nécessaire
    let soldiersToAssign = selectedSoldiers;
    if (selectedSoldiers.length > availableSlots) {
        soldiersToAssign = selectedSoldiers.slice(0, availableSlots);
        console.warn(`Limitation du nombre de soldats assignés à ${availableSlots} en raison de la capacité de la formation`);
    }
    
    // Stocker le nombre de soldats avant assignation pour le message
    const nbSoldiers = soldiersToAssign.length;
    
    // Récupérer les données des soldats
    const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    
    // Ajouter les soldats sélectionnés à la formation
    soldiersToAssign.forEach(soldierId => {
        if (!formation.participants.includes(soldierId)) {
            // Ajouter le soldat à la liste des participants de la formation
            formation.participants.push(soldierId);
            console.log(`Soldat ${soldierId} assigné à la formation ${formation.name}`);
            
            // Mettre à jour l'historique du soldat
            updateSoldierHistory(soldierId, `Assigné à la formation "${formation.name}"`);
            
            // Mettre à jour les données du soldat
            const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
            if (soldierIndex !== -1) {
                const soldier = soldiers[soldierIndex];
                
                // Standardiser les propriétés du soldat
                soldier.matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
                soldier.pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
                soldier.grade = soldier.grade || soldier.rank || 'Soldat';
                
                // Harmoniser les propriétés pour la compatibilité avec le code existant
                soldier.lastName = soldier.pseudo;
                soldier.nom = soldier.pseudo;
                soldier.rank = soldier.grade;
                
                // Standardiser l'unité
                if (soldier.unité && !soldier.unit) {
                    soldier.unit = soldier.unité;
                } else if (soldier.unite && !soldier.unit) {
                    soldier.unit = soldier.unite;
                }
                
                // Assurer la compatibilité avec l'ancien code
                if (soldier.unit) {
                    soldier.unité = soldier.unit;
                    soldier.unite = soldier.unit;
                }
                
                console.log(`[assignSelectedSoldiersToFormation] Propriétés standardisées pour ${soldier.pseudo} (${soldier.matricule})`);
                
                // Initialiser le tableau des formations si nécessaire
                if (!soldier.formations) {
                    soldier.formations = [];
                }
                
                // Vérifier si la formation est déjà assignée au soldat
                const existingFormation = soldier.formations.find(f => f.formationId === formation.id);
                if (!existingFormation) {
                    // S'assurer que la formation a un nom harmonisé
                    if (!formation.nom && formation.name) {
                        formation.nom = formation.name;
                    } else if (!formation.name && formation.nom) {
                        formation.name = formation.nom;
                    }
                    
                    // Standardiser les propriétés de la formation
                    const formationName = formation.name || formation.nom || 'Formation sans nom';
                    
                    // Ajouter la formation aux formations du soldat avec propriétés standardisées
                    soldier.formations.push({
                        formationId: formation.id,
                        nom: formationName, // Pour compatibilité avec dossierSoldat.js
                        name: formationName, // Pour compatibilité avec le reste du code
                        date: new Date().toISOString(),
                        statut: 'assignee', // Statut initial
                        status: 'assignee'  // Propriété standardisée
                    });
                    
                    // Mettre à jour le soldat dans le tableau
                    soldiers[soldierIndex] = soldier;
                    console.log(`[assignSelectedSoldiersToFormation] Formation ${formationName} ajoutée aux données du soldat ${soldier.pseudo} (${soldier.matricule})`);
                }
            }
        } else {
            console.warn(`Le soldat ${soldierId} est déjà assigné à cette formation`);
        }
    });
    
    // Sauvegarder les modifications des formations
    saveFormations();
    console.log('Formations sauvegardées dans le localStorage');
    
    // Sauvegarder les modifications des soldats
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
    
    // Mettre à jour allSoldiersData si elle est déjà chargée
    if (allSoldiersData.length > 0) {
        allSoldiersData = soldiers;
    }
    console.log('Données des soldats sauvegardées dans le localStorage');
    
    // Mettre à jour l'affichage
    displayFormations(formationsData);
    console.log('Affichage des formations mis à jour');
    
    // Réinitialiser la sélection
    selectedSoldiers = [];
    
    // Fermer la modale d'assignation
    const modal = document.getElementById('assign-soldiers-modal');
    if (modal) {
        modal.classList.add('hidden-modal');
        console.log('Fermeture de la modale d\'assignation après assignation réussie');
    }
    
    // Afficher un message de confirmation
    showConfirmationDialog(
        'Assignation réussie',
        `${nbSoldiers} soldat${nbSoldiers > 1 ? 's' : ''} assigné${nbSoldiers > 1 ? 's' : ''} à la formation ${formation.name}`,
        () => {
            // Ouvrir la modale de détail pour voir les participants après confirmation
            openFormationDetailModal(selectedFormationId);
        }
    );
}

/**
 * Met à jour l'historique d'un soldat
 * @param {string} soldierId - Identifiant du soldat
 * @param {string} event - Description de l'événement
 */
function updateSoldierHistory(soldierId, event) {
    console.log(`[updateSoldierHistory] Mise à jour de l'historique du soldat ${soldierId}: ${event}`);
    
    // Récupérer les données des soldats depuis la clé localStorage harmonisée
    let soldiers = [];
    try {
        soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    } catch (error) {
        console.error('[updateSoldierHistory] Erreur lors de la récupération des données des soldats:', error);
        return;
    }
    
    // Trouver le soldat concerné
    const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
    
    if (soldierIndex === -1) {
        console.warn(`[updateSoldierHistory] Soldat ${soldierId} non trouvé pour la mise à jour de l'historique`);
        return;
    }
    
    const soldier = soldiers[soldierIndex];
    
    // Standardiser les propriétés du soldat
    soldier.matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
    soldier.pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
    soldier.grade = soldier.grade || soldier.rank || 'Soldat';
    
    // Harmoniser les propriétés pour la compatibilité avec le code existant
    soldier.lastName = soldier.pseudo;
    soldier.nom = soldier.pseudo;
    soldier.rank = soldier.grade;
    
    // Standardiser l'unité
    if (soldier.unité && !soldier.unit) {
        soldier.unit = soldier.unité;
    } else if (soldier.unite && !soldier.unit) {
        soldier.unit = soldier.unite;
    }
    
    // Assurer la compatibilité avec l'ancien code
    if (soldier.unit) {
        soldier.unité = soldier.unit;
        soldier.unite = soldier.unit;
    }
    
    // Créer un nouvel événement avec les propriétés standardisées
    const newEvent = {
        date: new Date().toISOString(),
        type: 'formation',
        action: event,      // Propriété standardisée
        description: event  // Pour compatibilité
    };
    
    // Support pour les deux structures d'historique (history et historique)
    // pour assurer la compatibilité avec le code existant
    
    // Mise à jour de historique (structure principale)
    if (!soldier.historique) {
        soldier.historique = [];
    }
    soldier.historique.push(newEvent);
    
    // Mise à jour de history (structure alternative) pour compatibilité
    if (!soldier.history) {
        soldier.history = [];
    }
    soldier.history.push({
        ...newEvent,
        event: event  // Pour compatibilité avec la structure history
    });
    
    console.log(`[updateSoldierHistory] Événement ajouté à l'historique du soldat ${soldier.pseudo} (${soldier.matricule})`);
    
    // Sauvegarder les modifications dans la clé localStorage harmonisée
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
    
    // Mettre à jour allSoldiersData si elle est déjà chargée
    if (allSoldiersData.length > 0) {
        allSoldiersData = soldiers;
    }
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
 * @param {HTMLElement} selectElement - Élément select à remplir
 */
function populateUnitFilter(selectElement) {
    console.log('[populateUnitFilter] Début de la fonction');
    
    // Vérifier si l'élément est défini
    if (!selectElement) {
        console.error('[populateUnitFilter] Élément select non défini');
        return;
    }
    
    console.log('[populateUnitFilter] Sélecteur d\'unités trouvé:', selectElement);
    
    try {
        // Approche alternative : vider complètement le sélecteur et recréer l'option par défaut
        selectElement.innerHTML = '';
        
        // Créer l'option "Toutes les unités"
        const defaultOption = document.createElement('option');
        defaultOption.value = 'all';
        defaultOption.textContent = 'Toutes les unités';
        selectElement.appendChild(defaultOption);
        
        // Récupérer les unités
        const units = getAllUnits();
        console.log(`[populateUnitFilter] ${units.length} unités récupérées`);
        
        // Ajouter les options pour chaque unité
        units.forEach(unit => {
            if (!unit || !unit.id || !unit.name) {
                console.warn('[populateUnitFilter] Unité invalide ignorée:', unit);
                return;
            }
            
            const option = document.createElement('option');
            option.value = unit.id;
            option.textContent = `${unit.name} (${unit.type || 'Non spécifié'})`;
            selectElement.appendChild(option);
        });
        
        console.log('[populateUnitFilter] Sélecteur d\'unités rempli avec succès');
    } catch (error) {
        console.error('[populateUnitFilter] Erreur lors du remplissage du sélecteur d\'unités:', error);
    }
}

/**
 * Génère un ID unique pour une unité
 * @param {string} type - Type d'unité (QG, compagnie, section, escouade)
 * @param {string} name - Nom de l'unité
 * @returns {string} ID unique
 */
function generateUnitId(type, name) {
    // Créer un préfixe basé sur le type
    const prefix = type ? type.substring(0, 2).toUpperCase() : 'UN';
    
    // Créer un suffixe basé sur le nom (si disponible)
    let suffix = '';
    if (name) {
        // Prendre les 3 premiers caractères du nom, convertir en majuscules et supprimer les espaces
        suffix = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    } else {
        // Générer un suffixe aléatoire de 3 caractères
        suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    }
    
    // Ajouter un timestamp pour garantir l'unicité
    const timestamp = Date.now().toString().substring(9, 13);
    
    return `${prefix}_${suffix}_${timestamp}`;
}

/**
 * Récupère toutes les unités depuis le stockage local et assure que chacune a un ID unique
 * @returns {Array} Tableau des unités avec IDs
 */
function getAllUnits() {
    const unitsData = localStorage.getItem('eagleOperator_units');
    let units = unitsData ? JSON.parse(unitsData) : [];
    
    // Vérifier et ajouter des IDs uniques aux unités qui n'en ont pas
    let modified = false;
    
    units = units.map(unit => {
        // Si l'unité n'a pas d'ID, en générer un
        if (!unit.id) {
            unit.id = generateUnitId(unit.type, unit.name || unit.nom);
            console.log(`ID généré pour l'unité ${unit.name || unit.nom}: ${unit.id}`);
            modified = true;
        }
        
        // Standardiser les propriétés
        if (!unit.name && unit.nom) {
            unit.name = unit.nom;
        } else if (!unit.nom && unit.name) {
            unit.nom = unit.name;
        }
        
        return unit;
    });
    
    // Si des modifications ont été apportées, sauvegarder les unités mises à jour
    if (modified) {
        console.log('Des unités ont été mises à jour avec des IDs uniques, sauvegarde...');
        localStorage.setItem('eagleOperator_units', JSON.stringify(units));
    }
    
    return units;
}

/**
 * Charge et affiche toutes les unités dans la liste
 */
function loadAllUnits() {
    console.log('Chargement des unités...');
    const unitsList = document.getElementById('assignable-units-list');
    if (!unitsList) {
        console.error('Liste des unités non trouvée dans le DOM');
        return;
    }
    
    // Vider la liste
    unitsList.innerHTML = '';
    
    // Récupérer toutes les unités
    const units = getAllUnits();
    console.log('Unités récupérées:', units.length);
    
    if (units.length === 0) {
        console.warn('Aucune unité disponible');
        unitsList.innerHTML = '<div class="no-units">Aucune unité disponible</div>';
        return;
    }
    
    // Vérifier et compléter les données des unités pour éviter les erreurs
    const safeUnits = units.map(unit => {
        return {
            id: unit.id || generateUniqueId(),
            name: unit.name || 'Unité sans nom',
            type: unit.type || 'Inconnue',
            members: Array.isArray(unit.members) ? unit.members : [],
            commander: unit.commander || null
        };
    });
    
    // Trier les unités par type et nom
    safeUnits.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
    });
    
    console.log('Unités triées et sécurisées:', safeUnits.length);
    
    // Créer les éléments pour chaque unité
    safeUnits.forEach(unit => {
        const unitItem = document.createElement('div');
        unitItem.className = 'unit-item';
        unitItem.setAttribute('data-unit-id', unit.id);
        
        // Calculer le nombre total de membres (incluant le commandant s'il n'est pas déjà dans les membres)
        let totalMembers = unit.members.length;
        if (unit.commander && !unit.members.includes(unit.commander)) {
            totalMembers++;
        }
        
        unitItem.innerHTML = `
            <div class="unit-info">
                <div class="unit-name">${unit.name}</div>
                <div class="unit-details">
                    <span class="unit-type">${unit.type}</span>
                    <span class="unit-members">${totalMembers} membres</span>
                    ${unit.commander ? '<span class="unit-commander">Avec commandant</span>' : ''}
                </div>
            </div>
        `;
        
        unitItem.addEventListener('click', () => {
            console.log('Unité sélectionnée:', unit.name);
            
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
    
    console.log('Affichage des unités terminé');
}

/**
 * Affiche les soldats d'une unité spécifique, y compris le commandant
 * @param {string} unitId - Identifiant de l'unité
 */
function displayUnitSoldiers(unitId) {
    console.log('Affichage des soldats de l\'unité avec ID:', unitId);
    const unitSoldiersList = document.getElementById('unit-soldiers-list');
    if (!unitSoldiersList) {
        console.error('Liste des soldats de l\'unité non trouvée dans le DOM');
        return;
    }
    
    // Vider la liste
    unitSoldiersList.innerHTML = '';
    
    // Récupérer les soldats de l'unité
    const units = getAllUnits();
    console.log('Unités récupérées:', units.length);
    
    const unit = units.find(u => u.id === unitId);
    
    if (!unit) {
        console.error('Unité non trouvée avec ID:', unitId);
        unitSoldiersList.innerHTML = '<div class="no-soldiers">Unité introuvable</div>';
        return;
    }
    
    console.log('Unité sélectionnée:', unit.name);
    
    // S'assurer que l'unité a un tableau members
    if (!Array.isArray(unit.members)) {
        unit.members = [];
    }
    
    // Préparer la liste des membres à afficher, y compris le commandant
    let membersToDisplay = [...unit.members];
    let commanderId = unit.commander || null;
    
    // Ajouter le commandant s'il n'est pas déjà dans la liste des membres
    if (commanderId && !membersToDisplay.includes(commanderId)) {
        console.log('Ajout du commandant à la liste des membres:', commanderId);
        membersToDisplay.push(commanderId);
    }
    
    displayUnitSoldiersWithMembers(unit, membersToDisplay, unitSoldiersList);
}

/**
 * Affiche les soldats d'une unité avec la liste des membres fournie
 * @param {Object} unit - Unité
 * @param {Array} membersToDisplay - Liste des IDs des membres à afficher
 * @param {HTMLElement} unitSoldiersList - Élément DOM pour la liste des soldats
 */
function displayUnitSoldiersWithMembers(unit, membersToDisplay, unitSoldiersList) {
    // Récupérer tous les soldats
    const allSoldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
    console.log('Nombre total de soldats:', allSoldiers.length);
    
    // Filtrer les soldats qui sont membres de l'unité
    const unitSoldiers = allSoldiers.filter(soldier => {
        return soldier && soldier.id && membersToDisplay.includes(soldier.id);
    });
    
    console.log('Nombre de soldats dans l\'unité:', unitSoldiers.length);
    
    if (unitSoldiers.length === 0) {
        unitSoldiersList.innerHTML = '<div class="no-soldiers">Aucun soldat trouvé dans cette unité</div>';
        return;
    }
    
    // Trier les soldats par nom (utiliser la propriété standardisée pseudo au lieu de lastName)
    unitSoldiers.sort((a, b) => {
        // Placer le commandant en premier
        if (a.id === unit.commander) return -1;
        if (b.id === unit.commander) return 1;
        
        // Ensuite par nom
        const pseudoA = a.pseudo || a.lastName || '';
        const pseudoB = b.pseudo || b.lastName || '';
        if (!pseudoA) return 1;
        if (!pseudoB) return -1;
        return pseudoA.localeCompare(pseudoB);
    });
    
    // Créer et ajouter les éléments pour chaque soldat
    unitSoldiers.forEach(soldier => {
        // Marquer le soldat comme commandant si applicable
        if (soldier.id === unit.commander) {
            soldier.isCommander = true;
        }
        
        const soldierItem = createSoldierItemForAssignment(soldier);
        
        // Ajouter une classe spéciale pour les commandants
        if (soldier.id === unit.commander) {
            soldierItem.classList.add('commander');
        }
        
        unitSoldiersList.appendChild(soldierItem);
    });
    console.log('Affichage des soldats terminé');
}

/**
                return false;
            }
            
            // Filtre par unité
            let matchesUnit = unitFilterValue === 'all';
            
            if (!matchesUnit) {
                // Vérifier si le soldat est membre de l'unité
                if (selectedUnitMembers.includes(soldier.id)) {
                    matchesUnit = true;
                }
                
                // Vérifier si le soldat est commandant de l'unité
                if (selectedUnitCommander === soldier.id) {
                    matchesUnit = true;
                }
            }
            
            if (!matchesUnit) return false;
            
            // Filtre par recherche (avec vérification des données)
            if (searchTerm) {
                // Utiliser pseudo et matricule pour la recherche
                const pseudo = (soldier.pseudo || soldier.lastName || soldier.nom || '').toLowerCase();
                const matricule = (soldier.matricule || '').toLowerCase();
                const grade = (soldier.grade || soldier.rank || '').toLowerCase();
                
                // Construire le nom complet pour la recherche
                const fullName = `${grade} ${pseudo} ${matricule}`.toLowerCase();
                
                const matchesSearch = fullName.includes(searchTerm);
                if (!matchesSearch) return false;
            }
            
            // Filtre par disponibilité/éligibilité
            if (filterValue === 'available') {
                // Vérifier si le soldat est disponible (pas en mission, etc.)
                return soldier.status === 'Actif';
            } else if (filterValue === 'eligible' && formation) {
                // Vérifier si le soldat est éligible (prérequis remplis)
                return checkEligibility(soldier, formation);
            }
            
            return true; // Si aucun filtre spécifique n'est appliqué
        });
        
        console.log('Nombre de soldats après filtrage:', filteredSoldiers.length);
        
        // Trier les soldats
        filteredSoldiers.sort((a, b) => {
            // D'abord par statut (actifs en premier)
            if (a.status === 'Actif' && b.status !== 'Actif') return -1;
            if (a.status !== 'Actif' && b.status === 'Actif') return 1;
            
            // Ensuite par commandant (commandants en premier)
            if (a.isCommander && !b.isCommander) return -1;
            if (!a.isCommander && b.isCommander) return 1;
            
            // Ensuite par grade (du plus élevé au moins élevé)
            const rankOrder = {
                'Général': 1, 'Colonel': 2, 'Lieutenant-Colonel': 3, 'Commandant': 4,
                'Capitaine': 5, 'Lieutenant': 6, 'Sous-Lieutenant': 7, 'Major': 8,
                'Adjudant-Chef': 9, 'Adjudant': 10, 'Sergent-Chef': 11, 'Sergent': 12,
                'Caporal-Chef': 13, 'Caporal': 14, 'Soldat de 1ère Classe': 15, 'Soldat': 16
            };
            
            // Utiliser la propriété standardisée grade au lieu de rank
            const rankA = rankOrder[a.grade || a.rank] || 99;
            const rankB = rankOrder[b.grade || b.rank] || 99;
            
            if (rankA !== rankB) return rankA - rankB;
            
            // Enfin par nom (utiliser la propriété standardisée pseudo au lieu de lastName)
            const pseudoA = a.pseudo || a.lastName || '';
            const pseudoB = b.pseudo || b.lastName || '';
            if (!pseudoA) return 1;
            if (!pseudoB) return -1;
            return pseudoA.localeCompare(pseudoB);
        });
        
        // Marquer les commandants d'unité pour un affichage spécial
        filteredSoldiers = markCommandersInSoldierList(filteredSoldiers);
        console.log('Soldats filtrés avec commandants marqués:', filteredSoldiers.length);
        
        // Afficher les soldats filtrés
        if (filteredSoldiers.length === 0) {
            soldiersList.innerHTML = '<div class="no-soldiers">Aucun soldat ne correspond aux critères de recherche</div>';
            return;
        }
        
        // Créer les éléments pour chaque soldat
        filteredSoldiers.forEach(soldier => {
            const soldierItem = createSoldierItemForAssignment(soldier);
            soldiersList.appendChild(soldierItem);
        });
        
        // Afficher le nombre de soldats filtrés
        const countElement = document.getElementById('filtered-soldiers-count');
        if (countElement) {
            countElement.textContent = `${filteredSoldiers.length} soldat(s) trouvé(s)`;
        }
    } catch (error) {
        console.error('Erreur lors du filtrage des soldats:', error);
        soldiersList.innerHTML = '<div class="no-soldiers">Erreur lors du chargement des soldats</div>';
    }
}

/**
 * Crée un élément HTML pour un soldat dans la liste d'assignation
 * @param {Object} soldier - Données du soldat
 * @returns {HTMLElement} Élément HTML du soldat
 */
function createSoldierItemForAssignment(soldier, selectedFormationId) {
    console.log('Données du soldat pour assignation:', soldier);
    console.log('Propriétés du soldat:', Object.keys(soldier));
    
    // Créer des données sécurisées pour éviter les erreurs
    const safeData = {
        id: soldier.id || 'unknown',
        matricule: soldier.matricule || soldier.id.substring(0, 6).toUpperCase(),
        pseudo: soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom',
        grade: soldier.grade || soldier.rank || '',
        unitId: soldier.unit || soldier.unité || soldier.unite || null,
        status: soldier.status || soldier.statut || 'Inconnu'
    };
    
    // Compatibilité avec le code existant
    safeData.lastName = safeData.pseudo;
    safeData.firstName = '';
    safeData.rank = safeData.grade;
    
    console.log('Données sécurisées du soldat:', safeData);
    
    // Vérifier si l'ID de l'unité est valide
    console.log('ID de l\'unité du soldat:', safeData.unitId, 'Type:', typeof safeData.unitId);
    if (safeData.unitId) {
        console.log('ID de l\'unité valide:', safeData.unitId);
    } else {
        console.log('ID de l\'unité invalide ou manquant');
    }
    
    // Récupérer le nom de l'unité à partir de l'ID en utilisant la fonction centralisée
    safeData.unit = getUnitNameById(safeData.unitId);
    console.log(`Soldat ${safeData.lastName}: unité=${safeData.unitId}, nom unité=${safeData.unit}`);
    
    const formation = formationsData.find(f => f.id === selectedFormationId);
    const isParticipant = formation && formation.participants && formation.participants.includes(safeData.id);
    const isEligible = formation ? checkEligibility(soldier, formation) : true;
    
    // Créer l'élément du soldat
    const soldierItem = document.createElement('div');
    soldierItem.className = `soldier-item ${isParticipant ? 'participant' : ''} ${!isEligible ? 'ineligible' : ''} ${soldier.isCommander ? 'commander' : ''}`;
    soldierItem.setAttribute('data-soldier-id', safeData.id);
    
    // Créer le contenu du soldat avec les données sécurisées en utilisant DOM API
    // Div pour la checkbox
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'soldier-checkbox';
    
    // Checkbox
    const checkboxInput = document.createElement('input');
    checkboxInput.type = 'checkbox';
    checkboxInput.id = 'soldier-' + safeData.id;
    if (isParticipant) {
        checkboxInput.checked = true;
        checkboxInput.disabled = true;
    }
    if (!isEligible && !isParticipant) {
        checkboxInput.disabled = true;
    }
    checkboxDiv.appendChild(checkboxInput);
        
    // Div pour les infos
    const infoDiv = document.createElement('div');
    infoDiv.className = 'soldier-info';
        
    // Ajouter le nom du soldat (pseudo et matricule)
    const nameElement = document.createElement('div');
    nameElement.className = 'soldier-name';
    nameElement.textContent = `${safeData.grade} ${safeData.pseudo}`;
    
    // Ajouter le matricule si disponible
    if (safeData.matricule) {
        const matriculeSpan = document.createElement('span');
        matriculeSpan.className = 'soldier-matricule';
        matriculeSpan.textContent = ` (${safeData.matricule})`;
        matriculeSpan.style.fontSize = '0.85em';
        matriculeSpan.style.opacity = '0.8';
        nameElement.appendChild(matriculeSpan);
    }
        
    // Ajouter un badge pour les commandants
    if (soldier.isCommander) {
        const commanderBadge = document.createElement('div');
        commanderBadge.className = 'commander-badge';
        commanderBadge.textContent = 'CDT';
        commanderBadge.style.backgroundColor = 'gold';
        commanderBadge.style.color = '#333';
        commanderBadge.style.padding = '2px 5px';
        commanderBadge.style.borderRadius = '3px';
        commanderBadge.style.fontSize = '10px';
        commanderBadge.style.fontWeight = 'bold';
        commanderBadge.style.marginLeft = '5px';
        commanderBadge.style.display = 'inline-block';
        nameElement.appendChild(commanderBadge);
        console.log(`Badge de commandant ajouté pour ${safeData.lastName}`);
    }
        
    infoDiv.appendChild(nameElement);
        
    // Créer une div pour les détails du soldat
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'soldier-details';
    
    // Ajouter l'ID du soldat
    const idSpan = document.createElement('span');
    idSpan.className = 'soldier-id';
    idSpan.textContent = 'ID: ' + safeData.id;
    detailsDiv.appendChild(idSpan);
    
    // Ajouter l'unité du soldat
    const unitSpan = document.createElement('span');
    unitSpan.className = 'soldier-unit';
    unitSpan.textContent = safeData.unit;
    detailsDiv.appendChild(unitSpan);
    
    // Ajouter le statut du soldat
    const statusSpan = document.createElement('span');
    statusSpan.className = 'soldier-status';
    statusSpan.textContent = safeData.status || 'Inconnu';
    detailsDiv.appendChild(statusSpan);
    
    infoDiv.appendChild(detailsDiv);
    
    // Ajouter les éléments au soldierItem
    soldierItem.appendChild(checkboxDiv);
    soldierItem.appendChild(infoDiv);
    
    // Ajouter un gestionnaire d'événement pour la sélection
    const checkboxElement = soldierItem.querySelector(`#soldier-${safeData.id}`);
    
    if (checkboxElement && !isParticipant && isEligible) {
        checkboxElement.addEventListener('change', function() {
            // S'assurer que selectedSoldiers est un tableau
            if (!Array.isArray(selectedSoldiers)) {
                selectedSoldiers = [];
                console.warn('selectedSoldiers réinitialisé comme tableau vide');
            }
            
            if (this.checked) {
                // Ajouter le soldat à la sélection s'il n'y est pas déjà
                if (!selectedSoldiers.includes(safeData.id)) {
                    selectedSoldiers.push(safeData.id);
                    console.log(`Soldat ${safeData.lastName} ajouté à la sélection`);
                }
            } else {
                // Retirer le soldat de la sélection
                const index = selectedSoldiers.indexOf(safeData.id);
                if (index !== -1) {
                    selectedSoldiers.splice(index, 1);
                    console.log(`Soldat ${safeData.lastName} retiré de la sélection`);
                }
            }
            
            console.log('Soldats sélectionnés:', selectedSoldiers);
        });
    }
    
    return soldierItem;
}

/**
 * Récupère toutes les unités depuis le localStorage
 * @returns {Array} Liste des unités
 */
function getAllUnits() {
    try {
        // Utiliser la clé harmonisée eagleOperator_units comme indiqué dans les mémoires
        const units = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
        return Array.isArray(units) ? units : [];
    } catch (error) {
        console.error('Erreur lors de la récupération des unités:', error);
        return [];
    }
}

/**
 * Récupère le nom d'une unité à partir de son ID ou de son nom
 * @param {string} unitId - ID ou nom de l'unité
 * @returns {string} Nom de l'unité ou 'Sans unité' si non trouvée
 */
function getUnitNameById(unitId) {
    if (!unitId) return 'Sans unité';
    
    try {
        const units = getAllUnits();
        
        // Recherche par ID
        let unit = units.find(u => u.id === unitId);
        
        // Si non trouvé par ID, essayer de trouver par nom
        if (!unit) {
            unit = units.find(u => u.name === unitId || u.nom === unitId);
            if (unit) {
                console.log(`Unité trouvée par son nom: ${unit.name} (ID: ${unit.id})`);
            }
        }
        
        if (unit && (unit.name || unit.nom)) {
            const unitName = unit.name || unit.nom;
            console.log(`Unité trouvée: ${unitName} (ID: ${unit.id})`);
            return unitName;
        } else {
            // Si l'ID ressemble à un nom d'unité, le retourner directement
            if (typeof unitId === 'string' && unitId.length > 3 && /[A-Za-z]/.test(unitId)) {
                console.log(`Unité non trouvée dans la base, mais l'ID ressemble à un nom: ${unitId}`);
                return unitId;
            }
            console.warn(`Unité non trouvée pour l'ID: ${unitId}`);
            return 'Unité inconnue';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du nom de l\'unité:', error);
        return 'Sans unité';
    }
}

/**
 * Vérifie si un soldat est commandant d'une unité
 * @param {string} soldierId - ID du soldat à vérifier
 * @returns {boolean} True si le soldat est commandant d'une unité, false sinon
 */
function isUnitCommander(soldierId) {
    if (!soldierId) return false;
    
    const units = getAllUnits();
    return units.some(unit => unit.commander === soldierId);
}

/**
 * Marque les commandants dans une liste de soldats
 * @param {Array} soldiers - Liste des soldats à traiter
 * @returns {Array} Liste des soldats avec les commandants marqués
 */
function markCommandersInSoldierList(soldiers) {
    if (!Array.isArray(soldiers)) return [];
    
    const units = getAllUnits();
    const commanderIds = units.map(unit => unit.commander).filter(id => id);
    
    return soldiers.map(soldier => {
        if (!soldier) return null;
        
        // Créer une copie pour ne pas modifier l'original
        const soldierCopy = { ...soldier };
        
        // Marquer comme commandant si applicable
        if (commanderIds.includes(soldier.id)) {
            soldierCopy.isCommander = true;
        }
        
        return soldierCopy;
    }).filter(soldier => soldier !== null);
}

/**
 * Supprime une formation et met à jour la base de données
 * @param {string} formationId - Identifiant de la formation à supprimer
 */
function deleteFormation(formationId) {
    console.log('Suppression de la formation avec ID:', formationId);
    
    // Trouver l'index de la formation dans le tableau
    const formationIndex = formationsData.findIndex(f => f.id === formationId);
    
    if (formationIndex === -1) {
        console.error('Formation non trouvée pour la suppression');
        return;
    }
    
    // Récupérer les informations de la formation avant suppression pour le log
    const formation = formationsData[formationIndex];
    console.log('Suppression de la formation:', formation.name);
    
    // Supprimer la formation du tableau
    formationsData.splice(formationIndex, 1);
    
    // Mettre à jour le localStorage
    saveFormations();
    
    // Mettre à jour l'affichage
    displayFormations(formationsData);
    
    // Afficher un message de confirmation avec notre boîte de dialogue personnalisée
    showConfirmationDialog(
        'Succès',
        `La formation "${formation.name}" a été supprimée avec succès.`,
        () => {}
    );
}

/**
 * Affiche une boîte de dialogue de confirmation personnalisée
 * @param {string} title - Titre de la boîte de dialogue
 * @param {string} message - Message à afficher
 * @param {Function} onConfirm - Fonction à exécuter si l'utilisateur confirme
 */
function showConfirmationDialog(title, message, onConfirm) {
    console.log('Affichage de la boîte de dialogue de confirmation');
    
    // Vérifier s'il y a déjà une boîte de dialogue ouverte et la supprimer
    const existingDialog = document.querySelector('.confirmation-dialog');
    if (existingDialog) {
        console.log('Suppression d\'une boîte de dialogue existante');
        document.body.removeChild(existingDialog);
    }
    
    // Créer l'élément de la boîte de dialogue
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    dialog.style.display = 'flex';
    dialog.style.position = 'fixed';
    dialog.style.top = '0';
    dialog.style.left = '0';
    dialog.style.width = '100%';
    dialog.style.height = '100%';
    dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    dialog.style.justifyContent = 'center';
    dialog.style.alignItems = 'center';
    dialog.style.zIndex = '9999';
    
    dialog.innerHTML = `
        <div class="confirmation-content" style="background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); max-width: 400px; width: 100%;">
            <h3 style="margin-top: 0; color: #333;">${title}</h3>
            <p>${message}</p>
            <div class="confirmation-buttons" style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <button class="cancel-btn" style="margin-left: 10px; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; background-color: #95a5a6; color: white;">Annuler</button>
                <button class="confirm-btn danger-btn" style="margin-left: 10px; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; background-color: #e74c3c; color: white;">Confirmer</button>
            </div>
        </div>
    `;
    
    // Ajouter la boîte de dialogue au document
    document.body.appendChild(dialog);
    console.log('Boîte de dialogue ajoutée au DOM');
    
    // Ajouter les écouteurs d'événements
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.confirm-btn');
    
    cancelBtn.addEventListener('click', () => {
        console.log('Annulation de la confirmation');
        document.body.removeChild(dialog);
    });
    
    confirmBtn.addEventListener('click', () => {
        console.log('Confirmation acceptée, exécution de l\'action');
        onConfirm();
        document.body.removeChild(dialog);
    });
    
    // Fermeture par Escape
    document.addEventListener('keydown', function escapeHandler(event) {
        if (event.key === 'Escape') {
            console.log('Fermeture de la boîte de dialogue par Escape');
            document.body.removeChild(dialog);
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Fin du fichier formationManager.js
