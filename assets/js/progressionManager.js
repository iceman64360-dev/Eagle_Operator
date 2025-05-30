// progressionManager.js - Gestion de la progression des recrues

// Fonction pour mettre à jour l'affichage de la progression d'une recrue
function updateProgressionDisplay(soldier) {
    if (!soldier || !soldier.progression_recrue) return;
    
    const progression = soldier.progression_recrue;
    let completedSteps = 0;
    const totalSteps = 4; // Nombre total d'étapes
    
    // Formation Initiale
    const stepFormationInitiale = document.getElementById('step-formation-initiale');
    updateStepStatus(stepFormationInitiale, progression.formation_initiale);
    document.getElementById('formation-initiale-status').textContent = getStatusText(progression.formation_initiale);
    document.getElementById('formation-initiale-debut').textContent = progression.formation_initiale.date_debut || '-';
    document.getElementById('formation-initiale-fin').textContent = progression.formation_initiale.date_fin || '-';
    document.getElementById('formation-initiale-note').textContent = progression.formation_initiale.note || '-';
    if (progression.formation_initiale.complete) completedSteps++;
    
    // Spécialisation
    const stepSpecialisation = document.getElementById('step-specialisation');
    updateStepStatus(stepSpecialisation, progression.specialisation);
    document.getElementById('specialisation-status').textContent = getStatusText(progression.specialisation);
    document.getElementById('specialisation-debut').textContent = progression.specialisation.date_debut || '-';
    document.getElementById('specialisation-fin').textContent = progression.specialisation.date_fin || '-';
    document.getElementById('specialisation-type').textContent = progression.specialisation.specialite || '-';
    document.getElementById('specialisation-note').textContent = progression.specialisation.note || '-';
    if (progression.specialisation.complete) completedSteps++;
    
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

// Configurer les boutons de progression
function setupProgressionButtons(soldier) {
    const progression = soldier.progression_recrue;
    const soldierId = soldier.id;
    
    // Formation Initiale
    const btnCompleteFormationInitiale = document.getElementById('btn-complete-formation-initiale');
    btnCompleteFormationInitiale.onclick = () => {
        progression.formation_initiale.complete = true;
        progression.formation_initiale.date_fin = new Date().toISOString().split('T')[0];
        saveSoldiersToStorage();
        updateProgressionDisplay(soldier);
    };
    
    // Spécialisation
    const btnStartSpecialisation = document.getElementById('btn-start-specialisation');
    btnStartSpecialisation.onclick = () => {
        progression.specialisation.date_debut = new Date().toISOString().split('T')[0];
        // Demander la spécialité
        const specialite = prompt('Quelle spécialité pour cette recrue?', 'Infanterie');
        if (specialite) {
            progression.specialisation.specialite = specialite;
            saveSoldiersToStorage();
            updateProgressionDisplay(soldier);
        }
    };
    
    const btnCompleteSpecialisation = document.getElementById('btn-complete-specialisation');
    btnCompleteSpecialisation.onclick = () => {
        progression.specialisation.complete = true;
        progression.specialisation.date_fin = new Date().toISOString().split('T')[0];
        saveSoldiersToStorage();
        updateProgressionDisplay(soldier);
    };
    
    // Intégration à l'Unité
    const btnStartIntegration = document.getElementById('btn-start-integration');
    btnStartIntegration.onclick = () => {
        progression.integration_unite.date_debut = new Date().toISOString().split('T')[0];
        progression.integration_unite.unite = soldier.unité || prompt('Unité d\'affectation:', 'Alpha 1-1');
        saveSoldiersToStorage();
        updateProgressionDisplay(soldier);
    };
    
    const btnCompleteIntegration = document.getElementById('btn-complete-integration');
    btnCompleteIntegration.onclick = () => {
        progression.integration_unite.complete = true;
        progression.integration_unite.date_fin = new Date().toISOString().split('T')[0];
        saveSoldiersToStorage();
        updateProgressionDisplay(soldier);
    };
    
    // Évaluation Finale
    const btnStartEvaluation = document.getElementById('btn-start-evaluation');
    btnStartEvaluation.onclick = () => {
        progression.evaluation_finale.date = new Date().toISOString().split('T')[0];
        saveSoldiersToStorage();
        updateProgressionDisplay(soldier);
    };
    
    const btnPassEvaluation = document.getElementById('btn-pass-evaluation');
    btnPassEvaluation.onclick = () => {
        progression.evaluation_finale.complete = true;
        progression.evaluation_finale.resultat = 'réussite';
        // Changer le statut du soldat de recrue à actif
        soldier.statut = 'actif';
        saveSoldiersToStorage();
        alert(`Félicitations! ${soldier.pseudo || soldier.id} est maintenant un soldat actif.`);
        // Recharger la page pour mettre à jour l'affichage
        location.reload();
    };
    
    const btnFailEvaluation = document.getElementById('btn-fail-evaluation');
    btnFailEvaluation.onclick = () => {
        progression.evaluation_finale.complete = false;
        progression.evaluation_finale.resultat = 'echec';
        saveSoldiersToStorage();
        updateProgressionDisplay(soldier);
        alert(`L'évaluation de ${soldier.pseudo || soldier.id} a été marquée comme échouée. Une nouvelle tentative sera nécessaire.`);
    };
    
    // Activer/désactiver les boutons selon l'état de progression
    // Formation Initiale doit être complétée avant de commencer la Spécialisation
    btnStartSpecialisation.disabled = !progression.formation_initiale.complete;
    // Spécialisation doit être complétée avant de commencer l'Intégration
    btnStartIntegration.disabled = !progression.specialisation.complete;
    // Intégration doit être complétée avant de commencer l'Évaluation
    btnStartEvaluation.disabled = !progression.integration_unite.complete;
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

// Exporter les fonctions
window.updateProgressionDisplay = updateProgressionDisplay;
window.calculateRecruitProgressStats = calculateRecruitProgressStats;
