// progressionManager.js - Gestion de la progression des recrues

// Variable globale pour stocker les données des soldats
let allSoldiersData = [];

// Fonction pour charger les données des soldats
function loadSoldiersData() {
    // Utiliser la clé harmonisée eagleOperator_soldiers
    const data = localStorage.getItem('eagleOperator_soldiers');
    allSoldiersData = data ? JSON.parse(data) : [];
    return allSoldiersData;
}

// Fonction pour sauvegarder les soldats dans le localStorage
function saveSoldiersToStorage() {
    // Utiliser la clé harmonisée eagleOperator_soldiers
    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(allSoldiersData));
}

// Fonction pour mettre à jour l'affichage de la progression d'une recrue
function updateProgressionDisplay(soldier) {
    if (!soldier || !soldier.progression_recrue) return;
    
    const progression = soldier.progression_recrue;
    let completedSteps = 0;
    const totalSteps = 4; // Nombre total d'étapes
    
    // Formation Initiale (2 semaines)
    const stepFormationInitiale = document.getElementById('step-formation-initiale');
    updateStepStatus(stepFormationInitiale, progression.formation_initiale);
    document.getElementById('formation-initiale-status').textContent = getStatusText(progression.formation_initiale);
    document.getElementById('formation-initiale-debut').textContent = progression.formation_initiale.date_debut || '-';
    document.getElementById('formation-initiale-fin').textContent = progression.formation_initiale.date_fin || '-';
    
    // Calculer la date de fin prévue (2 semaines après la date de début)
    if (progression.formation_initiale.date_debut) {
        const dateDebut = new Date(progression.formation_initiale.date_debut);
        const dateFinPrevue = new Date(dateDebut);
        dateFinPrevue.setDate(dateDebut.getDate() + 14); // +14 jours (2 semaines)
        document.getElementById('formation-initiale-fin-prevue').textContent = dateFinPrevue.toISOString().split('T')[0];
    } else {
        document.getElementById('formation-initiale-fin-prevue').textContent = '-';
    }
    
    document.getElementById('formation-initiale-note').textContent = progression.formation_initiale.note || '-';
    if (progression.formation_initiale.complete) completedSteps++;
    
    // Modules de formation
    const stepModules = document.getElementById('step-modules');
    updateStepStatus(stepModules, progression.modules);
    document.getElementById('modules-status').textContent = getStatusText(progression.modules);
    
    // Afficher les modules
    const modulesList = document.getElementById('modules-list');
    if (progression.modules && progression.modules.liste && progression.modules.liste.length > 0) {
        // Compter les modules complétés
        const completedModules = progression.modules.liste.filter(module => module.complete).length;
        document.getElementById('modules-completed').textContent = `${completedModules}/${progression.modules.liste.length}`;
        
        // Afficher la liste des modules
        modulesList.innerHTML = '';
        progression.modules.liste.forEach(module => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'module-item';
            moduleItem.innerHTML = `
                <div class="module-header">
                    <span class="module-name">${module.nom}</span>
                    <span class="module-status ${module.complete ? 'complete' : 'pending'}">
                        ${module.complete ? 'Complété' : 'En cours'}
                    </span>
                </div>
                <div class="module-details">
                    <p><strong>Date de début:</strong> ${module.date_debut || '-'}</p>
                    <p><strong>Date de fin:</strong> ${module.date_fin || '-'}</p>
                    <p><strong>Formateur:</strong> ${module.formateur || '-'}</p>
                </div>
                <div class="module-actions">
                    ${!module.complete ? `<button class="action-btn btn-complete-module" data-module-id="${module.id}">Terminer</button>` : ''}
                </div>
            `;
            modulesList.appendChild(moduleItem);
        });
        
        // Ajouter les écouteurs d'événements pour les boutons de complétion de module
        document.querySelectorAll('.btn-complete-module').forEach(btn => {
            btn.addEventListener('click', function() {
                const moduleId = this.getAttribute('data-module-id');
                completeModule(soldier, moduleId);
            });
        });
    } else {
        document.getElementById('modules-completed').textContent = '0/0';
        modulesList.innerHTML = '<p class="placeholder-text">Aucun module assigné</p>';
    }
    
    if (progression.modules && progression.modules.complete) completedSteps++;
    
    // Intégration à l'Unité
    const stepIntegration = document.getElementById('step-integration');
    updateStepStatus(stepIntegration, progression.integration_unite);
    document.getElementById('integration-status').textContent = getStatusText(progression.integration_unite);
    document.getElementById('integration-debut').textContent = progression.integration_unite.date_debut || '-';
    document.getElementById('integration-fin').textContent = progression.integration_unite.date_fin || '-';
    document.getElementById('integration-unite').textContent = progression.integration_unite.unite || soldier.unité || '-';
    document.getElementById('integration-note').textContent = progression.integration_unite.note || '-';
    if (progression.integration_unite.complete) completedSteps++;
    
    // Évaluation Finale
    const stepEvaluation = document.getElementById('step-evaluation');
    updateStepStatus(stepEvaluation, progression.evaluation_finale);
    document.getElementById('evaluation-status').textContent = getStatusText(progression.evaluation_finale);
    document.getElementById('evaluation-date').textContent = progression.evaluation_finale.date || '-';
    document.getElementById('evaluation-resultat').textContent = progression.evaluation_finale.resultat || '-';
    document.getElementById('evaluation-note').textContent = progression.evaluation_finale.note || '-';
    if (progression.evaluation_finale.complete) completedSteps++;
    
    // Mettre à jour la barre de progression
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    document.getElementById('progression-bar-fill').style.width = `${progressPercentage}%`;
    document.getElementById('progression-percentage-value').textContent = `${progressPercentage}%`;
    
    // Configurer les boutons selon l'état actuel
    setupProgressionButtons(soldier);
}

// Mettre à jour le statut visuel d'une étape
function updateStepStatus(stepElement, stepData) {
    stepElement.classList.remove('step-pending', 'step-in-progress', 'step-completed', 'step-failed');
    
    if (stepData.complete) {
        stepElement.classList.add('step-completed');
    } else if (stepData.date_debut && !stepData.date_fin) {
        stepElement.classList.add('step-in-progress');
    } else if (stepData.resultat === 'echec') {
        stepElement.classList.add('step-failed');
    } else {
        stepElement.classList.add('step-pending');
    }
}

// Obtenir le texte du statut
function getStatusText(stepData) {
    if (stepData.complete) {
        return 'Terminé';
    } else if (stepData.date_debut && !stepData.date_fin) {
        return 'En cours';
    } else if (stepData.resultat === 'echec') {
        return 'Échec';
    } else {
        return 'Non commencé';
    }
}

// Fonction pour terminer un module de formation
function completeModule(soldier, moduleId) {
    if (!soldier || !soldier.progression_recrue || !soldier.progression_recrue.modules || !soldier.progression_recrue.modules.liste) {
        console.error('Impossible de terminer le module: données manquantes');
        return;
    }
    
    // Trouver le module par son ID
    const moduleIndex = soldier.progression_recrue.modules.liste.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) {
        console.error(`Module avec ID ${moduleId} non trouvé`);
        return;
    }
    
    // Marquer le module comme complété
    soldier.progression_recrue.modules.liste[moduleIndex].complete = true;
    soldier.progression_recrue.modules.liste[moduleIndex].date_fin = new Date().toISOString().split('T')[0];
    
    // Vérifier si tous les modules sont complétés
    const allModulesCompleted = soldier.progression_recrue.modules.liste.every(m => m.complete);
    if (allModulesCompleted && soldier.progression_recrue.modules.liste.length > 0) {
        soldier.progression_recrue.modules.complete = true;
    }
    
    // Sauvegarder les modifications
    saveSoldiersToStorage();
    
    // Mettre à jour l'affichage
    updateProgressionDisplay(soldier);
}

// Configurer les boutons de progression
function setupProgressionButtons(soldier) {
    const progression = soldier.progression_recrue;
    const soldierId = soldier.id;
    
    // Formation Initiale
    const btnCompleteFormationInitiale = document.getElementById('btn-complete-formation-initiale');
    if (btnCompleteFormationInitiale) {
        btnCompleteFormationInitiale.onclick = () => {
            progression.formation_initiale.complete = true;
            progression.formation_initiale.date_fin = new Date().toISOString().split('T')[0];
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    // Modules de formation
    const btnAddModule = document.getElementById('btn-add-module');
    if (btnAddModule) {
        btnAddModule.onclick = () => {
            // Initialiser les modules s'ils n'existent pas
            if (!progression.modules) {
                progression.modules = {
                    complete: false,
                    liste: []
                };
            }
            
            // Demander les informations du module
            const moduleName = prompt('Nom du module de formation:', '');
            if (!moduleName) return;
            
            const formateur = prompt('Nom du formateur:', '');
            
            // Créer un nouvel ID unique pour le module
            const moduleId = `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Ajouter le module à la liste
            progression.modules.liste.push({
                id: moduleId,
                nom: moduleName,
                date_debut: new Date().toISOString().split('T')[0],
                date_fin: null,
                formateur: formateur,
                complete: false
            });
            
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    const btnCompleteModules = document.getElementById('btn-complete-modules');
    if (btnCompleteModules) {
        btnCompleteModules.onclick = () => {
            if (!progression.modules || !progression.modules.liste || progression.modules.liste.length === 0) {
                alert('Aucun module à compléter. Ajoutez d\'abord des modules de formation.');
                return;
            }
            
            // Marquer tous les modules comme complétés
            progression.modules.liste.forEach(module => {
                module.complete = true;
                if (!module.date_fin) {
                    module.date_fin = new Date().toISOString().split('T')[0];
                }
            });
            
            progression.modules.complete = true;
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    // Intégration à l'Unité
    const btnStartIntegration = document.getElementById('btn-start-integration');
    if (btnStartIntegration) {
        btnStartIntegration.onclick = () => {
            progression.integration_unite.date_debut = new Date().toISOString().split('T')[0];
            progression.integration_unite.unite = soldier.unité || prompt('Unité d\'affectation:', 'Alpha 1-1');
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    const btnCompleteIntegration = document.getElementById('btn-complete-integration');
    if (btnCompleteIntegration) {
        btnCompleteIntegration.onclick = () => {
            progression.integration_unite.complete = true;
            progression.integration_unite.date_fin = new Date().toISOString().split('T')[0];
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    // Évaluation Finale
    const btnStartEvaluation = document.getElementById('btn-start-evaluation');
    if (btnStartEvaluation) {
        btnStartEvaluation.onclick = () => {
            progression.evaluation_finale.date = new Date().toISOString().split('T')[0];
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    const btnPassEvaluation = document.getElementById('btn-pass-evaluation');
    if (btnPassEvaluation) {
        btnPassEvaluation.onclick = () => {
            progression.evaluation_finale.complete = true;
            progression.evaluation_finale.resultat = 'réussite';
            // Changer le statut du soldat de recrue à actif
            soldier.statut = 'actif';
            
            // Ajouter un événement dans l'historique du soldat
            if (!soldier.historique) {
                soldier.historique = [];
            }
            
            soldier.historique.push({
                date: new Date().toISOString(),
                type: 'promotion',
                details: 'Promotion de recrue à soldat actif suite à la réussite de l\'évaluation finale'
            });
            
            saveSoldiersToStorage();
            alert(`Félicitations! ${soldier.pseudo || soldier.id} est maintenant un soldat actif.`);
            // Recharger la page pour mettre à jour l'affichage
            location.reload();
        };
    }
    
    const btnFailEvaluation = document.getElementById('btn-fail-evaluation');
    if (btnFailEvaluation) {
        btnFailEvaluation.onclick = () => {
            progression.evaluation_finale.complete = false;
            progression.evaluation_finale.resultat = 'echec';
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
            alert(`L'évaluation de ${soldier.pseudo || soldier.id} a été marquée comme échouée. Une nouvelle tentative sera nécessaire.`);
        };
    }
    
    // Activer/désactiver les boutons selon l'état de progression
    if (btnStartIntegration) {
        // Formation Initiale et Modules doivent être complétés avant de commencer l'Intégration
        btnStartIntegration.disabled = !progression.formation_initiale.complete || 
                                     (progression.modules && progression.modules.liste && 
                                      progression.modules.liste.length > 0 && !progression.modules.complete);
    }
    
    if (btnStartEvaluation) {
        // Intégration doit être complétée avant de commencer l'Évaluation
        btnStartEvaluation.disabled = !progression.integration_unite.complete;
    }
}

// Fonction pour calculer les statistiques de progression des recrues
function calculateRecruitProgressStats(soldiersData) {
    const stats = {
        totalRecruits: 0,
        inInitialTraining: 0,
        inSpecialization: 0,
        inUnitIntegration: 0,
        inFinalEvaluation: 0,
        completedTraining: 0,
        failedEvaluation: 0,
        recentlyPromoted: [], // Recrues promues récemment (7 derniers jours)
        upcomingEvaluations: [] // Recrues avec évaluation prévue dans les 7 prochains jours
    };
    
    // Date actuelle pour calculer les périodes récentes
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    soldiersData.forEach(soldier => {
        if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
            stats.totalRecruits++;
            
            // Si la progression n'est pas initialisée, considérer comme en formation initiale
            if (!soldier.progression_recrue) {
                stats.inInitialTraining++;
                return;
            }
            
            const progression = soldier.progression_recrue;
            
            // Déterminer l'étape actuelle
            if (!progression.formation_initiale.complete) {
                stats.inInitialTraining++;
            } else if (!progression.specialisation.complete) {
                stats.inSpecialization++;
            } else if (!progression.integration_unite.complete) {
                stats.inUnitIntegration++;
            } else if (!progression.evaluation_finale.complete) {
                stats.inFinalEvaluation++;
                
                // Vérifier si l'évaluation a échoué
                if (progression.evaluation_finale.resultat === 'echec') {
                    stats.failedEvaluation++;
                }
            }
        } 
        // Vérifier les soldats récemment promus (anciens recrues)
        else if (soldier.statut && soldier.statut.toLowerCase() === 'actif' && 
                 soldier.progression_recrue && 
                 soldier.progression_recrue.evaluation_finale.complete &&
                 soldier.progression_recrue.evaluation_finale.date) {
            
            const promotionDate = new Date(soldier.progression_recrue.evaluation_finale.date);
            if (promotionDate >= sevenDaysAgo) {
                stats.recentlyPromoted.push({
                    id: soldier.id,
                    pseudo: soldier.pseudo || soldier.id,
                    date: soldier.progression_recrue.evaluation_finale.date
                });
                stats.completedTraining++;
            }
        }
    });
    
    return stats;
}

// Charger les données des soldats au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadSoldiersData();
});

// Exporter les fonctions
window.updateProgressionDisplay = updateProgressionDisplay;
window.calculateRecruitProgressStats = calculateRecruitProgressStats;
window.loadSoldiersData = loadSoldiersData;
window.saveSoldiersToStorage = saveSoldiersToStorage;
