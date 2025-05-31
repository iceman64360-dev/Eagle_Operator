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
     * Initialise la page
     */
    function init() {
        setupTabNavigation();
        setupCloseButton();
        checkUrlParams();
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
     * Affiche les données d'un soldat
     * @param {Object} soldier - Le soldat à afficher
     */
    function displaySoldierData(soldier) {
        // Informations de base
        document.getElementById('soldier-name').textContent = soldier.pseudo || 'Sans nom';
        document.getElementById('soldier-id').textContent = soldier.id || '';
        document.getElementById('soldier-grade').textContent = soldier.grade || '';
        document.getElementById('soldier-statut').textContent = soldier.statut || '';
        
        // Afficher l'unité (nom au lieu de l'ID)
        const uniteElement = document.getElementById('soldier-unite');
        if (uniteElement) {
            if (soldier.unité) {
                // Récupérer les données des unités pour afficher le nom
                const unitesData = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
                const unite = unitesData.find(u => u.id_unite === soldier.unité);
                uniteElement.textContent = unite ? unite.nom : soldier.unité;
                
                // Rendre le nom de l'unité cliquable
                uniteElement.innerHTML = `<a href="unites.html?id=${soldier.unité}" class="clickable-link">${uniteElement.textContent}</a>`;
            } else {
                uniteElement.textContent = 'Non assigné';
            }
        }
        
        document.getElementById('soldier-date').textContent = formatDate(soldier.date_incorporation) || 'Inconnue';
        
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
        
        // Formations suivies
        const formationsDiv = document.getElementById('formations-list');
        if (formationsDiv) {
            if (soldier.formations_suivies && soldier.formations_suivies.length > 0) {
                let formationsHTML = '<ul>';
                soldier.formations_suivies.forEach(formation => {
                    // Rendre les noms de formations cliquables
                    formationsHTML += `<li><a href="formations.html?id=${formation.id}" class="clickable-link">${formation.nom}</a> - ${formatDate(formation.date)}</li>`;
                });
                formationsHTML += '</ul>';
                formationsDiv.innerHTML = formationsHTML;
            } else {
                formationsDiv.innerHTML = '<p>Aucune formation suivie.</p>';
            }
        }
        
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
        return date.toLocaleDateString('fr-FR');
    }
    
    // Initialiser la page
    init();
    
    // Initialiser le gestionnaire de sanctions
    if (typeof initSanctionManager === 'function') {
        initSanctionManager();
    }
});
