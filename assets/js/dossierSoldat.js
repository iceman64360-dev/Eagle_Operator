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
     * Récupère le nom d'une unité à partir de son ID
     * @param {string} unitId - ID de l'unité
     * @returns {string} Nom de l'unité ou valeur par défaut si non trouvée
     */
    function getUnitNameById(unitId) {
        console.log('[dossierSoldat] Début de getUnitNameById avec ID:', unitId);
        
        // Si pas d'ID d'unité, retourner 'Sans unité'
        if (!unitId) {
            console.log('[dossierSoldat] ID d\'unité vide, retourne "Sans unité"');
            return 'Sans unité';
        }
        
        // Récupérer toutes les unités
        const units = getAllUnits();
        console.log(`[dossierSoldat] Recherche de l'unité avec ID ${unitId} parmi ${units.length} unités:`, units);
        
        // Chercher l'unité correspondante
        const unit = units.find(u => u.id === unitId);
        console.log('[dossierSoldat] Unité trouvée:', unit);
        
        // Si unité trouvée, retourner son nom
        if (unit) {
            const unitName = unit.name || unit.nom || 'Unité sans nom';
            console.log(`[dossierSoldat] Nom de l'unité ${unitId} trouvé: ${unitName}`);
            return unitName;
        }
        
        // Si unité non trouvée, retourner une valeur par défaut
        console.log(`[dossierSoldat] Unité avec ID ${unitId} non trouvée, retourne "Unité inconnue"`);
        return 'Unité inconnue';
    }
    
    /**
     * Initialise la page
     */
    function init() {
        setupTabNavigation();
        setupFormationTabs();
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
     * Configure la navigation par onglets
     */
    function setupTabNavigation() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Désactiver tous les onglets
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                
                // Activer l'onglet cliqué
                button.classList.add('active');
                const tabId = `tab-${button.dataset.tab}`;
                document.getElementById(tabId).classList.add('active');
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
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (soldierContainer) soldierContainer.classList.add('hidden');
        
        // Récupérer les données des soldats
        const savedData = localStorage.getItem('eagleOperator_soldiers');
        if (!savedData) {
            console.error('Aucune donnée de soldat trouvée dans localStorage');
            if (loadingMessage) {
                loadingMessage.textContent = 'Erreur: Aucune donnée de soldat disponible.';
            }
            return;
        }
        
        const soldiers = JSON.parse(savedData);
        const soldier = soldiers.find(s => s.id === soldierId);
        
        if (!soldier) {
            console.error(`Soldat avec ID ${soldierId} non trouvé`);
            if (loadingMessage) {
                loadingMessage.textContent = `Erreur: Soldat avec ID ${soldierId} non trouvé.`;
            }
            return;
        }
        
        // Stocker l'ID du soldat actuel
        currentSoldierId = soldierId;
        
        // Afficher les données du soldat
        displaySoldierData(soldier);
        
        // Masquer le message de chargement et afficher le conteneur
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (soldierContainer) soldierContainer.classList.remove('hidden');
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
            firstName: soldier.firstName || soldier.prenom || '',
            lastName: soldier.lastName || soldier.nom || 'Sans nom',
            rank: soldier.rank || soldier.grade || '',
            unitId: soldier.unit || soldier.unité || soldier.unite || null,
            status: soldier.status || soldier.statut || 'Inconnu'
        };
        
        console.log('Données sécurisées du soldat:', safeData);
        
        // Vérifier si l'ID de l'unité est valide
        console.log('ID de l\'unité du soldat:', safeData.unitId, 'Type:', typeof safeData.unitId);
        
        // Récupérer le nom de l'unité à partir de l'ID
        const unitName = getUnitNameById(safeData.unitId);
        console.log(`Soldat ${safeData.lastName}: unité=${safeData.unitId}, nom unité=${unitName}`);
        
        // Mettre à jour les champs du dossier
        document.getElementById('soldier-id').textContent = safeData.id;
        document.getElementById('soldier-name').textContent = `${safeData.rank ? safeData.rank + ' ' : ''}${safeData.lastName} ${safeData.firstName}`;
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
        console.log('[dossierSoldat] Début de displaySoldierFormations pour le soldat:', soldier.id);
        
        // Récupérer les formations depuis le localStorage
        const formations = JSON.parse(localStorage.getItem('eagleOperator_formations') || '[]');
        console.log(`[dossierSoldat] ${formations.length} formations récupérées depuis localStorage`);
        
        // Vérifier si le soldat a des formations
        if (!soldier.formations) {
            console.log('[dossierSoldat] Le soldat n\'a pas de formations');
            soldier.formations = [];
        } else {
            console.log(`[dossierSoldat] Le soldat a ${soldier.formations.length} formations:`, soldier.formations);
        }
        
        // Récupérer les formations du soldat
        const soldierFormations = soldier.formations || [];
        
        // Diviser les formations par statut
        const assignedFormations = soldierFormations.filter(f => f.statut === 'assignee');
        const completedFormations = soldierFormations.filter(f => f.statut === 'validee');
        const failedFormations = soldierFormations.filter(f => 
            f.statut === 'echouee' || f.statut === 'absent');
        
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
            container.innerHTML = `<p>${message}</p>`;
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
                    description: 'Détails non disponibles'
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
        let statusBadge = '';
        let actionsHTML = '';
        
        // Déterminer le badge de statut et les actions disponibles
        switch (statusType) {
            case 'assigned':
                statusBadge = '<span class="formation-status-badge status-assigned">Assignée</span>';
                actionsHTML = `
                    <div class="formation-actions">
                        <button class="formation-action-btn validate" data-action="validate" data-formation-id="${formation.id}" data-soldier-id="${soldierId}">Valider</button>
                        <button class="formation-action-btn fail" data-action="fail" data-formation-id="${formation.id}" data-soldier-id="${soldierId}">Échouer</button>
                        <button class="formation-action-btn absent" data-action="absent" data-formation-id="${formation.id}" data-soldier-id="${soldierId}">Absent</button>
                    </div>
                `;
                break;
            case 'completed':
                statusBadge = '<span class="formation-status-badge status-completed">Validée</span>';
                break;
            case 'failed':
                if (soldierFormation.statut === 'echouee') {
                    statusBadge = '<span class="formation-status-badge status-failed">Échouée</span>';
                } else {
                    statusBadge = '<span class="formation-status-badge status-absent">Absent</span>';
                }
                break;
        }
        
        // S'assurer que les propriétés nécessaires existent
        const formationId = formation.id || soldierFormation.formationId || 'unknown';
        const formationName = formation.nom || formation.name || soldierFormation.nom || 'Formation inconnue';
        const formationDate = soldierFormation.date || new Date().toISOString();
        
        // Créer l'élément HTML
        return `
            <div class="formation-item" data-formation-id="${formationId}">
                <div class="formation-info">
                    <div class="formation-title">
                        <a href="formations.html?id=${formationId}" class="clickable-link">${formationName}</a>
                    </div>
                    <div class="formation-date">
                        Date: ${formatDate(formationDate)}
                    </div>
                </div>
                <div class="formation-status">
                    ${statusBadge}
                </div>
                ${actionsHTML}
            </div>
        `;
    }
    
    /**
     * Configure les boutons d'action pour les formations
     * @param {HTMLElement} container - Conteneur des formations
     * @param {string} soldierId - ID du soldat
     */
    function setupFormationActionButtons(container, soldierId) {
        // Boutons de validation
        const validateButtons = container.querySelectorAll('.formation-action-btn.validate');
        validateButtons.forEach(button => {
            button.addEventListener('click', () => {
                const formationId = button.dataset.formationId;
                updateFormationStatus(soldierId, formationId, 'validee');
            });
        });
        
        // Boutons d'échec
        const failButtons = container.querySelectorAll('.formation-action-btn.fail');
        failButtons.forEach(button => {
            button.addEventListener('click', () => {
                const formationId = button.dataset.formationId;
                updateFormationStatus(soldierId, formationId, 'echouee');
            });
        });
        
        // Boutons d'absence
        const absentButtons = container.querySelectorAll('.formation-action-btn.absent');
        absentButtons.forEach(button => {
            button.addEventListener('click', () => {
                const formationId = button.dataset.formationId;
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
        // Récupérer les données des soldats
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
        
        if (soldierIndex === -1) {
            console.error(`Soldat avec ID ${soldierId} non trouvé`);
            return;
        }
        
        const soldier = soldiers[soldierIndex];
        
        // Initialiser le tableau des formations si nécessaire
        if (!soldier.formations) {
            soldier.formations = [];
        }
        
        // Trouver la formation dans les formations du soldat
        const formationIndex = soldier.formations.findIndex(f => f.formationId === formationId);
        
        if (formationIndex === -1) {
            console.error(`Formation avec ID ${formationId} non trouvée pour le soldat ${soldierId}`);
            return;
        }
        
        // Mettre à jour le statut de la formation
        soldier.formations[formationIndex].statut = newStatus;
        soldier.formations[formationIndex].date_validation = new Date().toISOString();
        
        // Ajouter à l'historique du soldat
        if (!soldier.historique) {
            soldier.historique = [];
        }
        
        // Récupérer les détails de la formation
        const formations = JSON.parse(localStorage.getItem('eagleOperator_formations') || '[]');
        let formation = formations.find(f => f.id === formationId) || { 
            id: formationId,
            nom: 'Formation inconnue',
            name: 'Formation inconnue'
        };
        
        // Harmoniser les propriétés (certaines formations utilisent 'name', d'autres 'nom')
        if (!formation.nom && formation.name) {
            formation.nom = formation.name;
        } else if (!formation.name && formation.nom) {
            formation.name = formation.nom;
        }
        
        // Utiliser le nom de la formation depuis les données du soldat si disponible
        const soldierFormation = soldier.formations[formationIndex];
        if (soldierFormation.nom) {
            formation.nom = soldierFormation.nom;
            formation.name = soldierFormation.nom;
        }
        
        console.log(`Mise à jour du statut de la formation ${formation.nom || formation.name} pour le soldat ${soldier.lastName} à ${newStatus}`);
        
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
        }
        
        const eventDescription = `A ${statusText} la formation "${formation.nom || formation.name}"`;
        
        // Mettre à jour historique (ancienne structure)
        soldier.historique.push({
            date: new Date().toISOString(),
            type: 'formation',
            description: eventDescription
        });
        
        // Mettre à jour history (nouvelle structure) pour compatibilité
        if (!soldier.history) {
            soldier.history = [];
        }
        
        soldier.history.push({
            date: new Date().toISOString(),
            type: 'formation',
            event: eventDescription
        });
        
        // Sauvegarder les modifications
        soldiers[soldierIndex] = soldier;
        localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
        
        // Mettre à jour l'affichage
        displaySoldierFormations(soldier);
        
        // Mettre à jour l'historique si affiché
        if (typeof displayHistory === 'function') {
            displayHistory(soldier);
        }
    }
    
    // Initialiser la page
    init();
    
    // Initialiser le gestionnaire de sanctions
    if (typeof initSanctionManager === 'function') {
        initSanctionManager();
    }
});
