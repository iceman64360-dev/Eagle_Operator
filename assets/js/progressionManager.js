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
    
    // S'assurer que la structure de progression est complète (pour la compatibilité avec les anciennes données)
    const progression = soldier.progression_recrue;
    
    // Initialiser les propriétés manquantes
    if (!progression.formation_initiale) {
        progression.formation_initiale = {
            complete: false,
            date_debut: new Date().toISOString().split('T')[0],
            date_fin: null,
            note: null
        };
    }
    
    if (!progression.modules) {
        progression.modules = {
            complete: false,
            liste: []
        };
        
        // Ajouter les modules standard si la liste est vide
        if (progression.modules.liste.length === 0) {
            initializeStandardModules(progression);
        }
    } else if (progression.modules.liste && progression.modules.liste.length === 0) {
        // Ajouter les modules standard si la liste existe mais est vide
        initializeStandardModules(progression);
    }
    
    if (!progression.integration_unite) {
        progression.integration_unite = {
            complete: false,
            date_debut: null,
            date_fin: null,
            unite: soldier.unité || null,
            note: null
        };
    }
    
    if (!progression.evaluation_finale) {
        progression.evaluation_finale = {
            complete: false,
            date: null,
            resultat: null,
            note: null
        };
    }
    
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
            
            // Date de validation (si complété)
            const dateValidation = module.complete && module.date_fin ? 
                `<span class="module-date">Validé le ${module.date_fin}</span>` : '';
            
            moduleItem.innerHTML = `
                <div class="module-header">
                    <span class="module-name">${module.nom}</span>
                    <span class="module-status ${module.complete ? 'complete' : 'pending'}">
                        ${module.complete ? 'Validé' : 'Non validé'}
                    </span>
                </div>
                ${dateValidation}
                <div class="module-actions">
                    ${!module.complete ? 
                        `<button class="action-btn btn-complete-module" data-module-id="${module.id}">Valider</button>` : 
                        `<button class="action-btn btn-uncomplete-module" data-module-id="${module.id}">Annuler la validation</button>`
                    }
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
    if (!stepElement) return;
    
    stepElement.classList.remove('step-pending', 'step-in-progress', 'step-completed', 'step-failed');
    
    // Vérifier si stepData est défini
    if (!stepData) {
        stepElement.classList.add('step-pending');
        return;
    }
    
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
    if (!stepData) {
        return 'Non commencé';
    }
    
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

// Fonction pour valider un module de formation
function completeModule(soldier, moduleId) {
    if (!soldier || !soldier.progression_recrue || !soldier.progression_recrue.modules) return;
    
    const module = soldier.progression_recrue.modules.liste.find(m => m.id === moduleId);
    if (!module) return;
    
    module.complete = true;
    module.date_fin = new Date().toISOString().split('T')[0];
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

// Configurer les boutons pour les actions de progression
function setupProgressionButtons(soldier) {
    if (!soldier || !soldier.progression_recrue) return;
    
    const progression = soldier.progression_recrue;
    
    // Bouton pour terminer la formation initiale
    const btnCompleteFormationInitiale = document.getElementById('btn-complete-formation-initiale');
    if (btnCompleteFormationInitiale) {
        btnCompleteFormationInitiale.onclick = () => {
            progression.formation_initiale.complete = true;
            progression.formation_initiale.date_fin = new Date().toISOString().split('T')[0];
            updateProgressionDisplay(soldier);
            saveSoldiersToStorage();
            
            progression.modules.complete = true;
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        };
    }
    
    // Configurer les gestionnaires d'événements pour les modules
    // Utiliser la délégation d'événements pour gérer les boutons des modules
    document.addEventListener('click', function(e) {
        // Bouton pour valider un module
        if (e.target && e.target.classList.contains('btn-complete-module')) {
            const moduleId = e.target.getAttribute('data-module-id');
            if (moduleId) {
                const module = progression.modules.liste.find(m => m.id === moduleId);
                if (module) {
                    module.complete = true;
                    module.date_fin = new Date().toISOString().split('T')[0];
                    
                    // Vérifier si tous les modules sont complétés
                    const allModulesComplete = progression.modules.liste.every(m => m.complete);
                    progression.modules.complete = allModulesComplete;
                    
                    updateProgressionDisplay(soldier);
                    saveSoldiersToStorage();
                }
            }
        }
        
        // Bouton pour annuler la validation d'un module
        if (e.target && e.target.classList.contains('btn-uncomplete-module')) {
            const moduleId = e.target.getAttribute('data-module-id');
            if (moduleId) {
                const module = progression.modules.liste.find(m => m.id === moduleId);
                if (module) {
                    module.complete = false;
                    module.date_fin = null;
                    
                    // Mettre à jour le statut global des modules
                    progression.modules.complete = false;
                    
                    updateProgressionDisplay(soldier);
                    saveSoldiersToStorage();
                }
            }
        }
    });
    
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

// Fonction pour initialiser les modules de formation standard
function initializeStandardModules(progression) {
    const today = new Date().toISOString().split('T')[0];
    
    // Module 1: MVT-BAS — Mouvements & Disposition de Combat
    progression.modules.liste.push({
        id: `module-mvt-bas-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nom: "MVT-BAS — Mouvements & Disposition de Combat",
        description: "Enseigner les déplacements tactiques individuels et en groupe.",
        contenu: [
            "Positionnement (couv', flancs, intervalles)",
            "Progression par bonds",
            "Arrêts de contact / réactions feu"
        ],
        critere_reussite: "Cohésion en progression + discipline radio",
        date_debut: today,
        date_fin: null,
        formateur: "",
        complete: false
    });
    
    // Module 2: COM-RAD — Communication & Protocoles Radio
    progression.modules.liste.push({
        id: `module-com-rad-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nom: "COM-RAD — Communication & Protocoles Radio",
        description: "Appliquer les procédures standards de communication.",
        contenu: [
            "Lexique radio (Ex : 'Break', 'Over', 'Actual', 'SitRep')",
            "Structure des ordres simples (FRAGO, contact, extraction)",
            "Code couleur / brevity code"
        ],
        critere_reussite: "Transmissions claires, concises, conformes",
        date_debut: today,
        date_fin: null,
        formateur: "",
        complete: false
    });
    
    // Module 3: IDENT-FEU — Identification & Engagement des Cibles
    progression.modules.liste.push({
        id: `module-ident-feu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nom: "IDENT-FEU — Identification & Engagement des Cibles",
        description: "Former à la discrimination des cibles, ouverture du feu et coordination de tir.",
        contenu: [
            "Règles d'engagement",
            "Cibles prioritaires / menaces immédiates",
            "Tir contrôlé, sectorisé, appui mutuel"
        ],
        critere_reussite: "Tir précis, zéro fratricide, discipline feu",
        date_debut: today,
        date_fin: null,
        formateur: "",
        complete: false
    });
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
