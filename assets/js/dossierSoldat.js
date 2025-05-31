// assets/js/dossierSoldat.js
// Gestion de la page dossier-soldat.html

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de la page dossier soldat');
    
    // Éléments DOM
    const soldierContainer = document.getElementById('soldier-container');
    const loadingMessage = document.getElementById('soldier-loading');
    const btnCloseDossier = document.getElementById('btn-close-dossier');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // Variables globales
    let currentSoldierId = null;
    
    /**
     * Récupère toutes les unités depuis le localStorage
     * @returns {Array} Liste des unités
     */
    function getAllUnits() {
        try {
            // Vérifier si la clé existe dans le localStorage
            const unitsData = localStorage.getItem('eagleOperator_units');
            console.log('[dossierSoldat] Données brutes des unités dans localStorage:', unitsData);
            
            if (!unitsData) {
                console.warn('[dossierSoldat] Aucune donnée d\'unité trouvée dans localStorage');
                return [];
            }
            
            // Parser les données
            const units = JSON.parse(unitsData);
            console.log(`[dossierSoldat] ${units.length} unités récupérées depuis localStorage:`, units);
            
            // Vérifier que les unités ont les propriétés nécessaires
            units.forEach(unit => {
                if (!unit.name && unit.nom) {
                    unit.name = unit.nom;
                    console.log(`[dossierSoldat] Unité ${unit.id}: propriété 'name' ajoutée depuis 'nom'`);
                } else if (!unit.nom && unit.name) {
                    unit.nom = unit.name;
                    console.log(`[dossierSoldat] Unité ${unit.id}: propriété 'nom' ajoutée depuis 'name'`);
                }
            });
            
            return units;
        } catch (error) {
            console.error('[dossierSoldat] Erreur lors de la récupération des unités:', error);
            return [];
        }
    }

    /**
     * Récupère le nom d'une unité à partir de son ID ou de son nom
     * @param {string} unitId - ID ou nom de l'unité
     * @returns {string} Nom de l'unité ou valeur par défaut si non trouvée
     */
    function getUnitNameById(unitId) {
        console.log('[dossierSoldat] Début de getUnitNameById avec ID/nom:', unitId);
        
        // Si pas d'ID d'unité, retourner 'Sans unité'
        if (!unitId) {
            console.log('[dossierSoldat] ID/nom d\'unité vide, retourne "Sans unité"');
            return 'Sans unité';
        }
        
        // Récupérer toutes les unités
        const units = getAllUnits();
        console.log(`[dossierSoldat] Recherche de l'unité avec ID/nom ${unitId} parmi ${units.length} unités`);
        
        // Recherche par ID
        let unit = units.find(u => u.id === unitId);
        
        // Si non trouvé par ID, essayer de trouver par nom
        if (!unit) {
            unit = units.find(u => u.name === unitId || u.nom === unitId);
            if (unit) {
                console.log(`[dossierSoldat] Unité trouvée par son nom: ${unit.name || unit.nom} (ID: ${unit.id})`);
            }
        }
        
        console.log('[dossierSoldat] Unité trouvée:', unit);
        
        // Si unité trouvée, retourner son nom
        if (unit && (unit.name || unit.nom)) {
            const unitName = unit.name || unit.nom || 'Unité sans nom';
            console.log(`[dossierSoldat] Nom de l'unité trouvé: ${unitName}`);
            return unitName;
        }
        
        // Si l'ID ressemble à un nom d'unité, le retourner directement
        if (typeof unitId === 'string' && unitId.length > 3 && /[A-Za-z]/.test(unitId)) {
            console.log(`[dossierSoldat] Unité non trouvée dans la base, mais l'ID ressemble à un nom: ${unitId}`);
            return unitId;
        }
        
        // Si unité non trouvée, retourner une valeur par défaut
        console.log(`[dossierSoldat] Unité avec ID/nom ${unitId} non trouvée, retourne "Unité inconnue"`);
        return 'Unité inconnue';
    }
    
    /**
     * Initialise la page
     */
    function init() {
        setupTabNavigation();
        setupFormationsTabs();
        setupCloseButton();
        checkUrlParams();
    }
    
    /**
     * Configure la navigation par onglets pour les formations
     */
    function setupFormationTabs() {
        const formationTabButtons = document.querySelectorAll('.formation-tab-button');
        
        formationTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Désactiver tous les onglets
                formationTabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.formations-tab-pane').forEach(pane => pane.classList.remove('active'));
                
                // Activer l'onglet cliqué
                button.classList.add('active');
                const tabId = `formations-${button.dataset.tab}`;
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    /**
     * Configure les sous-onglets de formations dans le dossier soldat
     */
    function setupFormationsTabs() {
        console.log('[dossierSoldat] Configuration des sous-onglets de formations');
        const formationsTabButtons = document.querySelectorAll('.formations-tab-btn');
        const formationsTabPanes = document.querySelectorAll('.formations-tab-pane');
        
        if (formationsTabButtons.length === 0) {
            console.warn('[dossierSoldat] Aucun bouton d\'onglet de formations trouvé');
            return;
        }
        
        console.log(`[dossierSoldat] ${formationsTabButtons.length} boutons d'onglets de formations trouvés`);
        
        formationsTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log(`[dossierSoldat] Clic sur le sous-onglet de formations: ${button.dataset.tab}`);
                
                // Désactiver tous les sous-onglets
                formationsTabButtons.forEach(btn => btn.classList.remove('active'));
                formationsTabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Activer le sous-onglet cliqué
                button.classList.add('active');
                const tabId = button.dataset.tab;
                const tabPane = document.getElementById(`formations-${tabId}-tab`);
                
                if (tabPane) {
                    tabPane.classList.add('active');
                    console.log(`[dossierSoldat] Sous-onglet de formations activé: ${tabId}`);
                } else {
                    console.warn(`[dossierSoldat] Sous-onglet de formations non trouvé: formations-${tabId}-tab`);
                }
            });
        });
    }
    
    /**
     * Configure la navigation par onglets
     */
    function setupTabNavigation() {
        console.log('[dossierSoldat] Configuration de la navigation par onglets');
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log(`[dossierSoldat] Clic sur l'onglet: ${button.dataset.tab}`);
                
                // Désactiver tous les onglets
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                
                // Activer l'onglet cliqué
                button.classList.add('active');
                const tabId = button.dataset.tab;
                document.getElementById(`${tabId}-tab`).classList.add('active');
                
                // Si l'onglet formations est activé, initialiser les sous-onglets
                if (tabId === 'training') {
                    setupFormationsTabs();
                }
            });
        });
    }
    
    /**
     * Configure le bouton de fermeture du dossier
     */
    function setupCloseButton() {
        if (btnCloseDossier) {
            btnCloseDossier.addEventListener('click', () => {
                // Rediriger vers la page des soldats
                window.location.href = 'soldats.html';
            });
        }
    }
    
    /**
     * Vérifie les paramètres d'URL pour charger le bon soldat
     */
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const soldierId = urlParams.get('id');
        
        if (soldierId) {
            loadSoldierData(soldierId);
        } else {
            // Afficher un message si aucun soldat n'est spécifié
            if (loadingMessage) {
                loadingMessage.textContent = 'Aucun soldat spécifié. Veuillez sélectionner un soldat depuis la liste.';
            }
            
            // Rediriger vers la liste des soldats après 2 secondes
            setTimeout(() => {
                window.location.href = 'soldats.html';
            }, 2000);
        }
    }
    
    /**
     * Charge les données d'un soldat
     * @param {string} soldierId - L'ID du soldat à charger
     */
    function loadSoldierData(soldierId) {
        console.log(`[loadSoldierData] Chargement des données pour le soldat avec ID: ${soldierId}`);
        
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (soldierContainer) soldierContainer.classList.add('hidden');
        
        // Récupérer les données des soldats depuis la clé localStorage harmonisée
        const savedData = localStorage.getItem('eagleOperator_soldiers');
        if (!savedData) {
            console.error('[loadSoldierData] Aucune donnée de soldat trouvée dans localStorage');
            if (loadingMessage) {
                loadingMessage.textContent = 'Erreur: Aucune donnée de soldat disponible.';
            }
            return;
        }
        
        const soldiers = JSON.parse(savedData);
        const soldier = soldiers.find(s => s.id === soldierId);
        
        if (!soldier) {
            console.error(`[loadSoldierData] Soldat avec ID ${soldierId} non trouvé`);
            if (loadingMessage) {
                loadingMessage.textContent = `Erreur: Soldat avec ID ${soldierId} non trouvé.`;
            }
            return;
        }
        
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
        
        console.log(`[loadSoldierData] Données standardisées pour ${soldier.pseudo} (${soldier.matricule})`);
        
        // Stocker l'ID du soldat actuel
        currentSoldierId = soldierId;
        
        // Afficher les données du soldat
        displaySoldierData(soldier);
        
        // Afficher les formations du soldat
        displaySoldierFormations(soldier);
        
        // Afficher l'historique du soldat
        displaySoldierHistory(soldier);
        
        // Masquer le message de chargement et afficher le conteneur
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (soldierContainer) soldierContainer.classList.remove('hidden');
        
        console.log(`[loadSoldierData] Affichage complet des données du soldat ${soldier.pseudo} terminé`);
    }
    
    /**
     * Affiche les données du soldat dans le dossier
     * @param {Object} soldier - Données du soldat
     */
    function displaySoldierData(soldier) {
        console.log('Affichage des données du soldat:', soldier);
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
        
        console.log('[dossierSoldat] Données sécurisées du soldat:', safeData);
        
        // Vérifier si l'ID de l'unité est valide
        console.log('[dossierSoldat] ID de l\'unité du soldat:', safeData.unitId, 'Type:', typeof safeData.unitId);
        
        // Récupérer le nom de l'unité à partir de l'ID
        const unitName = getUnitNameById(safeData.unitId);
        console.log(`[dossierSoldat] Soldat ${safeData.pseudo} (${safeData.matricule}): unité=${safeData.unitId}, nom unité=${unitName}`);
        
        // Mettre à jour les champs du dossier
        document.getElementById('soldier-id').textContent = safeData.matricule || safeData.id;
        document.getElementById('soldier-name').textContent = `${safeData.grade ? safeData.grade + ' ' : ''}${safeData.pseudo}`;
        document.getElementById('soldier-status').textContent = safeData.status;
        
        // Afficher l'unité (nom au lieu de l'ID)
        const uniteElement = document.getElementById('soldier-unit');
        if (uniteElement) {
            if (safeData.unitId) {
                // Rendre le nom de l'unité cliquable
                uniteElement.innerHTML = `<a href="unites.html?id=${safeData.unitId}" class="clickable-link">${unitName}</a>`;
            } else {
                uniteElement.textContent = 'Non assigné';
            }
        }
        
        // Date d'incorporation
        const dateElement = document.getElementById('soldier-date');
        if (dateElement) {
            dateElement.textContent = formatDate(soldier.date_incorporation) || 'Inconnue';
        }
        
        // Photo du soldat (si disponible)
        const photoElement = document.getElementById('soldier-photo');
        if (photoElement) {
            if (soldier.photo) {
                photoElement.src = soldier.photo;
            } else {
                photoElement.src = '../assets/img/default-avatar.png';
            }
        }
        
        // Informations personnelles
        const personalInfoDiv = document.getElementById('personal-info');
        if (personalInfoDiv) {
            let personalInfoHTML = '';
            
            if (soldier.sexe) {
                personalInfoHTML += `<p><strong>Sexe:</strong> ${soldier.sexe}</p>`;
            }
            
            if (soldier.age) {
                personalInfoHTML += `<p><strong>Âge:</strong> ${soldier.age} ans</p>`;
            }
            
            if (soldier.nationalite) {
                personalInfoHTML += `<p><strong>Nationalité:</strong> ${soldier.nationalite}</p>`;
            }
            
            if (soldier.specialite) {
                personalInfoHTML += `<p><strong>Spécialité:</strong> ${soldier.specialite}</p>`;
            }
            
            personalInfoDiv.innerHTML = personalInfoHTML || '<p>Aucune information personnelle disponible.</p>';
        }
        
        // Afficher les formations du soldat
        displaySoldierFormations(soldier);
        
        // Missions effectuées
        const missionsDiv = document.getElementById('missions-list');
        if (missionsDiv) {
            if (soldier.missions && soldier.missions.length > 0) {
                let missionsHTML = '<ul>';
                soldier.missions.forEach(mission => {
                    // Rendre les noms de missions cliquables
                    missionsHTML += `<li><a href="missions.html?id=${mission.id}" class="clickable-link">${mission.nom}</a> - ${formatDate(mission.date)}</li>`;
                });
                missionsHTML += '</ul>';
                missionsDiv.innerHTML = missionsHTML;
            } else {
                missionsDiv.innerHTML = '<p>Aucune mission effectuée.</p>';
            }
        }
        
        // Progression (si c'est une recrue)
        if (soldier.statut === 'recrue') {
            const progressionContent = document.getElementById('progression-content');
            if (progressionContent && typeof loadRecruitProgression === 'function') {
                loadRecruitProgression(soldier.id, progressionContent);
            }
        } else {
            const progressionContent = document.getElementById('progression-content');
            if (progressionContent) {
                progressionContent.innerHTML = '<p>La progression n\'est disponible que pour les recrues.</p>';
            }
        }
        
        // Sanctions
        if (typeof displaySanctions === 'function') {
            displaySanctions(soldier);
        }
        
        // Historique
        if (typeof displayHistory === 'function') {
            displayHistory(soldier);
        }
        
        // Configurer les boutons d'action
        setupActionButtons(soldier);
    }
    
    /**
     * Configure les boutons d'action pour un soldat
     * @param {Object} soldier - Le soldat concerné
     */
    function setupActionButtons(soldier) {
        // Bouton d'édition
        const btnEditSoldier = document.getElementById('btn-edit-soldier');
        if (btnEditSoldier) {
            btnEditSoldier.addEventListener('click', () => {
                // Implémenter l'édition du soldat
                alert('Fonctionnalité d\'édition à venir');
            });
        }
        
        // Bouton de promotion
        const btnPromoteSoldier = document.getElementById('btn-promote-soldier');
        if (btnPromoteSoldier && typeof showPromotionDialog === 'function') {
            btnPromoteSoldier.addEventListener('click', () => {
                showPromotionDialog(soldier);
            });
        }
        
        // Bouton de changement de statut
        const btnChangeStatus = document.getElementById('btn-change-status');
        if (btnChangeStatus && typeof showStatusDialog === 'function') {
            btnChangeStatus.addEventListener('click', () => {
                showStatusDialog(soldier);
            });
        }
        
        // Bouton de réaffectation
        const btnReassign = document.getElementById('btn-reassign');
        if (btnReassign && typeof showReassignDialog === 'function') {
            btnReassign.addEventListener('click', () => {
                showReassignDialog(soldier);
            });
        }
        
        // Bouton d'ajout de sanction (déjà configuré dans sanctionManager.js)
    }
    
    /**
     * Formate une date au format JJ/MM/AAAA
     * @param {string} dateString - La date au format AAAA-MM-JJ
     * @returns {string} La date formatée
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Si la date est invalide, retourner la chaîne d'origine
        
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    /**
     * Récupère toutes les unités depuis le localStorage
     * @returns {Array} Liste des unités
     */
    function getAllUnits() {
        try {
            // Utiliser la clé harmonisée eagleOperator_units
            const units = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
            return Array.isArray(units) ? units : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des unités:', error);
            return [];
        }
    }
    
    /**
     * Récupère le nom d'une unité à partir de son ID
     * @param {string} unitId - ID de l'unité
     * @returns {string} Nom de l'unité ou 'Sans unité' si non trouvée
     */
    function getUnitNameById(unitId) {
        if (!unitId) return 'Sans unité';
        
        try {
            const units = getAllUnits();
            const unit = units.find(u => u.id === unitId);
            
            if (unit && unit.name) {
                console.log(`Unité trouvée dans dossierSoldat.js: ${unit.name} (ID: ${unitId})`);
                return unit.name;
            } else {
                console.warn(`Unité non trouvée dans dossierSoldat.js pour l'ID: ${unitId}`);
                return 'Unité inconnue';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du nom de l\'unité:', error);
            return 'Sans unité';
        }
    }
    
    /**
     * Affiche les formations du soldat (assignées, validées, échouées)
     * @param {Object} soldier - Le soldat dont on veut afficher les formations
     */
    function displaySoldierFormations(soldier) {
        // Standardiser les propriétés du soldat
        const pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
        const matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
        const grade = soldier.grade || soldier.rank || 'Soldat';
        
        console.log(`[dossierSoldat] Début de displaySoldierFormations pour le soldat: ${pseudo} (${matricule})`);
        
        // Récupérer les formations depuis le localStorage
        const formations = JSON.parse(localStorage.getItem('eagleOperator_formations') || '[]');
        console.log(`[dossierSoldat] ${formations.length} formations récupérées depuis localStorage`);
        
        // Vérifier si le soldat a des formations
        if (!soldier.formations) {
            console.log(`[dossierSoldat] Le soldat ${pseudo} n'a pas de formations`);
            soldier.formations = [];
        } else {
            console.log(`[dossierSoldat] Le soldat ${pseudo} a ${soldier.formations.length} formations:`, soldier.formations);
        }
        
        // Récupérer les formations du soldat
        const soldierFormations = soldier.formations || [];
        
        // Harmoniser les propriétés des formations du soldat
        soldierFormations.forEach(formation => {
            // Standardiser le statut
            if (formation.status && !formation.statut) {
                formation.statut = formation.status;
            } else if (formation.statut && !formation.status) {
                formation.status = formation.statut;
            }
            
            // Standardiser le nom
            if (formation.name && !formation.nom) {
                formation.nom = formation.name;
            } else if (formation.nom && !formation.name) {
                formation.name = formation.nom;
            }
        });
        
        // Diviser les formations par statut
        const assignedFormations = soldierFormations.filter(f => 
            f.statut === 'assignee' || f.status === 'assigned' || f.status === 'assignee' || f.statut === 'assigned');
        const completedFormations = soldierFormations.filter(f => 
            f.statut === 'validee' || f.status === 'completed' || f.status === 'validee' || f.statut === 'completed');
        const failedFormations = soldierFormations.filter(f => 
            f.statut === 'echouee' || f.statut === 'absent' || 
            f.status === 'failed' || f.status === 'absent' || 
            f.status === 'echouee' || f.statut === 'failed');
        
        console.log(`[dossierSoldat] Formations assignées: ${assignedFormations.length}`);
        console.log(`[dossierSoldat] Formations validées: ${completedFormations.length}`);
        console.log(`[dossierSoldat] Formations échouées/absences: ${failedFormations.length}`);
        
        // Afficher les formations assignées
        displayFormationsByStatus('assigned', assignedFormations, formations, soldier);
        
        // Afficher les formations validées
        displayFormationsByStatus('completed', completedFormations, formations, soldier);
        
        // Afficher les formations échouées/absences
        displayFormationsByStatus('failed', failedFormations, formations, soldier);
    }
    
    /**
     * Affiche les formations d'un soldat selon leur statut
     * @param {string} statusType - Type de statut ('assigned', 'completed', 'failed')
     * @param {Array} soldierFormations - Formations du soldat avec ce statut
     * @param {Array} allFormations - Toutes les formations disponibles
     * @param {Object} soldier - Le soldat concerné
     */
    function displayFormationsByStatus(statusType, soldierFormations, allFormations, soldier) {
        console.log(`[dossierSoldat] Début de displayFormationsByStatus pour le statut: ${statusType}`);
        
        const containerID = `formations-${statusType}-list`;
        const container = document.getElementById(containerID);
        
        if (!container) {
            console.warn(`[dossierSoldat] Conteneur ${containerID} non trouvé dans le DOM`);
            return;
        }
        
        if (soldierFormations.length === 0) {
            let message = '';
            switch (statusType) {
                case 'assigned':
                    message = 'Aucune formation assignée.';
                    break;
                case 'completed':
                    message = 'Aucune formation validée.';
                    break;
                case 'failed':
                    message = 'Aucune formation échouée ou absence.';
                    break;
            }
            console.log(`[dossierSoldat] Aucune formation pour le statut ${statusType}`);
            container.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
            return;
        }
        
        console.log(`[dossierSoldat] ${soldierFormations.length} formations trouvées pour le statut ${statusType}`);
        let html = '';
        
        soldierFormations.forEach(soldierFormation => {
            console.log(`[dossierSoldat] Traitement de la formation:`, soldierFormation);
            
            // Trouver les détails complets de la formation
            let formationDetails = allFormations.find(f => f.id === soldierFormation.formationId);
            
            if (!formationDetails) {
                console.warn(`[dossierSoldat] Formation avec ID ${soldierFormation.formationId} non trouvée dans les formations globales`);
                
                // Utiliser les données de la formation du soldat si la formation globale n'est pas trouvée
                formationDetails = {
                    id: soldierFormation.formationId || 'unknown',
                    nom: soldierFormation.nom || soldierFormation.name || 'Formation inconnue',
                    name: soldierFormation.name || soldierFormation.nom || 'Formation inconnue',
                    description: 'Détails non disponibles',
                    type: soldierFormation.type || 'technique',
                    instructor: soldierFormation.instructor || 'Non spécifié',
                    date: soldierFormation.date || new Date().toISOString().split('T')[0]
                };
                console.log(`[dossierSoldat] Création d'un objet formation de remplacement:`, formationDetails);
            } else {
                console.log(`[dossierSoldat] Formation trouvée dans les formations globales:`, formationDetails);
            }
            
            // Harmoniser les propriétés (certaines formations utilisent 'name', d'autres 'nom')
            if (!formationDetails.nom && formationDetails.name) {
                formationDetails.nom = formationDetails.name;
            } else if (!formationDetails.name && formationDetails.nom) {
                formationDetails.name = formationDetails.nom;
            }
            
            // Utiliser le nom de la formation depuis les données du soldat si disponible
            if (soldierFormation.nom && !formationDetails.nom) {
                formationDetails.nom = soldierFormation.nom;
                formationDetails.name = soldierFormation.nom;
            } else if (soldierFormation.name && !formationDetails.name) {
                formationDetails.name = soldierFormation.name;
                formationDetails.nom = soldierFormation.name;
            }
            
            // S'assurer que les autres propriétés sont définies
            formationDetails.type = formationDetails.type || soldierFormation.type || 'technique';
            formationDetails.instructor = formationDetails.instructor || soldierFormation.instructor || 'Non spécifié';
            formationDetails.date = formationDetails.date || soldierFormation.date || new Date().toISOString().split('T')[0];
            formationDetails.description = formationDetails.description || soldierFormation.description || 'Aucune description disponible';
            
            console.log(`[dossierSoldat] Formation prête pour affichage: ${formationDetails.nom || formationDetails.name || 'Inconnue'} (ID: ${formationDetails.id})`);
            
            // Créer l'élément HTML pour la formation
            html += createFormationItemHTML(formationDetails, soldierFormation, statusType, soldier.id);
        });
        
        container.innerHTML = html;
        console.log(`[dossierSoldat] Contenu HTML généré et inséré dans le conteneur ${containerID}`);
        
        // Ajouter les écouteurs d'événements pour les boutons d'action
        if (statusType === 'assigned') {
            setupFormationActionButtons(container, soldier.id);
            console.log(`[dossierSoldat] Écouteurs d'événements configurés pour les boutons d'action`);
        }
    }
    
    /**
     * Crée le HTML pour un élément de formation
     * @param {Object} formation - Détails de la formation
     * @param {Object} soldierFormation - Données de la formation pour ce soldat
     * @param {string} statusType - Type de statut ('assigned', 'completed', 'failed')
     * @param {string} soldierId - ID du soldat
     * @returns {string} HTML de l'élément de formation
     */
    function createFormationItemHTML(formation, soldierFormation, statusType, soldierId) {
        console.log(`[dossierSoldat] Création de l'HTML pour la formation:`, formation.id, `statut: ${statusType}`);
        
        // Standardiser les propriétés de la formation
        const formationId = formation.id || soldierFormation.formationId || 'unknown';
        
        // Standardiser le nom de la formation
        let formationName = formation.nom || formation.name || soldierFormation.nom || soldierFormation.name || 'Formation inconnue';
        formation.name = formationName;
        formation.nom = formationName;
        
        // Standardiser le statut de la formation dans les données du soldat
        if (soldierFormation.status && !soldierFormation.statut) {
            soldierFormation.statut = soldierFormation.status;
        } else if (soldierFormation.statut && !soldierFormation.status) {
            soldierFormation.status = soldierFormation.statut;
        }
        
        // Standardiser le nom de la formation dans les données du soldat
        if (soldierFormation.name && !soldierFormation.nom) {
            soldierFormation.nom = soldierFormation.name;
        } else if (soldierFormation.nom && !soldierFormation.name) {
            soldierFormation.name = soldierFormation.nom;
        }
        
        // Récupérer la date de la formation
        const formationDate = soldierFormation.date || soldierFormation.date_validation || new Date().toISOString();
        
        // Récupérer le type de formation et sa description
        const formationType = formation.type || 'technique';
        const formationDescription = formation.description || 'Aucune description disponible';
        const formationInstructor = formation.instructeur || formation.instructor || 'Non assigné';
        
        // Déterminer le badge de statut et les actions disponibles
        let statusBadgeClass = '';
        let statusText = '';
        let actionsHTML = '';
        
        switch (statusType) {
            case 'assigned':
                statusBadgeClass = 'info';
                statusText = 'Assignée';
                actionsHTML = `
                    <div class="formation-card-footer">
                        <button class="military-btn gold-btn validate" data-action="validate" data-formation-id="${formationId}" data-soldier-id="${soldierId}">Valider</button>
                        <button class="military-btn fail" data-action="fail" data-formation-id="${formationId}" data-soldier-id="${soldierId}">Échouer</button>
                        <button class="military-btn absent" data-action="absent" data-formation-id="${formationId}" data-soldier-id="${soldierId}">Absent</button>
                    </div>
                `;
                break;
            case 'completed':
                statusBadgeClass = 'success';
                statusText = 'Validée';
                break;
            case 'failed':
                if (soldierFormation.statut === 'echouee' || soldierFormation.status === 'echouee' || 
                    soldierFormation.statut === 'failed' || soldierFormation.status === 'failed') {
                    statusBadgeClass = 'danger';
                    statusText = 'Échouée';
                } else {
                    statusBadgeClass = 'warning';
                    statusText = 'Absent';
                }
                break;
        }
        
        // Créer l'élément HTML avec le style des cartes de formation
        return `
            <div class="formation-card" data-formation-id="${formationId}">
                <div class="formation-card-header">
                    <h3>${formationName}</h3>
                    <span class="formation-type-badge ${formationType}">${formationType}</span>
                </div>
                <div class="formation-card-body">
                    <div class="formation-description">${formationDescription}</div>
                    <div class="formation-metadata">
                        <div class="formation-metadata-item">
                            <span class="metadata-label">Statut:</span>
                            <span class="metadata-value">
                                <span class="formation-status-badge status-${statusBadgeClass}">${statusText}</span>
                            </span>
                        </div>
                        <div class="formation-metadata-item">
                            <span class="metadata-label">Date:</span>
                            <span class="metadata-value">${formatDate(formationDate)}</span>
                        </div>
                        <div class="formation-metadata-item">
                            <span class="metadata-label">Instructeur:</span>
                            <span class="metadata-value">${formationInstructor}</span>
                        </div>
                    </div>
                </div>
                ${actionsHTML}
            </div>
        `;
    }
    
    /**
     * Formate une date au format français (JJ/MM/AAAA)
     * @param {string} dateString - Date au format ISO ou autre format compréhensible par Date
     * @returns {string} Date formatée
     */
    function formatDate(dateString) {
        if (!dateString) return 'Date non spécifiée';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Date invalide';
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('[dossierSoldat] Erreur lors du formatage de la date:', error);
            return 'Erreur de date';
        }
    }
    
    /**
     * Configure les boutons d'action pour les formations
     * @param {HTMLElement} container - Conteneur des formations
     * @param {string} soldierId - ID du soldat
     */
    function setupFormationActionButtons(container, soldierId) {
        console.log(`[dossierSoldat] Configuration des boutons d'action pour les formations du soldat ${soldierId}`);
        
        // Boutons de validation
        const validateButtons = container.querySelectorAll('.military-btn.gold-btn.validate, .formation-action-btn.validate');
        console.log(`[dossierSoldat] ${validateButtons.length} boutons de validation trouvés`);
        validateButtons.forEach(button => {
            button.addEventListener('click', () => {
                const formationId = button.dataset.formationId;
                console.log(`[dossierSoldat] Clic sur le bouton de validation pour la formation ${formationId}`);
                updateFormationStatus(soldierId, formationId, 'validee');
            });
        });
        
        // Boutons d'échec
        const failButtons = container.querySelectorAll('.military-btn.fail, .formation-action-btn.fail');
        console.log(`[dossierSoldat] ${failButtons.length} boutons d'échec trouvés`);
        failButtons.forEach(button => {
            button.addEventListener('click', () => {
                const formationId = button.dataset.formationId;
                console.log(`[dossierSoldat] Clic sur le bouton d'échec pour la formation ${formationId}`);
                updateFormationStatus(soldierId, formationId, 'echouee');
            });
        });
        
        // Boutons d'absence
        const absentButtons = container.querySelectorAll('.military-btn.absent, .formation-action-btn.absent');
        console.log(`[dossierSoldat] ${absentButtons.length} boutons d'absence trouvés`);
        absentButtons.forEach(button => {
            button.addEventListener('click', () => {
                const formationId = button.dataset.formationId;
                console.log(`[dossierSoldat] Clic sur le bouton d'absence pour la formation ${formationId}`);
                updateFormationStatus(soldierId, formationId, 'absent');
            });
        });
    }
    
    /**
     * Met à jour le statut d'une formation pour un soldat
     * @param {string} soldierId - ID du soldat
     * @param {string} formationId - ID de la formation
     * @param {string} newStatus - Nouveau statut ('validee', 'echouee', 'absent')
     */
    function updateFormationStatus(soldierId, formationId, newStatus) {
        console.log(`[dossierSoldat] Début de la mise à jour du statut de la formation ${formationId} pour le soldat ${soldierId} à ${newStatus}`);
        
        // Récupérer les données du soldat
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
        
        if (soldierIndex === -1) {
            console.error(`[updateFormationStatus] Soldat avec ID ${soldierId} non trouvé`);
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
        
        console.log(`[updateFormationStatus] Soldat trouvé: ${soldier.pseudo} (${soldier.matricule})`);
        
        // Vérifier si le soldat a des formations
        if (!soldier.formations) {
            console.log(`[updateFormationStatus] Le soldat ${soldier.pseudo} n'a pas de formations, initialisation d'un tableau vide`);
            soldier.formations = [];
            return;
        }
        
        // Trouver l'index de la formation
        const formationIndex = soldier.formations.findIndex(f => f.formationId === formationId);
        
        if (formationIndex === -1) {
            console.error(`[updateFormationStatus] Formation avec ID ${formationId} non trouvée pour le soldat ${soldier.pseudo}`);
            return;
        }
        
        // Mettre à jour le statut de la formation
        soldier.formations[formationIndex].statut = newStatus;
        soldier.formations[formationIndex].status = newStatus; // Pour compatibilité
        soldier.formations[formationIndex].date_validation = new Date().toISOString();
        
        console.log(`[updateFormationStatus] Statut de la formation mis à jour à ${newStatus}`);
        
        // Ajouter à l'historique du soldat
        if (!soldier.historique) {
            soldier.historique = [];
        }
        
        // Support pour la propriété standardisée history
        if (!soldier.history) {
            soldier.history = soldier.historique;
        }
        
        // Récupérer les détails de la formation
        const formations = JSON.parse(localStorage.getItem('eagleOperator_formations') || '[]');
        let formation = formations.find(f => f.id === formationId) || { 
            id: formationId,
            nom: 'Formation inconnue',
            name: 'Formation inconnue'
        };
        
        // Standardiser le nom de la formation
        let formationName = formation.nom || formation.name || 
                          soldier.formations[formationIndex].nom || 
                          soldier.formations[formationIndex].name || 
                          'Formation inconnue';
        
        // Mettre à jour les noms de formation dans toutes les sources
        formation.nom = formationName;
        formation.name = formationName;
        soldier.formations[formationIndex].nom = formationName;
        soldier.formations[formationIndex].name = formationName;
        
        console.log(`[updateFormationStatus] Nom de formation standardisé: ${formationName}`);
        
        // Déterminer le texte du statut pour l'historique
        let statusText = '';
        switch (newStatus) {
            case 'validee':
                statusText = 'validé';
                break;
            case 'echouee':
                statusText = 'échoué';
                break;
            case 'absent':
                statusText = 'absent';
                break;
            default:
                statusText = newStatus;
        }
        
        // Ajouter l'entrée à l'historique avec propriétés standardisées
        const historyEntry = {
            date: new Date().toISOString(),
            action: `Formation "${formationName}" ${statusText}`,
            type: 'formation',
            description: `Formation "${formationName}" ${statusText}` // Pour compatibilité
        };
        
        // Ajouter à historique (propriété existante)
        soldier.historique.push(historyEntry);
        
        // Synchroniser avec history (propriété standardisée)
        if (!soldier.history) {
            soldier.history = [...soldier.historique];
        } else {
            soldier.history.push(historyEntry);
        }
        
        console.log(`[updateFormationStatus] Entrée ajoutée à l'historique:`, historyEntry);
        
        // Mettre à jour le soldat dans le tableau
        soldiers[soldierIndex] = soldier;
        
        // Sauvegarder les modifications
        localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
        console.log(`[updateFormationStatus] Données du soldat ${soldier.pseudo} mises à jour dans le localStorage`);
        
        // Rafraîchir l'affichage
        displaySoldierFormations(soldier);
        displaySoldierHistory(soldier);
        
        // Afficher une notification
        showNotification(`Statut de la formation mis à jour : ${statusText}`, 'success');
    }
    
    /**
     * Affiche l'historique du soldat
     * @param {Object} soldier - Données du soldat
     */
    function displaySoldierHistory(soldier) {
        console.log(`[displaySoldierHistory] Affichage de l'historique pour le soldat:`, soldier.id);
        
        // Standardiser les propriétés du soldat
        const pseudo = soldier.pseudo || soldier.lastName || soldier.nom || 'Sans nom';
        const matricule = soldier.matricule || soldier.id.substring(0, 6).toUpperCase();
        const grade = soldier.grade || soldier.rank || 'Soldat';
        
        // Récupérer le conteneur de l'historique
        const historyContainer = document.getElementById('soldier-history');
        
        if (!historyContainer) {
            console.warn(`[displaySoldierHistory] Conteneur d'historique non trouvé dans le DOM`);
            return;
        }
        
        // Récupérer l'historique du soldat (support pour les deux propriétés)
        let soldierHistory = [];
        
        // Vérifier si le soldat a un historique dans l'une des deux propriétés
        if (soldier.history && Array.isArray(soldier.history) && soldier.history.length > 0) {
            console.log(`[displaySoldierHistory] Le soldat ${pseudo} a ${soldier.history.length} entrées dans history`);
            soldierHistory = [...soldier.history];
        } else if (soldier.historique && Array.isArray(soldier.historique) && soldier.historique.length > 0) {
            console.log(`[displaySoldierHistory] Le soldat ${pseudo} a ${soldier.historique.length} entrées dans historique`);
            soldierHistory = [...soldier.historique];
        } else {
            console.log(`[displaySoldierHistory] Le soldat ${pseudo} n'a pas d'historique`);
            historyContainer.innerHTML = '<p>Aucun événement dans l\'historique.</p>';
            return;
        }
        
        console.log(`[displaySoldierHistory] Le soldat ${pseudo} a ${soldierHistory.length} entrées dans l'historique`);
        
        // Trier l'historique par date (du plus récent au plus ancien)
        const sortedHistory = soldierHistory.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Générer le HTML pour l'historique
        let html = '<div class="history-list">';
        
        sortedHistory.forEach(entry => {
            const date = formatDate(entry.date);
            const action = entry.action || entry.description || 'Action inconnue';
            
            html += `
                <div class="history-item">
                    <div class="history-date">${date}</div>
                    <div class="history-action">${action}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Mettre à jour le conteneur
        historyContainer.innerHTML = html;
        console.log(`[displaySoldierHistory] Historique affiché avec ${sortedHistory.length} entrées`);
    }
    
    // Initialiser la page
    init();
    
    // Initialiser le gestionnaire de sanctions
    if (typeof initSanctionManager === 'function') {
        initSanctionManager();
    }
});
