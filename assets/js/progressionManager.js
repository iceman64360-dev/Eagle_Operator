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

// Fonction pour synchroniser complètement les données entre soldats et unités
function synchronizeRecruitData(soldier) {
    if (!soldier) return;
    
    console.log('Synchronisation des données pour la recrue:', soldier.pseudo);
    
    // 1. Charger les unités depuis le localStorage
    const unitsData = localStorage.getItem('eagleOperator_units');
    if (!unitsData) return;
    
    const units = JSON.parse(unitsData);
    
    // 2. Si le soldat a une unité assignée, s'assurer qu'il est dans les recrues potentielles de cette unité
    if (soldier.unité) {
        const unitId = soldier.unité;
        const unit = units.find(u => u.id_unite === unitId);
        
        if (unit) {
            console.log('Unité trouvée:', unit.nom);
            
            // Initialiser les recrues potentielles si nécessaire
            if (!unit.recrues_potentielles) {
                unit.recrues_potentielles = [];
            }
            
            // Vérifier si la recrue est déjà dans la liste
            const recrueIndex = unit.recrues_potentielles.findIndex(r => r && r.id === soldier.id);
            
            if (recrueIndex === -1) {
                console.log('Ajout de la recrue aux recrues potentielles de l\'unité');
                
                // Ajouter la recrue à la première position disponible
                let added = false;
                for (let i = 0; i < 4; i++) {
                    if (!unit.recrues_potentielles[i]) {
                        unit.recrues_potentielles[i] = {
                            id: soldier.id,
                            pseudo: soldier.pseudo,
                            grade: soldier.grade
                        };
                        added = true;
                        break;
                    }
                }
                
                // Si aucune position n'est disponible, ajouter à la fin
                if (!added) {
                    unit.recrues_potentielles.push({
                        id: soldier.id,
                        pseudo: soldier.pseudo,
                        grade: soldier.grade
                    });
                }
                
                // Sauvegarder les unités mises à jour
                localStorage.setItem('eagleOperator_units', JSON.stringify(units));
            }
        }
    }
    
    // 3. Si le soldat a une progression de recrue, s'assurer que les données sont cohérentes
    if (soldier.progression_recrue) {
        const progression = soldier.progression_recrue;
        
        // S'assurer que l'escouade provisoire est bien définie
        if (progression.formation_initiale && progression.formation_initiale.complete) {
            if (!progression.formation_initiale.escouade_provisoire && soldier.unité) {
                progression.formation_initiale.escouade_provisoire = soldier.unité;
            }
            
            // S'assurer que le parrain est bien défini
            if (!progression.formation_initiale.parrain) {
                // Trouver le chef d'escouade pour le désigner comme parrain
                const escouadeId = progression.formation_initiale.escouade_provisoire || soldier.unité;
                if (escouadeId) {
                    const chefEscouade = allSoldiersData.find(s => 
                        s.unité === escouadeId && 
                        s.statut === 'Actif' && 
                        (s.grade === 'Sergent' || s.grade === 'Sergent-Chef' || s.grade === 'Caporal-Chef')
                    );
                    
                    if (chefEscouade) {
                        progression.formation_initiale.parrain = chefEscouade.id;
                    }
                }
            }
        }
        
        // Sauvegarder les modifications
        saveSoldiersToStorage();
    }
}

// Fonction pour initialiser les modules standard de formation
function initializeStandardModules(progression) {
    if (!progression.modules) {
        progression.modules = {
            complete: false,
            liste: []
        };
    }
    
    if (!progression.modules.liste) {
        progression.modules.liste = [];
    }
    
    // Définir les trois modules standard de formation
    const modulesStandard = [
        {
            id: 'module1',
            nom: 'Techniques de combat',
            description: 'Maîtrise des techniques de combat de base',
            complete: false,
            date_validation: null
        },
        {
            id: 'module2',
            nom: 'Communication tactique',
            description: 'Apprentissage des protocoles de communication',
            complete: false,
            date_validation: null
        },
        {
            id: 'module3',
            nom: 'Survie en milieu hostile',
            description: 'Techniques de survie en environnement difficile',
            complete: false,
            date_validation: null
        }
    ];
    
    // Ajouter les modules à la liste (sans les valider automatiquement)
    progression.modules.liste = modulesStandard;
}

// Synchroniser toutes les recrues au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Charger les données des soldats
    loadSoldiersData();
    
    // Synchroniser les données pour toutes les recrues
    allSoldiersData.forEach(soldier => {
        if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
            synchronizeRecruitData(soldier);
        }
    });
});

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
            escouade_provisoire: null,
            parrain: null
        };
    }
    
    if (!progression.modules) {
        progression.modules = {
            complete: false,
            liste: []
        };
        
        // Ajouter les modules standard si la liste est vide
        if (!progression.modules.liste || progression.modules.liste.length === 0) {
            initializeStandardModules(progression);
        }
    } else if (!progression.modules.liste || progression.modules.liste.length === 0) {
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
    
    // Incorporation et Intégration Provisoire
    const stepFormationInitiale = document.getElementById('step-formation-initiale');
    updateStepStatus(stepFormationInitiale, progression.formation_initiale);
    
    // Mettre à jour les informations d'incorporation
    const statusElement = document.getElementById('formation-initiale-status');
    if (statusElement) {
        statusElement.textContent = getStatusText(progression.formation_initiale);
    }
    
    const debutElement = document.getElementById('formation-initiale-debut');
    if (debutElement) {
        debutElement.textContent = progression.formation_initiale.date_debut || '-';
    }
    
    const escouadeElement = document.getElementById('formation-initiale-escouade');
    if (escouadeElement) {
        // Trouver le nom de l'escouade à partir de son ID
        let escouadeNom = progression.formation_initiale.escouade_provisoire || '-';
        if (escouadeNom !== '-') {
            const units = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
            const escouade = units.find(u => u.id_unite === progression.formation_initiale.escouade_provisoire);
            if (escouade) {
                escouadeNom = escouade.nom;
            }
        }
        escouadeElement.textContent = escouadeNom;
    }
    
    const parrainElement = document.getElementById('formation-initiale-parrain');
    if (parrainElement) {
        // Trouver le nom du parrain à partir de son ID
        let parrainNom = progression.formation_initiale.parrain || '-';
        if (parrainNom !== '-') {
            const parrain = allSoldiersData.find(s => s.id === progression.formation_initiale.parrain);
            if (parrain) {
                parrainNom = `${parrain.grade} ${parrain.pseudo}`;
            }
        }
        parrainElement.textContent = parrainNom;
    }
    
    if (progression.formation_initiale.complete) completedSteps++;
    
    // Calculer la date de fin prévue (2 semaines après la date de début)
    if (progression.formation_initiale.date_debut) {
        const dateDebut = new Date(progression.formation_initiale.date_debut);
        const dateFinPrevue = new Date(dateDebut);
        dateFinPrevue.setDate(dateDebut.getDate() + 14); // +14 jours (2 semaines)
        
        const finPrevueElement = document.getElementById('formation-initiale-fin-prevue');
        if (finPrevueElement) {
            finPrevueElement.textContent = dateFinPrevue.toISOString().split('T')[0];
        }
    } else {
        const finPrevueElement = document.getElementById('formation-initiale-fin-prevue');
        if (finPrevueElement) {
            finPrevueElement.textContent = '-';
        }
    }
    
    const noteElement = document.getElementById('formation-initiale-note');
    if (noteElement) {
        noteElement.textContent = progression.formation_initiale.note || '-';
    }
    if (progression.formation_initiale.complete) completedSteps++;
    
    // Modules de formation
    const stepModules = document.getElementById('step-modules');
    updateStepStatus(stepModules, progression.modules);
    document.getElementById('modules-status').textContent = getStatusText(progression.modules);
    
    // Afficher les modules
    const modulesList = document.getElementById('modules-list');
    if (progression.modules && progression.modules.liste && progression.modules.liste.length > 0) {
        // Compter les modules complétés
        const completedModules = progression.modules.liste.filter(m => m.complete).length;
        document.getElementById('modules-completed').textContent = `${completedModules}/${progression.modules.liste.length}`;
        
        // Afficher la liste des modules sous forme de cartes
        modulesList.innerHTML = '';
        modulesList.className = 'progression-modules-list'; // Appliquer la classe pour l'affichage en colonnes
        
        progression.modules.liste.forEach(module => {
            const moduleCard = document.createElement('div');
            moduleCard.className = `module-card ${module.complete ? 'validated' : 'not-validated'}`;
            
            // Date de validation (si complété)
            const dateValidation = module.complete && module.date_fin ? 
                `<div class="module-date">Validé le ${module.date_fin}</div>` : '';
            
            moduleCard.innerHTML = `
                <div class="module-header">
                    <h4 class="module-name">${module.nom}</h4>
                    <div class="module-status ${module.complete ? 'complete' : 'pending'}">
                        ${module.complete ? 'Validé' : 'Non validé'}
                    </div>
                </div>
                ${dateValidation}
                <div class="module-actions">
                    ${!module.complete ? 
                        `<button class="action-btn btn-complete-module" data-module-id="${module.id}">Valider</button>` : 
                        `<button class="action-btn btn-uncomplete-module" data-module-id="${module.id}">Annuler la validation</button>`
                    }
                </div>
            `;
            modulesList.appendChild(moduleCard);
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
    if (stepIntegration) {
        updateStepStatus(stepIntegration, progression.integration_unite);
    }
    
    // Vérifier l'existence de chaque élément avant d'y accéder
    const integrationStatus = document.getElementById('integration-status');
    if (integrationStatus) {
        integrationStatus.textContent = getStatusText(progression.integration_unite);
    }
    
    const integrationDebut = document.getElementById('integration-debut');
    if (integrationDebut) {
        integrationDebut.textContent = progression.integration_unite.date_debut || '-';
    }
    
    const integrationUnite = document.getElementById('integration-unite');
    if (integrationUnite) {
        integrationUnite.textContent = progression.integration_unite.unite || soldier.unité || '-';
    }
    
    if (progression.integration_unite.complete) completedSteps++;
    
    // L'évaluation finale a été supprimée, mais nous gardons la structure dans les données pour la compatibilité
    // Nous n'accédons plus aux éléments du DOM qui ont été supprimés
    if (progression.evaluation_finale && progression.evaluation_finale.complete) {
        completedSteps++;
    }
    
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

    // Boutons pour l'incorporation
    const btnShowIncorporationForm = document.getElementById('btn-show-incorporation-form');
    const incorporationForm = document.getElementById('incorporation-form');
    const btnCompleteIncorporation = document.getElementById('btn-complete-incorporation');
    const btnCancelIncorporation = document.getElementById('btn-cancel-incorporation');
    const selectEscouadeProvisoire = document.getElementById('select-escouade-provisoire');
    const selectParrain = document.getElementById('select-parrain');

    // Charger les escouades disponibles pour l'incorporation
    function loadAvailableEscouades() {
        // Vider le sélecteur d'escouades
        if (selectEscouadeProvisoire) {
            selectEscouadeProvisoire.innerHTML = '<option value="">-- Sélectionner une escouade --</option>';

            // Charger les unités depuis le localStorage
            let units = [];
            const unitsData = localStorage.getItem('eagleOperator_units');
            if (unitsData) {
                units = JSON.parse(unitsData);

                // Calculer les effectifs actuels de chaque unité
                const effectifs = {};
                allSoldiersData.forEach(s => {
                    if (s.unité && s.statut === 'Actif') {
                        effectifs[s.unité] = (effectifs[s.unité] || 0) + 1;
                    }
                });

                // Trouver les chefs d'escouade pour chaque unité
                const chefsEscouade = {};
                allSoldiersData.forEach(s => {
                    if (s.unité && s.statut === 'Actif' && 
                        (s.grade === 'Sergent' || s.grade === 'Sergent-Chef' || s.grade === 'Caporal-Chef')) {
                        // Stocker le chef d'escouade (prendre le premier trouvé)
                        if (!chefsEscouade[s.unité]) {
                            chefsEscouade[s.unité] = s;
                        }
                    }
                });

                // Ajouter uniquement les escouades qui ont un chef et qui ne sont pas pleines
                units.forEach(unit => {
                    // Vérifier si c'est une escouade (type = 'escouade')
                    if (unit.type === 'escouade') {
                        // Utiliser id_unite pour la compatibilité avec le format JSON
                        const unitId = unit.id_unite || unit.id;
                        const chef = chefsEscouade[unitId];
                        const effectifActuel = effectifs[unitId] || 0;
                        const capaciteMax = unit.capacite_max || unit.effectif_max || 8;
                        
                        // Déboguer les escouades et les chefs
                        console.log(`Escouade: ${unit.nom}, ID: ${unitId}, Chef: ${chef ? chef.pseudo : 'Aucun'}, Effectif: ${effectifActuel}/${capaciteMax}`);
                        
                        // Ajouter l'escouade même si elle n'a pas encore de chef (pour le développement)
                        // En production, décommenter la condition pour vérifier la présence d'un chef
                        // if (chef && effectifActuel < capaciteMax) {
                        if (effectifActuel < capaciteMax) {
                            const option = document.createElement('option');
                            option.value = unitId;
                            option.textContent = `${unit.nom} (${effectifActuel}/${capaciteMax})`;
                            
                            // Si un chef existe, stocker ses informations
                            if (chef) {
                                option.dataset.chefId = chef.id;
                                option.dataset.chefNom = `${chef.grade} ${chef.pseudo}`;
                            } else {
                                // Si pas de chef, indiquer que le commandant sera le parrain par défaut
                                option.dataset.chefId = "commandant";
                                option.dataset.chefNom = "Commandant (par défaut)";
                            }
                            
                            selectEscouadeProvisoire.appendChild(option);
                        }
                    }
                });
            }
        }
    }

    // Mettre à jour automatiquement le parrain en fonction de l'escouade sélectionnée
    function updateParrainAutomatique() {
        if (selectEscouadeProvisoire && selectParrain) {
            const selectedOption = selectEscouadeProvisoire.options[selectEscouadeProvisoire.selectedIndex];

            if (selectedOption && selectedOption.dataset.chefId) {
                // Créer une seule option avec le chef d'escouade
                selectParrain.innerHTML = '';
                const option = document.createElement('option');
                option.value = selectedOption.dataset.chefId;
                option.textContent = selectedOption.dataset.chefNom;
                option.selected = true;
                selectParrain.appendChild(option);

                // Désactiver le sélecteur de parrain car il est automatique
                selectParrain.disabled = true;
            } else {
                // Réinitialiser et désactiver le sélecteur de parrain si aucune escouade n'est sélectionnée
                selectParrain.innerHTML = '<option value="">-- Sélection automatique --</option>';
                selectParrain.disabled = true;
            }
        }
    }

    // Afficher le formulaire d'incorporation
    if (btnShowIncorporationForm) {
        btnShowIncorporationForm.onclick = () => {
            // Afficher le formulaire
            if (incorporationForm) {
                incorporationForm.classList.remove('hidden-element');
            }
            btnShowIncorporationForm.classList.add('hidden-element');
            if (btnCompleteIncorporation) {
                btnCompleteIncorporation.classList.remove('hidden-element');
            }
            if (btnCancelIncorporation) {
                btnCancelIncorporation.classList.remove('hidden-element');
            }

            // Charger les escouades disponibles
            loadAvailableEscouades();

            // Ajouter un écouteur d'événement pour le changement d'escouade
            if (selectEscouadeProvisoire) {
                selectEscouadeProvisoire.addEventListener('change', () => {
                    updateParrainAutomatique();
                });
            }
        };
    }

    // Annuler l'incorporation
    if (btnCancelIncorporation) {
        btnCancelIncorporation.onclick = () => {
            // Cacher le formulaire
            if (incorporationForm) {
                incorporationForm.classList.add('hidden-element');
            }
            btnShowIncorporationForm.classList.remove('hidden-element');
            if (btnCompleteIncorporation) {
                btnCompleteIncorporation.classList.add('hidden-element');
            }
            btnCancelIncorporation.classList.add('hidden-element');
        };
    }

    // Confirmer l'incorporation
    if (btnCompleteIncorporation) {
        btnCompleteIncorporation.onclick = () => {
            if (!selectEscouadeProvisoire) return;
            
            const selectedEscouade = selectEscouadeProvisoire.value;
            const selectedOption = selectEscouadeProvisoire.options[selectEscouadeProvisoire.selectedIndex];
            const selectedParrain = selectedOption.dataset.chefId;
            
            if (!selectedEscouade || !selectedParrain) {
                alert('Veuillez sélectionner une escouade valide avec un chef.');
                return;
            }

            // Mettre à jour la progression
            progression.formation_initiale.complete = true;
            progression.formation_initiale.date_fin = new Date().toISOString().split('T')[0];
            progression.formation_initiale.escouade_provisoire = selectedEscouade;
            progression.formation_initiale.parrain = selectedParrain;

            // Trouver le nom de l'escouade et du parrain pour l'historique
            let escouadeNom = selectedEscouade;
            let parrainNom = selectedParrain;

            // Charger les unités avec la clé harmonisée
            const units = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
            
            // Trouver l'escouade par son ID (id_unite)
            const escouade = units.find(u => u.id_unite === selectedEscouade);
            if (escouade) {
                escouadeNom = escouade.nom;
                
                // Mettre à jour l'unité du soldat avec l'ID de l'escouade
                soldier.unité = selectedEscouade;
                
                // Ajouter la recrue aux recrues potentielles de l'escouade
                if (!escouade.recrues_potentielles) {
                    escouade.recrues_potentielles = [];
                }
                
                // Vérifier si la recrue n'est pas déjà dans la liste
                const recrueIndex = escouade.recrues_potentielles.findIndex(r => r && r.id === soldier.id);
                if (recrueIndex === -1) {
                    // Ajouter la recrue à la première position disponible
                    let added = false;
                    for (let i = 0; i < 4; i++) {
                        if (!escouade.recrues_potentielles[i]) {
                            escouade.recrues_potentielles[i] = {
                                id: soldier.id,
                                pseudo: soldier.pseudo,
                                grade: soldier.grade
                            };
                            added = true;
                            break;
                        }
                    }
                    
                    // Si aucune position n'est disponible, ajouter à la fin
                    if (!added) {
                        escouade.recrues_potentielles.push({
                            id: soldier.id,
                            pseudo: soldier.pseudo,
                            grade: soldier.grade
                        });
                    }
                }
                
                // Sauvegarder les unités mises à jour
                localStorage.setItem('eagleOperator_units', JSON.stringify(units));
            }

            // Trouver le parrain par son ID
            const parrain = allSoldiersData.find(s => s.id === selectedParrain);
            if (parrain) {
                parrainNom = `${parrain.grade} ${parrain.pseudo}`;
            }

            // Ajouter un événement dans l'historique
            if (!soldier.historique) soldier.historique = [];
            soldier.historique.push({
                date: new Date().toISOString().split('T')[0],
                type: 'incorporation',
                description: `Incorporation et intégration provisoire à l'escouade ${escouadeNom} sous la supervision de ${parrainNom}`
            });

            // Sauvegarder les changements
            saveSoldiersToStorage();
            
            // Synchroniser toutes les données
            synchronizeRecruitData(soldier);

            // Mettre à jour l'affichage
            updateProgressionDisplay(soldier);

            // Cacher le formulaire
            if (incorporationForm) {
                incorporationForm.classList.add('hidden-element');
            }
            btnShowIncorporationForm.classList.add('hidden-element');
            if (btnCompleteIncorporation) {
                btnCompleteIncorporation.classList.add('hidden-element');
            }
            btnCancelIncorporation.classList.add('hidden-element');
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
    const btnShowIntegrationForm = document.getElementById('btn-show-integration-form');
    const integrationForm = document.getElementById('integration-form');
    const btnCompleteIntegration = document.getElementById('btn-complete-integration');
    const btnCancelIntegration = document.getElementById('btn-cancel-integration');
    const selectUnite = document.getElementById('select-unite');
    
    // Charger les unités disponibles pour l'intégration finale
    function loadAvailableUnits() {
        // Vider le sélecteur d'unités
        selectUnite.innerHTML = '<option value="">-- Sélectionner une escouade --</option>';
        
        // Charger les unités depuis le localStorage
        let units = [];
        const unitsData = localStorage.getItem('eagleOperator_units');
        if (unitsData) {
            units = JSON.parse(unitsData);
        } else {
            // Charger depuis le fichier JSON si nécessaire
            fetch('data/unites.json')
                .then(response => response.json())
                .then(data => {
                    units = data;
                    populateUnitSelect(units);
                });
        }
        
        if (units.length > 0) {
            populateUnitSelect(units);
        }
    }
    
    // Peupler le sélecteur d'unités avec les unités disponibles
    function populateUnitSelect(units) {
        // Calculer les effectifs actuels de chaque unité
        const effectifs = {};
        allSoldiersData.forEach(s => {
            if (s.unité && s.statut === 'Actif') {
                effectifs[s.unité] = (effectifs[s.unité] || 0) + 1;
            }
        });
        
        // Identifier les escouades qui ont un chef
        const escouadesAvecChef = {};
        allSoldiersData.forEach(s => {
            if (s.unité && s.statut === 'Actif' && 
                (s.grade === 'Sergent' || s.grade === 'Sergent-Chef' || s.grade === 'Caporal-Chef')) {
                escouadesAvecChef[s.unité] = true;
            }
        });
        
        // Ajouter uniquement les unités qui ont de la place ET qui ont un chef
        units.forEach(unit => {
            const effectifActuel = effectifs[unit.id] || 0;
            const hasChef = escouadesAvecChef[unit.id] || false;
            
            // N'ajouter que les escouades qui ont un chef et qui ne sont pas pleines
            if (hasChef && effectifActuel < unit.effectif_max) {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = `${unit.nom} (${effectifActuel}/${unit.effectif_max})`;
                selectUnite.appendChild(option);
            }
        });
    }
    
    // Afficher le formulaire d'intégration
    if (btnShowIntegrationForm) {
        btnShowIntegrationForm.onclick = () => {
            // Afficher le formulaire
            integrationForm.classList.remove('hidden-element');
            btnShowIntegrationForm.classList.add('hidden-element');
            btnCompleteIntegration.classList.remove('hidden-element');
            btnCancelIntegration.classList.remove('hidden-element');
            
            // Charger les unités disponibles
            loadAvailableUnits();
        };
    }
    
    // Annuler l'intégration
    if (btnCancelIntegration) {
        btnCancelIntegration.onclick = () => {
            // Cacher le formulaire
            integrationForm.classList.add('hidden-element');
            btnShowIntegrationForm.classList.remove('hidden-element');
            btnCompleteIntegration.classList.add('hidden-element');
            btnCancelIntegration.classList.add('hidden-element');
        };
    }
    
    // Confirmer l'intégration
    if (btnCompleteIntegration) {
        btnCompleteIntegration.onclick = () => {
            const selectedUnit = selectUnite.value;
            const notes = document.getElementById('integration-notes').value;
            
            if (!selectedUnit) {
                alert('Veuillez sélectionner une escouade pour l\'intégration.');
                return;
            }
            
            // Mettre à jour la progression
            progression.integration_unite.complete = true;
            progression.integration_unite.date_debut = new Date().toISOString().split('T')[0];
            progression.integration_unite.unite = selectedUnit;
            progression.integration_unite.note = notes;
            
            // Mettre à jour le soldat
            soldier.unité = selectedUnit;
            soldier.statut = 'Actif';
            soldier.grade = 'Soldat';
            
            // Ajouter un événement dans l'historique
            if (!soldier.historique) soldier.historique = [];
            soldier.historique.push({
                date: new Date().toISOString().split('T')[0],
                type: 'promotion',
                description: `Promotion au grade de Soldat et intégration à l'unité ${selectedUnit}`
            });
            
            // Sauvegarder les changements
            saveSoldiersToStorage();
            
            // Fermer le dossier et rafraîchir la page
            alert('Le soldat a été intégré avec succès à l\'unité ' + selectedUnit);
            document.getElementById('soldierFileModal').classList.add('hidden-modal');
            location.reload();
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
    if (btnShowIntegrationForm) {
        // Formation Initiale et Modules doivent être complétés avant de commencer l'Intégration
        btnShowIntegrationForm.disabled = !progression.formation_initiale.complete || 
                                      (progression.modules && progression.modules.liste && 
                                       progression.modules.liste.length > 0 && !progression.modules.complete);
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
