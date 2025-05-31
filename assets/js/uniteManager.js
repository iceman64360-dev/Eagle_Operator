// assets/js/uniteManager.js
// Gestionnaire principal Eagle Company - Unités
// Audit syntaxique et accessibilité JS

// Variables globales pour la modale d'affectation
let currentUnit = null;
let selectedSoldiers = [];
let openAssignSoldiersModal;
let closeAssignSoldiersModal;
let filterAssignableSoldiers;
let assignSelectedSoldiers;

// Fonction globale pour gérer le clic sur le bouton d'affectation d'opérateurs
function handleAssignOperator(unitId) {
    console.log('handleAssignOperator appelé avec unitId:', unitId);
    // Récupérer l'unité à partir de son ID
    const units = getAllUnits();
    const unit = units.find(u => u.id_unite === unitId || u.id === unitId);
    
    if (unit) {
        console.log('Unité trouvée:', unit);
        // Afficher directement la modale sans passer par openAssignSoldiersModal
        currentUnit = unit;
        
        // Mettre à jour le titre de la modale
        const unitNameTitle = document.getElementById('unit-name-title');
        if (unitNameTitle) {
            unitNameTitle.textContent = unit.nom || unit.name || 'Unité';
        }
        
        // Réinitialiser la liste des soldats sélectionnés
        selectedSoldiers = [];
        
        // Réinitialiser le champ de recherche
        const searchInput = document.getElementById('soldier-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Afficher la modale
        const modal = document.getElementById('assignSoldiersModal');
        if (modal) {
            modal.style.display = 'block';
            console.log('Modale affichée');
        } else {
            console.error('Modale non trouvée dans le DOM');
            alert('Erreur: La modale d\'affectation n\'a pas été trouvée dans le DOM.');
        }
        
        // Filtrer et afficher les soldats assignables
        if (typeof filterAssignableSoldiers === 'function') {
            filterAssignableSoldiers();
        } else {
            console.error('La fonction filterAssignableSoldiers n\'est pas définie');
        }
        
        // Ajouter les écouteurs d'événements
        // Écouteur pour la fermeture de la modale
        const closeBtn = document.getElementById('closeAssignModal');
        if (closeBtn) {
            closeBtn.onclick = function() {
                const modal = document.getElementById('assignSoldiersModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            };
        }
        
        // Écouteur pour le bouton Annuler
        const cancelBtn = document.getElementById('cancelAssignBtn');
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                const modal = document.getElementById('assignSoldiersModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            };
        }
    } else {
        console.error('Unité non trouvée avec ID:', unitId);
        alert('Erreur: Unité non trouvée.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const unitTreeContainer = document.getElementById('unitTree');
    const unitDetailPane = document.getElementById('unitDetailPane');
    let unitMapGlobal = new Map();
    let allUnits = [];
    let allSoldiers = []; // Pour stocker les données des soldats globalement
    
    // Fonction pour recharger les données des soldats depuis le localStorage
    function reloadSoldiersData() {
        const localData = localStorage.getItem('eagleOperator_soldiers');
        if (localData) {
            try {
                allSoldiers = JSON.parse(localData);
                console.log('Données des soldats rechargées depuis localStorage');
            } catch (e) {
                console.warn('Erreur lors du rechargement des données des soldats:', e);
            }
        }
    }

    // Vérification des éléments critiques
    if (!unitTreeContainer || !unitDetailPane) {
        console.error('Error: Element with ID "unitTree" or "unitDetailPane" not found.');
        return;
    }

    // Chargement des données unités + soldats (localStorage ou JSON)
    Promise.all([
        // Chargement des unités (localStorage en priorité, sinon JSON)
        (async () => {
            const localUnits = localStorage.getItem('eagleOperator_units');
            if (localUnits) {
                try { 
                    console.log('Unités chargées depuis localStorage');
                    return JSON.parse(localUnits); 
                } catch(e) { 
                    console.warn('Erreur parsing unités depuis localStorage:', e);
                    /* fallback below */ 
                }
            }
            const res = await fetch('../data/unites.json');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for unites.json`);
            console.log('Unités chargées depuis JSON');
            return res.json();
        })(),
        (async () => {
            const local = localStorage.getItem('eagleOperator_soldiers');
            if (local) {
                try { 
                    console.log('Soldats chargés depuis localStorage');
                    return JSON.parse(local); 
                } catch(e) { 
                    console.warn('Erreur parsing soldats depuis localStorage:', e);
                    /* fallback below */ 
                }
            }
            
            // Essayer plusieurs chemins possibles pour trouver le fichier JSON
            let res;
            try {
                res = await fetch('./data/soldiers.json');
                if (!res.ok) throw new Error('Chemin 1 non valide');
            } catch (e) {
                console.log('Tentative avec chemin alternatif 1 échouée, essai du chemin 2...');
                try {
                    res = await fetch('../data/soldiers.json');
                    if (!res.ok) throw new Error('Chemin 2 non valide');
                } catch (e2) {
                    console.log('Tentative avec chemin alternatif 2 échouée, essai du chemin 3...');
                    try {
                        res = await fetch('/data/soldiers.json');
                        if (!res.ok) throw new Error('Chemin 3 non valide');
                    } catch (e3) {
                        console.log('Tentative avec chemin alternatif 3 échouée, essai du chemin 4...');
                        try {
                            res = await fetch('https://raw.githubusercontent.com/iceman64360-dev/Eagle_Operator/main/data/soldiers.json');
                            if (!res.ok) throw new Error('Chemin 4 non valide');
                        } catch (e4) {
                            console.log('Toutes les tentatives de chargement du fichier ont échoué, création de données par défaut...');
                            // Retourner un tableau vide en cas d'échec
                            return [];
                        }
                    }
                }
            }
            
            return res.json();
        })()

    ])
    .then(([unitsData, soldiersData]) => {
        if (unitsData && unitsData.length > 0) {
            unitMapGlobal = new Map(unitsData.map(unit => [unit.id_unite, unit]));
            allUnits = unitsData;
            allSoldiers = soldiersData || [];
            // Vérifie si une unité spécifique est demandée dans l'URL
            const urlParams = new URLSearchParams(window.location.search);
            const unitIdFromUrl = urlParams.get('unit');
            
            if (unitIdFromUrl) {
                // Si une unité est spécifiée dans l'URL, l'afficher directement
                console.log('Affichage de l\'unité depuis URL:', unitIdFromUrl);
                const targetUnit = allUnits.find(u => u.id_unite === unitIdFromUrl);
                
                if (targetUnit) {
                    // Construire le chemin hiérarchique vers cette unité
                    buildPathToUnit(targetUnit.id_unite, allUnits);
                    updateBreadcrumb();
                    showDirectChildren(targetUnit.id_unite);
                    displayUnitDetails(targetUnit.id_unite);
                    
                    // Faire défiler jusqu'à la section de détails de l'unité
                    setTimeout(() => {
                        document.querySelector('.unit-detail-fullwidth').scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                } else {
                    // Si l'unité n'est pas trouvée, initialiser normalement
                    initHierarchicalNav();
                }
            } else {
                // Initialisation normale sans paramètre d'URL
                initHierarchicalNav();
            }
            
            addEventListeners(); // S'assure que les événements sont bien branchés
        } else {
            unitTreeContainer.innerHTML = '<p>Aucune donnée d\'unité trouvée ou format incorrect.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching or parsing data:', error);
        unitTreeContainer.innerHTML = `<p style='color:red;'>Erreur lors du chargement des données: ${error.message}</p>`;
        unitDetailPane.innerHTML = `<p style='color:red;'>Erreur lors du chargement des données.</p>`;
    });

    // Sauvegarde des unités dans le localStorage
    function saveUnitsToStorage() {
        localStorage.setItem('eagleOperator_units', JSON.stringify(allUnits));
    }
    
    // Fonction pour construire le chemin hiérarchique vers une unité
    function buildPathToUnit(unitId, units) {
        unitPath = []; // Réinitialiser le chemin
        let currentUnit = units.find(u => u.id_unite === unitId);
        
        // Si l'unité n'existe pas, retourner
        if (!currentUnit) return;
        
        // Ajouter l'unité actuelle au chemin
        unitPath.unshift(currentUnit.id_unite);
        
        // Remonter la hiérarchie jusqu'au QG
        while (currentUnit && currentUnit.superieur) {
            const parentUnit = units.find(u => u.id_unite === currentUnit.superieur);
            if (parentUnit) {
                unitPath.unshift(parentUnit.id_unite);
                currentUnit = parentUnit;
            } else {
                break;
            }
        }
        
        return unitPath;
    }
    
    // Fonction pour mettre à jour l'unité d'un soldat
    function updateSoldierUnit(soldierId, uniteName, isRemove = false) {
        const soldier = allSoldiers.find(s => s.id === soldierId);
        if (soldier) {
            // Si on retire l'affectation, on vide le champ unité
            soldier.unité = isRemove ? "" : uniteName;
            // Sauvegarder les modifications des soldats
            localStorage.setItem('eagleOperator_soldiers', JSON.stringify(allSoldiers));
            return true;
        }
        return false;
    }

    // Helper function to get color class based on unit type
    // Renvoie la classe couleur selon le type d'unité
    function getUnitColorClass(unitType) {
        switch (unitType) {
            case 'quartier_general': return 'dot-quartier-general';
            case 'compagnie': return 'dot-compagnie';
            case 'section': return 'dot-section';
            case 'groupe': return 'dot-groupe';
            case 'escouade': return 'dot-escouade';
            default: return 'dot-default';
        }
    }

    // --- NAVIGATION HIÉRARCHIQUE CENTRÉE ---
    let unitPath = [];

    // Initialise la navigation hiérarchique
    function initHierarchicalNav() {
        // Trouver la racine (QG)
        const qg = allUnits.find(u => u.type === 'quartier_general');
        if (!qg) {
            unitTreeContainer.innerHTML = '<p>Quartier Général introuvable.</p>';
            return;
        }
        unitPath = [qg.id_unite];
        updateBreadcrumb();
        showDirectChildren(qg.id_unite);
        displayUnitDetails(qg.id_unite);
    }

    // Affiche les enfants directs dans l'arbre (peut être enrichi)
    function showDirectChildren(parentId) {
        // Ne rien afficher dans la zone principale (on retire la ligne dynamique)
        unitTreeContainer.innerHTML = '';
    }

    // Met à jour le fil d'Ariane (breadcrumb)
    function updateBreadcrumb() {
        const breadcrumb = document.getElementById('unitBreadcrumb');
        breadcrumb.innerHTML = '';
        unitPath.forEach((id, idx) => {
            const unite = allUnits.find(u => u.id_unite === id);
            if (!unite) return;
            const span = document.createElement('span');
            span.textContent = unite.nom;
            span.setAttribute('title', unite.nom);
            if (idx < unitPath.length - 1) {
                span.setAttribute('role', 'link');
                span.style.cursor = 'pointer';
                span.onclick = () => {
                    unitPath = unitPath.slice(0, idx + 1);
                    updateBreadcrumb();
                    showDirectChildren(id);
                    displayUnitDetails(id);
                };
            } else {
                span.className = 'breadcrumb-current';
            }
            breadcrumb.appendChild(span);
            if (idx < unitPath.length - 1) {
                const sep = document.createElement('span');
                sep.className = 'breadcrumb-sep';
                sep.textContent = '>';
                breadcrumb.appendChild(sep);
            }
        });
    }

    // Helper function to recursively get all descendant unit IDs of a given unit
    // Retourne tous les ID descendants d'une unité
    function getDescendantUnitIds(unitId, units) {
        let descendantIds = [];
        const children = units.filter(u => u.superieur === unitId);
        for (const child of children) {
            descendantIds.push(child.id_unite);
            descendantIds = descendantIds.concat(getDescendantUnitIds(child.id_unite, units));
        }
        return descendantIds;
    }

    // Helper function to get all escouade units under a given unit (including itself if it's an escouade)
    // Retourne toutes les escouades sous une unité donnée
    function getSubordinateEscouades(unitId, units) {
        const unit = units.find(u => u.id_unite === unitId);
        if (!unit) return [];

        if (unit.type === 'escouade') {
            return [unit];
        }

        let result = [];
        const descendantUnitIds = getDescendantUnitIds(unitId, units);
        for (const id of descendantUnitIds) {
            const descendantUnit = units.find(u => u.id_unite === id);
            if (descendantUnit && descendantUnit.type === 'escouade') {
                result.push(descendantUnit);
            }
        }
        return result;
    }

    // Helper function to get ALL subordinate units (not just escouades)
    // Retourne toutes les unités subordonnées, quel que soit leur type
    function getAllSubordinateUnits(unitId, units) {
        const unit = units.find(u => u.id_unite === unitId);
        if (!unit) return [];
        
        let result = [];
        const descendantUnitIds = getDescendantUnitIds(unitId, units);
        for (const id of descendantUnitIds) {
            const descendantUnit = units.find(u => u.id_unite === id);
            if (descendantUnit) {
                result.push(descendantUnit);
            }
        }
        return result;
    }

    // Helper function to calculate total current personnel for a unit (sum of its escouades' personnel)
    // Calcule le total de personnel pour une unité
    function getTotalPersonnel(unitId, units, soldiers) {
        // Obtenir l'unité actuelle
        const currentUnit = units.find(u => u.id_unite === unitId);
        if (!currentUnit) return 0;
        
        // Ensemble pour suivre les soldats déjà comptés (pour éviter les doublons)
        const countedSoldiers = new Set();
        let totalPersonnel = 0;
        
        // 1. Compter les soldats directement assignés à cette unité (par le champ unité)
        soldiers.forEach(soldier => {
            if (soldier.unité === currentUnit.nom && !countedSoldiers.has(soldier.id)) {
                totalPersonnel++;
                countedSoldiers.add(soldier.id);
            }
        });
        
        // 2. Compter tous les commandants et adjoints des unités subordonnées
        // Récupérer toutes les unités subordonnées (pas seulement les escouades)
        const allSubordinateUnits = getAllSubordinateUnits(unitId, units);
        
        // Compter les commandants et adjoints de ces unités
        for (const subUnit of allSubordinateUnits) {
            // Ajouter le commandant s'il existe
            if (subUnit.commandant_id && !countedSoldiers.has(subUnit.commandant_id)) {
                const commandant = soldiers.find(s => s.id === subUnit.commandant_id);
                if (commandant) {
                    totalPersonnel++;
                    countedSoldiers.add(subUnit.commandant_id);
                }
            }
            
            // Ajouter l'adjoint s'il existe
            if (subUnit.adjoint_id && !countedSoldiers.has(subUnit.adjoint_id)) {
                const adjoint = soldiers.find(s => s.id === subUnit.adjoint_id);
                if (adjoint) {
                    totalPersonnel++;
                    countedSoldiers.add(subUnit.adjoint_id);
                }
            }
        }
        
        // 3. Ajouter les soldats des escouades subordonnées
        const subordinateEscouades = getSubordinateEscouades(unitId, units);
        for (const escouade of subordinateEscouades) {
            soldiers.forEach(soldier => {
                if (soldier.unité === escouade.nom && !countedSoldiers.has(soldier.id)) {
                    totalPersonnel++;
                    countedSoldiers.add(soldier.id);
                }
            });
        }
        
        return totalPersonnel;
    }

    // Helper function to calculate aggregate max capacity for a unit (sum of its escouades' max capacity)
    // Calcule la capacité max agrégée pour une unité
    function getAggregateMaxCapacity(unitId, units) {
        const subordinateEscouades = getSubordinateEscouades(unitId, units);
        let aggregateCapacity = 0;
        for (const escouade of subordinateEscouades) {
            aggregateCapacity += escouade.capacite_max || 0;
        }
        return aggregateCapacity;
    }

    // Affiche les détails d'une unité sélectionnée
    function displayUnitDetails(unitId) {
        const selectedUnit = allUnits.find(u => u.id_unite === unitId);
        if (!selectedUnit) {
            unitDetailPane.innerHTML = '<p>Détails de l\'unité non disponibles.</p>';
            return;
        }

        unitDetailPane.innerHTML = ''; // Clear previous details

        // --- Toujours Affiché --- 
        const generalInfoEncart = createEncart('Informations Générales');
        generalInfoEncart.innerHTML = `
            <h2><span>${selectedUnit.nom}</span></h2>
            <p><strong>ID:</strong> ${selectedUnit.id_unite}</p>
            <p><strong>Type:</strong> ${selectedUnit.type.replace('_', ' ')}</p>
            <p><strong>Supérieur :</strong> ${selectedUnit.superieur ? (allUnits.find(u=>u.id_unite === selectedUnit.superieur)?.nom || selectedUnit.superieur) : 'N/A'}</p>
        `;
        unitDetailPane.appendChild(generalInfoEncart);

        // --- Section Unités subordonnées (cartes modernes) juste après le titre ---
        const directSubordinates = allUnits.filter(sub => sub.superieur === selectedUnit.id_unite);
        const subUnitsEncart = createEncart('Unités Subordonnées');
        if (directSubordinates.length > 0) {
            let html = '<div class="unit-level-list" style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;">';
            directSubordinates.forEach(child => {
                const colorDotClass = getUnitColorClass(child.type);
                html += `<div class="sub-unit-card ${child.type.toLowerCase().replace(' ', '_')}" data-unit-id="${child.id_unite}" style="display:flex;align-items:center;gap:8px;min-width:140px;max-width:220px;cursor:pointer;">
                    <span class="unit-color-dot ${colorDotClass}"></span>
                    <span>${child.nom}</span>
                </div>`;
            });
            html += '</div>';
            subUnitsEncart.innerHTML += html;
            // Ajoute les listeners pour sélectionner la sous-unité
            subUnitsEncart.querySelectorAll('.sub-unit-card').forEach(card => {
                card.onclick = function(e) {
                    e.stopPropagation();
                    const unitId = card.getAttribute('data-unit-id');
                    // Mise à jour du chemin hiérarchique
                    const idx = unitPath.indexOf(selectedUnit.id_unite);
                    if (idx === -1) unitPath.push(selectedUnit.id_unite);
                    unitPath = unitPath.slice(0, unitPath.indexOf(selectedUnit.id_unite)+1);
                    unitPath.push(unitId);
                    updateBreadcrumb();
                    showDirectChildren(unitId);
                    displayUnitDetails(unitId);
                };
            });
        } else {
            subUnitsEncart.innerHTML += '<p>Aucune unité subordonnée directe.</p>';
        }
        unitDetailPane.appendChild(subUnitsEncart);

        // --- Encarts Chef et Adjoint côte à côte ---
        const staffRow = document.createElement('div');
        staffRow.style.display = 'flex';
        staffRow.style.gap = '32px';
        staffRow.style.justifyContent = 'center';
        staffRow.style.margin = '18px 0 8px 0';

        // --- Carte Chef ---
        const chefCard = document.createElement('div');
        chefCard.className = 'detail-card';
        chefCard.innerHTML = `<h4>Commandant</h4>`;

        // Hiérarchie des grades du plus bas au plus haut
        const gradeHierarchy = [
            'Caporal', 'Caporal-chef',
            'Sergent', 'Sergent-chef',
            'Sous-lieutenant', 'Lieutenant',
            'Capitaine', 'Commandant', 'Major', 'Colonel', 'Général'
        ];
        // Grade minimum requis pour chaque type d'unité
        let minGrade = '';
        switch (selectedUnit.type) {
            case 'quartier_general':
                minGrade = 'Capitaine'; break; // Grade minimum pour le QG (moins restrictif)
            case 'compagnie':
                minGrade = 'Capitaine'; break;
            case 'section':
                minGrade = 'Lieutenant'; break;
            case 'groupe':
                minGrade = 'Sergent'; break;
            case 'escouade':
                minGrade = 'Caporal'; break;
            default:
                minGrade = '';
        }
        // Tous les grades >= minGrade sont éligibles
        const minIdx = gradeHierarchy.indexOf(minGrade);
        const eligibleGrades = minIdx >= 0 ? gradeHierarchy.slice(minIdx) : [];
        // Chercher le commandant déjà affecté
        let commandant = null;
        if (selectedUnit.commandant_id) {
            commandant = allSoldiers.find(s => s.id === selectedUnit.commandant_id);
            console.log('Commandant trouvé:', commandant ? commandant.pseudo : 'non trouvé', 'ID:', selectedUnit.commandant_id);
        }
        
        if (commandant) {
            chefCard.innerHTML += `<p>${commandant.pseudo} (${commandant.grade})</p><button id="unassignChefBtn" class="affect-btn"><span class="icon-chevron">⊖</span> Retirer</button>`;
        } else {
            // Sélecteur pour affecter un commandant
            const availableSoldiers = allSoldiers.filter(s => {
                // Vérifier si le soldat a déjà une unité assignée
                const hasUnit = s.unité && s.unité.trim() !== '';
                
                // Vérifier si le grade est éligible
                const hasEligibleGrade = eligibleGrades.includes(s.grade);
                
                // Pour le QG, on permet d'affecter n'importe quel soldat avec un grade suffisant
                // même s'il est déjà affecté à une autre unité
                if (selectedUnit.type === 'quartier_general') {
                    // Pour le QG, on accepte tous les soldats avec un grade suffisant
                    return true;
                }
                
                // Pour les autres unités, le soldat ne doit pas avoir d'unité assignée
                return !hasUnit && hasEligibleGrade;
            });
            if (availableSoldiers.length > 0) {
                let selectHtml = '<div class="commander-selection">';
                selectHtml += '<select id="selectChef" class="affect-select"><option value="">Sélectionner un commandant...</option>';
                availableSoldiers.forEach(soldier => {
                    selectHtml += `<option value="${soldier.id}">${soldier.pseudo} (${soldier.grade})</option>`;
                });
                selectHtml += '</select>';
                selectHtml += '<button id="assignChefBtn" class="affect-btn"><span class="icon-chevron">⊕</span> Affecter</button>';
                selectHtml += '</div>';
                chefCard.innerHTML += selectHtml;
            } else {
                chefCard.innerHTML += '<p>Aucun soldat éligible disponible</p>';
            }
        }

        // Ajout listeners pour affecter/retirer
        setTimeout(() => {
            const assignBtn = document.getElementById('assignChefBtn');
            if (assignBtn) {
                assignBtn.onclick = () => {
                    const select = document.getElementById('selectChef');
                    const sid = select.value;
                    if (!sid) return;
                    
                    // Mettre à jour l'unité du soldat avec le NOM de l'unité
                    updateSoldierUnit(sid, selectedUnit.nom);
                    
                    // Affecter le commandant à l'unité
                    selectedUnit.commandant_id = sid;
                    saveUnitsToStorage();
                    displayUnitDetails(selectedUnit.id_unite);
                };
            }
            const unassignBtn = document.getElementById('unassignChefBtn');
            if (unassignBtn) {
                unassignBtn.onclick = () => {
                    // Récupérer l'ID du commandant avant de le supprimer
                    const commandantId = selectedUnit.commandant_id;
                    
                    // Supprimer l'affectation de l'unité
                    delete selectedUnit.commandant_id;
                    saveUnitsToStorage();
                    
                    // Mettre à jour le soldat (retirer son unité)
                    updateSoldierUnit(commandantId, "", true);
                    
                    displayUnitDetails(selectedUnit.id_unite);
                };
            }
        }, 0);

        staffRow.appendChild(chefCard);
        
        // Création du cadre pour l'adjoint
        const adjointCard = document.createElement('div');
        adjointCard.className = 'detail-card';
        adjointCard.innerHTML = `<h4>Adjoint</h4>`;
        
        // Chercher l'adjoint déjà affecté
        let adjoint = null;
        if (selectedUnit.adjoint_id) {
            adjoint = allSoldiers.find(s => s.id === selectedUnit.adjoint_id);
            console.log('Adjoint trouvé:', adjoint ? adjoint.pseudo : 'non trouvé', 'ID:', selectedUnit.adjoint_id);
        }
        
        // Déterminer l'index du grade du commandant dans la hiérarchie
        let commandantGradeIdx = -1;
        if (commandant) {
            commandantGradeIdx = gradeHierarchy.indexOf(commandant.grade);
        }
        
        if (adjoint) {
            adjointCard.innerHTML += `<p>${adjoint.pseudo} (${adjoint.grade})</p><button id="unassignAdjointBtn" class="affect-btn"><span class="icon-chevron">⊖</span> Retirer</button>`;
        } else {
            // Sélecteur pour affecter un adjoint (grade inférieur au commandant)
            // Filtrer les soldats disponibles pour le rôle d'adjoint
            // 1. Exclure le commandant actuel s'il existe
            // 2. Exclure les soldats déjà affectés à d'autres unités (sauf pour le QG)
            // 3. Inclure uniquement les soldats avec un grade éligible
            const availableSoldiers = allSoldiers.filter(s => {
                // Pas déjà affecté comme commandant de cette unité
                if (commandant && s.id === commandant.id) return false;
                
                // Vérifier si le soldat a déjà une unité assignée
                const hasUnit = s.unité && s.unité.trim() !== '';
                
                // Vérifier le grade
                const soldierGradeIdx = gradeHierarchy.indexOf(s.grade);
                const hasEligibleGrade = soldierGradeIdx >= 0 && eligibleGrades.includes(s.grade);
                
                // Pour le QG, on permet d'affecter n'importe quel soldat
                if (selectedUnit.type === 'quartier_general') {
                    // Pour le QG, on accepte tous les soldats
                    return true;
                }
                
                // Pour les autres unités, le soldat ne doit pas avoir d'unité assignée
                return !hasUnit && hasEligibleGrade;
            });
            
            if (availableSoldiers.length > 0) {
                let selectHtml = '<div class="commander-selection">';
                selectHtml += '<select id="selectAdjoint" class="affect-select"><option value="">Sélectionner un adjoint...</option>';
                availableSoldiers.forEach(soldier => {
                    selectHtml += `<option value="${soldier.id}">${soldier.pseudo} (${soldier.grade})</option>`;
                });
                selectHtml += '</select>';
                selectHtml += '<button id="assignAdjointBtn" class="affect-btn"><span class="icon-chevron">⊕</span> Affecter</button>';
                selectHtml += '</div>';
                adjointCard.innerHTML += selectHtml;
            } else {
                adjointCard.innerHTML += '<p>Aucun soldat éligible disponible</p>';
            }
        }
        
        // Ajout listeners pour affecter/retirer l'adjoint
        setTimeout(() => {
            const assignAdjointBtn = document.getElementById('assignAdjointBtn');
            if (assignAdjointBtn) {
                assignAdjointBtn.onclick = () => {
                    const select = document.getElementById('selectAdjoint');
                    const sid = select.value;
                    if (!sid) return;
                    
                    // Mettre à jour l'unité du soldat avec le NOM de l'unité
                    updateSoldierUnit(sid, selectedUnit.nom);
                    
                    // Affecter l'adjoint à l'unité
                    selectedUnit.adjoint_id = sid;
                    saveUnitsToStorage();
                    displayUnitDetails(selectedUnit.id_unite);
                };
            }
            const unassignAdjointBtn = document.getElementById('unassignAdjointBtn');
            if (unassignAdjointBtn) {
                unassignAdjointBtn.onclick = () => {
                    // Récupérer l'ID de l'adjoint avant de le supprimer
                    const adjointId = selectedUnit.adjoint_id;
                    
                    // Supprimer l'affectation de l'unité
                    delete selectedUnit.adjoint_id;
                    saveUnitsToStorage();
                    
                    // Mettre à jour le soldat (retirer son unité)
                    updateSoldierUnit(adjointId, "", true);
                    
                    displayUnitDetails(selectedUnit.id_unite);
                };
            }
        }, 0);
        
        staffRow.appendChild(adjointCard);
        unitDetailPane.appendChild(staffRow);

        // --- Carte Effectifs ---
        const effectifCard = document.createElement('div');
        effectifCard.className = 'detail-card effectif-card';
        const total = getTotalPersonnel(selectedUnit.id_unite, allUnits, allSoldiers);
        const max = getAggregateMaxCapacity(selectedUnit.id_unite, allUnits);
        const taux = max > 0 ? Math.round((total/max)*100) : 0;
        effectifCard.innerHTML = `<h3>Effectifs</h3><div class="effectif-info"><span><strong>Total :</strong> ${total}</span><br><span><strong>Capacité max :</strong> ${max}</span><br><span><strong>Taux d'occupation :</strong> ${taux}%</span></div>`;
        unitDetailPane.appendChild(effectifCard);

        // --- Affichage Conditionnel basé sur le type d'unité --- 
        if (selectedUnit.type === 'escouade') {
            // Section Statistiques pour Escouade
            const statsEncart = createEncart('Statistiques de l\'Escouade');
            const personnelInEscouade = allSoldiers.filter(s => s.unité === selectedUnit.id_unite || s.unité === selectedUnit.nom);
            
            // Créer une liste complète du personnel incluant les soldats assignés directement et les recrues
            const allPersonnel = [];
            
            // Ajouter les soldats assignés directement
            personnelInEscouade.forEach(soldier => {
                allPersonnel.push(soldier);
            });
            
            // Ajouter les recrues qui ne seraient pas déjà dans la liste
            if (selectedUnit.recrues_potentielles && Array.isArray(selectedUnit.recrues_potentielles)) {
                selectedUnit.recrues_potentielles.forEach(recrue => {
                    if (recrue && recrue.id) {
                        // Vérifier si cette recrue est déjà dans la liste
                        const alreadyListed = allPersonnel.some(p => p.id === recrue.id);
                        if (!alreadyListed) {
                            // Trouver les données complètes de la recrue
                            const recrueData = allSoldiers.find(s => s.id === recrue.id);
                            if (recrueData) {
                                allPersonnel.push(recrueData);
                            }
                        }
                    }
                });
            }
            
            console.log('Personnel complet de l\'escouade:', allPersonnel);
            
            // Compter le nombre de recrues affectées
            const recruesCount = selectedUnit.recrues_potentielles ? 
                selectedUnit.recrues_potentielles.filter(r => r !== null).length : 0;
            const maxRecrues = 3; // Capacité maximale de recrues par escouade
            
            // Calculer l'effectif total
            const totalEffectif = allPersonnel.length;
            
            statsEncart.innerHTML = `
                <p><strong>Capacité Max:</strong> ${selectedUnit.capacite_max || 'N/A'}</p>
                <p><strong>Effectif Actuel:</strong> ${totalEffectif}</p>
                <p><strong>Recrues:</strong> ${recruesCount} / ${maxRecrues}</p>
            `;
            unitDetailPane.appendChild(statsEncart);

            // Section Personnel pour Escouade
            const personnelEncart = createEncart('Personnel de l\'Escouade');
            
            console.log('Personnel complet de l\'escouade:', allPersonnel);
            
            if (allPersonnel.length > 0) {
                const table = document.createElement('table');
                table.className = 'personnel-table';
                table.innerHTML = `
                    <thead><tr><th>Pseudo</th><th>Grade</th><th>Statut</th></tr></thead>
                    <tbody>
                        ${allPersonnel.map(soldier => `
                            <tr><td>${soldier.pseudo}</td><td>${soldier.grade}</td><td>${soldier.statut}</td></tr>
                        `).join('')}
                    </tbody>
                `;
                personnelEncart.appendChild(table);
                // Si moins de 6 opérateurs, bouton pour en affecter un autre
                if (personnelInEscouade.length < 6) {
                    const btn = document.createElement('button');
                    btn.innerHTML = '<span class="icon-chevron">⊕</span> Affecter un opérateur';
                    btn.className = 'affect-btn';
                    btn.id = 'assignOperatorBtn-' + Date.now();
                    console.log('Création du bouton d\'affectation avec ID:', btn.id);
                    // Stocker l'ID de l'unité comme attribut de données
                    btn.setAttribute('data-unit-id', selectedUnit.id_unite);
                    btn.setAttribute('onclick', 'handleAssignOperator(this.getAttribute("data-unit-id"))');
                    personnelEncart.appendChild(btn);
                }
            } else {
                personnelEncart.innerHTML += '<p>Aucun personnel assigné à cette escouade.</p>';
                const btn = document.createElement('button');
                btn.innerHTML = '<span class="icon-chevron">⊕</span> Affecter un opérateur';
                btn.className = 'affect-btn';
                btn.id = 'assignOperatorBtn-empty-' + Date.now();
                console.log('Création du bouton d\'affectation (aucun personnel) avec ID:', btn.id);
                // Stocker l'ID de l'unité comme attribut de données
                btn.setAttribute('data-unit-id', selectedUnit.id_unite);
                btn.setAttribute('onclick', 'handleAssignOperator(this.getAttribute("data-unit-id"))');
                personnelEncart.appendChild(btn);
            }
            unitDetailPane.appendChild(personnelEncart);

            // Section Vivier de Recrutement pour Escouade (toujours 3 slots)
            const recruitmentEncart = createEncart('Vivier de Recrutement');
            const fixedRecruitmentSlots = 3; // Toujours 3 slots comme demandé
            const slotsDiv = document.createElement('div');
            slotsDiv.className = 'recruitment-slots';
            
            // Recharger les données des soldats pour avoir les plus récentes
            reloadSoldiersData();
            
            // Fonction pour nettoyer les données des soldats
            function cleanupSoldiersData() {
                // Réinitialiser l'unité des recrues qui ne sont pas affectées
                allSoldiers.forEach(soldier => {
                    if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
                        // Vérifier si cette recrue est affectée à une unité
                        let isAssignedToAnyUnit = false;
                        
                        // Parcourir toutes les unités pour vérifier si la recrue est affectée
                        allUnits.forEach(unit => {
                            if (unit.recrues_potentielles && Array.isArray(unit.recrues_potentielles)) {
                                if (unit.recrues_potentielles.some(r => r && r.id === soldier.id)) {
                                    isAssignedToAnyUnit = true;
                                }
                            }
                        });
                        
                        // Si la recrue n'est affectée à aucune unité, réinitialiser son unité
                        if (!isAssignedToAnyUnit && soldier.unité) {
                            console.log(`Réinitialisation de l'unité pour la recrue ${soldier.id} (${soldier.pseudo})`);
                            soldier.unité = '';
                        }
                    }
                });
                
                // Sauvegarder les modifications
                localStorage.setItem('eagle_soldiers', JSON.stringify(allSoldiers));
            }
            
            // Fonction pour réinitialiser les recrues potentielles d'une unité
            function resetRecruesPotentielles(unit) {
                // Vérifie si la structure existe et si elle est vide ou ne contient que des null
                if (unit.recrues_potentielles) {
                    // Si c'est un tableau vide ou ne contenant que des null
                    if (!Array.isArray(unit.recrues_potentielles) || unit.recrues_potentielles.length === 0 || unit.recrues_potentielles.every(r => !r)) {
                        console.log(`Réinitialisation des recrues potentielles pour l'unité ${unit.nom}`);
                        delete unit.recrues_potentielles;
                        saveUnitsToStorage();
                    }
                }
            }
            
            // Nettoyer les données des soldats
            cleanupSoldiersData();
            
            // Réinitialiser les recrues potentielles si nécessaire
            resetRecruesPotentielles(selectedUnit);
            
            // Recharger les données des soldats après nettoyage
            reloadSoldiersData();
            
            // Logs de débogage pour identifier le problème
            console.log('Tous les soldats après nettoyage:', allSoldiers);
            console.log('Soldats avec statut recrue:', allSoldiers.filter(s => s.statut && s.statut.toLowerCase() === 'recrue'));
            console.log('Structure recrues_potentielles:', selectedUnit.recrues_potentielles);
            
            // Simplifier la détection des recrues disponibles
            // On considère comme disponible tout soldat avec le statut "recrue"
            const recrues = allSoldiers.filter(s => s.statut && s.statut.toLowerCase() === 'recrue');
            console.log('Toutes les recrues:', recrues);
            
            // Filtrer les recrues déjà assignées à cette unité
            const recruesAssignees = [];
            if (selectedUnit.recrues_potentielles && Array.isArray(selectedUnit.recrues_potentielles)) {
                selectedUnit.recrues_potentielles.forEach(r => {
                    if (r && r.id) {
                        recruesAssignees.push(r.id);
                    }
                });
            }
            console.log('Recrues déjà assignées à cette unité:', recruesAssignees);
            
            // Filtrer les recrues disponibles (non assignées à cette unité)
            const availableRecruits = recrues.filter(r => !recruesAssignees.includes(r.id));
            console.log('Recrues disponibles après filtrage:', availableRecruits);
            
            console.log('Recrues disponibles:', availableRecruits.length, availableRecruits);
            
            // FORCER l'affichage des slots de recrutement même si aucune recrue n'est détectée
            // Cela permettra de déboguer le problème
            console.log('FORCER l\'affichage des slots de recrutement');
            
            // Afficher un message d'information si aucune recrue disponible
            if (availableRecruits.length === 0) {
                const noRecruitMsg = document.createElement('p');
                noRecruitMsg.className = 'no-recruit-msg';
                noRecruitMsg.innerHTML = 'Aucun soldat avec le statut <strong>recrue</strong> détecté comme disponible. Les boutons sont affichés pour débogage.';
                recruitmentEncart.appendChild(noRecruitMsg);
            }
            
            // Toujours afficher les slots, même si aucune recrue disponible
            {
                // Afficher les slots de recrutement
                for (let i = 0; i < fixedRecruitmentSlots; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'slot';
                    
                    // Vérifier si une recrue est déjà assignée à ce slot
                    if (!selectedUnit.recrues_potentielles || !selectedUnit.recrues_potentielles[i]) {
                        // Slot vide : bouton d'affectation
                        const btn = document.createElement('button');
                        btn.innerHTML = '<span class="icon-chevron">⊕</span> Affecter une recrue';
                        btn.className = 'affect-btn';
                        btn.onclick = function() {
                            // Créer une sélection de recrues disponibles
                            const selectDiv = document.createElement('div');
                            selectDiv.className = 'recruit-selection';
                            
                            const select = document.createElement('select');
                            select.id = `selectRecruit-${i}`;
                            select.className = 'affect-select';
                            
                            let optionsHtml = '<option value="">Sélectionner une recrue...</option>';
                            availableRecruits.forEach(recruit => {
                                optionsHtml += `<option value="${recruit.id}">${recruit.pseudo}</option>`;
                            });
                            select.innerHTML = optionsHtml;
                            
                            const confirmBtn = document.createElement('button');
                            confirmBtn.innerHTML = 'Confirmer';
                            confirmBtn.className = 'affect-btn';
                            confirmBtn.onclick = function() {
                                const recruitId = select.value;
                                if (!recruitId) return;
                                
                                const recruit = allSoldiers.find(s => s.id === recruitId);
                                if (recruit) {
                                    // Initialiser le tableau des recrues si nécessaire
                                    if (!selectedUnit.recrues_potentielles) {
                                        selectedUnit.recrues_potentielles = [];
                                    }
                                    
                                    // Ajouter la recrue au slot
                                    selectedUnit.recrues_potentielles[i] = {
                                        id: recruit.id,
                                        pseudo: recruit.pseudo,
                                        grade: recruit.grade
                                    };
                                    
                                    // Mettre à jour l'unité du soldat
                                    recruit.unité = selectedUnit.id_unite; // Utiliser l'ID de l'unité au lieu du nom
                                    
                                    // Si c'est une recrue, mettre à jour sa progression
                                    if (recruit.statut && recruit.statut.toLowerCase() === 'recrue') {
                                        // Initialiser la progression si nécessaire
                                        if (!recruit.progression_recrue) {
                                            recruit.progression_recrue = {
                                                formation_initiale: {
                                                    complete: false,
                                                    date_debut: new Date().toISOString().split('T')[0],
                                                    date_fin: null,
                                                    escouade_provisoire: selectedUnit.id_unite,
                                                    parrain: null
                                                },
                                                modules: {
                                                    complete: false,
                                                    modules_valides: []
                                                },
                                                integration: {
                                                    complete: false,
                                                    date_debut: null,
                                                    date_fin: null,
                                                    unite: null
                                                }
                                            };
                                        } else {
                                            // Mettre à jour l'escouade provisoire dans la progression
                                            recruit.progression_recrue.formation_initiale.escouade_provisoire = selectedUnit.id_unite;
                                        }
                                        
                                        // Trouver le chef d'escouade pour le désigner comme parrain
                                        const chefEscouade = allSoldiers.find(s => 
                                            s.unité === selectedUnit.id_unite && 
                                            s.statut === 'Actif' && 
                                            (s.grade === 'Sergent' || s.grade === 'Sergent-Chef' || s.grade === 'Caporal-Chef')
                                        );
                                        
                                        if (chefEscouade) {
                                            recruit.progression_recrue.formation_initiale.parrain = chefEscouade.id;
                                        }
                                        
                                        // Ajouter un événement dans l'historique
                                        if (!recruit.historique) recruit.historique = [];
                                        recruit.historique.push({
                                            date: new Date().toISOString().split('T')[0],
                                            type: 'affectation',
                                            description: `Affectation à l'escouade ${selectedUnit.nom}`
                                        });
                                    }
                                    
                                    // Sauvegarder les modifications des soldats (utiliser la clé harmonisée)
                                    localStorage.setItem('eagleOperator_soldiers', JSON.stringify(allSoldiers));
                                    
                                    // Sauvegarder et rafraîchir
                                    saveUnitsToStorage();
                                    displayUnitDetails(selectedUnit.id_unite);
                                }
                            };
                            
                            selectDiv.appendChild(select);
                            selectDiv.appendChild(confirmBtn);
                            
                            // Remplacer le bouton par la sélection
                            slot.innerHTML = '';
                            slot.appendChild(selectDiv);
                        };
                        slot.appendChild(btn);
                    } else {
                        // Slot occupé : afficher la recrue avec le même style que les commandants/adjoints
                        const recruitInfo = document.createElement('div');
                        recruitInfo.className = 'recruit-info';
                        
                        // Récupérer les informations de la recrue
                        const recruitId = selectedUnit.recrues_potentielles[i].id;
                        const recruitData = allSoldiers.find(s => s.id === recruitId) || selectedUnit.recrues_potentielles[i];
                        
                        // Créer un bouton de retrait directement avec JavaScript
                        const removeButton = document.createElement('button');
                        removeButton.className = 'affect-btn';
                        removeButton.innerHTML = '<span class="icon-chevron">⊖</span> Retirer';
                        
                        // Ajouter l'événement directement au bouton
                        removeButton.addEventListener('click', function() {
                            // Récupérer l'ID de la recrue
                            const recruitId = selectedUnit.recrues_potentielles[i].id;
                            console.log(`Retrait de la recrue ${recruitId} du slot ${i}`);
                            
                            // Trouver le soldat correspondant et réinitialiser son unité
                            const soldier = allSoldiers.find(s => s.id === recruitId);
                            if (soldier) {
                                console.log(`Réinitialisation de l'unité pour ${soldier.pseudo}`);
                                soldier.unité = '';
                                // Sauvegarder les modifications des soldats
                                localStorage.setItem('eagle_soldiers', JSON.stringify(allSoldiers));
                            } else {
                                console.warn(`Soldat avec ID ${recruitId} non trouvé lors du retrait`);
                            }
                            
                            // Supprimer la recrue du slot
                            selectedUnit.recrues_potentielles[i] = null;
                            
                            // Nettoyer le tableau si tous les slots sont vides
                            const allEmpty = selectedUnit.recrues_potentielles.every(r => !r);
                            if (allEmpty) {
                                console.log(`Suppression complète de recrues_potentielles pour l'unité ${selectedUnit.nom}`);
                                delete selectedUnit.recrues_potentielles;
                            }
                            
                            // Sauvegarder et rafraîchir
                            saveUnitsToStorage();
                            displayUnitDetails(selectedUnit.id_unite);
                        });
                        
                        // Créer les éléments pour afficher les informations de la recrue
                        const roleElement = document.createElement('p');
                        roleElement.className = 'soldier-role recrue';
                        roleElement.innerHTML = '<strong>Rôle:</strong> Recrue en formation';
                        
                        const nameElement = document.createElement('p');
                        nameElement.className = 'recruit-name';
                        nameElement.textContent = recruitData.pseudo;
                        
                        const gradeElement = document.createElement('p');
                        gradeElement.innerHTML = `<small>(${recruitData.grade || 'Recrue'})</small>`;
                        
                        // Ajouter tous les éléments à recruitInfo
                        recruitInfo.appendChild(roleElement);
                        recruitInfo.appendChild(nameElement);
                        recruitInfo.appendChild(gradeElement);
                        recruitInfo.appendChild(removeButton);
                        
                        // Ajouter la recrue au DOM
                        slot.appendChild(recruitInfo);
                        
                        // recruitInfo est déjà ajouté au slot plus haut dans le code
                    }
                    slotsDiv.appendChild(slot);
                }
                recruitmentEncart.appendChild(slotsDiv);
            }
            
            unitDetailPane.appendChild(recruitmentEncart);

        } else { // Pour Groupe, Section, Compagnie, QG
            // Section Tableau Effectifs/Capacité/Commandant pour sous-unités directes
            const directSubordinates = allUnits.filter(sub => sub.superieur === selectedUnit.id_unite);
            if (directSubordinates.length > 0) {
                const tableEncart = createEncart('Effectifs et Commandement des Sous-unités');
                let tableHtml = '<table class="personnel-table"><thead><tr><th>Nom</th><th>Type</th><th>Effectif/Capacité</th><th>Commandant</th></tr></thead><tbody>';
                directSubordinates.forEach(subUnit => {
                    const subUnitPersonnel = getTotalPersonnel(subUnit.id_unite, allUnits, allSoldiers);
                    const subUnitMaxCapacity = getAggregateMaxCapacity(subUnit.id_unite, allUnits);
                    
                    // Recherche du commandant réel de la sous-unité
                    let subUnitCommanderName = 'Non assigné';
                    if (subUnit.commandant_id) {
                        const commander = allSoldiers.find(s => s.id === subUnit.commandant_id);
                        if (commander) {
                            subUnitCommanderName = `${commander.grade} ${commander.pseudo}`;
                        }
                    }
                    
                    // Recherche de l'adjoint si présent
                    let subUnitAdjointInfo = '';
                    if (subUnit.adjoint_id) {
                        const adjoint = allSoldiers.find(s => s.id === subUnit.adjoint_id);
                        if (adjoint) {
                            subUnitAdjointInfo = `<br><span class="adjoint-info">(Adj. ${adjoint.pseudo})</span>`;
                        }
                    }
                    
                    tableHtml += `<tr>
                        <td>${subUnit.nom}</td>
                        <td>${subUnit.type.replace('_', ' ')}</td>
                        <td>${subUnitPersonnel} / ${subUnitMaxCapacity}</td>
                        <td class="${subUnit.commandant_id ? 'has-commander' : 'no-commander'}">${subUnitCommanderName}${subUnitAdjointInfo}</td>
                    </tr>`;
                });
                tableHtml += '</tbody></table>';
                tableEncart.innerHTML += tableHtml;
                unitDetailPane.appendChild(tableEncart);
            }
        }
    }

    // Ajoute les listeners sur l'arbre d'unités
    function addEventListeners() {
        unitTreeContainer.addEventListener('click', function(event) {
            const target = event.target;

            // Handle unit name click for details AND toggle
            if (target.classList.contains('unit-name')) {
                const parentLi = target.closest('li');
                if (parentLi) {
                    const unitId = parentLi.dataset.unitId;
                    if (unitId) {
                        // Remove 'selected' from previously selected item
                        const currentlySelectedSpan = unitTreeContainer.querySelector('.unit-name.selected');
                        if (currentlySelectedSpan) {
                            currentlySelectedSpan.classList.remove('selected');
                        }
                        // Add 'selected' to current unit-name span
                        target.classList.add('selected');
                        displayUnitDetails(unitId);

                        // Also toggle collapse/expand if it has children
                        if (!parentLi.classList.contains('no-children')) {
                            parentLi.classList.toggle('collapsed');
                            parentLi.classList.toggle('expanded');
                        }
                    }
                }
            }
        });
    }

    // Crée un encart de détail réutilisable
    function createEncart(title) {
        const encartDiv = document.createElement('div');
        encartDiv.className = 'detail-encart';
        const titleH3 = document.createElement('h3');
        titleH3.textContent = title;
        encartDiv.appendChild(titleH3);
        return encartDiv;
    }

    /**
     * Ouvre la modale d'affectation d'opérateurs à une unité
     * @param {Object} unit - L'unité à laquelle affecter des opérateurs
     */
    openAssignSoldiersModal = function(unit) {
        try {
            // Stocker l'unité courante
            currentUnit = unit;
            
            // Mettre à jour le titre de la modale
            const unitNameTitle = document.getElementById('unit-name-title');
            if (unitNameTitle) {
                unitNameTitle.textContent = unit.nom || 'Unité';
            }
            
            // Réinitialiser la liste des soldats sélectionnés
            selectedSoldiers = [];
            
            // Réinitialiser le champ de recherche
            const searchInput = document.getElementById('soldier-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Afficher la modale
            const modal = document.getElementById('assignSoldiersModal');
            if (modal) {
                modal.style.display = 'block';
            }
            
            // Filtrer et afficher les soldats assignables
            filterAssignableSoldiers();
            
            // Ajouter les écouteurs d'événements
            addModalEventListeners();
        } catch (error) {
            console.error('Erreur lors de l\'ouverture de la modale d\'affectation:', error);
        }
    }

    /**
     * Ferme la modale d'affectation d'opérateurs
     */
    closeAssignSoldiersModal = function() {
        try {
            // Masquer la modale
            const modal = document.getElementById('assignSoldiersModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Réinitialiser les variables
            currentUnit = null;
            selectedSoldiers = [];
            
            // Vider la liste des soldats
            const soldiersList = document.getElementById('assignable-soldiers-list');
            if (soldiersList) {
                soldiersList.innerHTML = '';
            }
        } catch (error) {
            console.error('Erreur lors de la fermeture de la modale d\'affectation:', error);
        }
    }

    /**
     * Ajoute les écouteurs d'événements à la modale
     */
    function addModalEventListeners() {
        try {
            // Écouteur pour la fermeture de la modale
            const closeBtn = document.getElementById('closeAssignModal');
            if (closeBtn) {
                closeBtn.onclick = closeAssignSoldiersModal;
            }
            
            // Écouteur pour le bouton Annuler
            const cancelBtn = document.getElementById('cancelAssignBtn');
            if (cancelBtn) {
                cancelBtn.onclick = closeAssignSoldiersModal;
            }
            
            // Écouteur pour le bouton Confirmer
            const confirmBtn = document.getElementById('confirmAssignBtn');
            if (confirmBtn) {
                confirmBtn.onclick = assignSelectedSoldiers;
            }
            
            // Écouteur pour le champ de recherche
            const searchInput = document.getElementById('soldier-search');
            if (searchInput) {
                // Supprimer l'écouteur existant s'il y en a un
                searchInput.onkeyup = null;
                // Ajouter le nouvel écouteur
                searchInput.onkeyup = filterAssignableSoldiers;
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout des écouteurs d\'\u00e9vénements à la modale:', error);
        }
    }

    /**
     * Filtre et affiche les soldats assignables à l'unité
     */
    filterAssignableSoldiers = function() {
        try {
            const soldiersList = document.getElementById('assignable-soldiers-list');
            const searchInput = document.getElementById('soldier-search');
            
            if (!soldiersList) {
                console.error('Liste des soldats non trouvée dans le DOM');
                return;
            }
            
            // Vider la liste actuelle
            soldiersList.innerHTML = '';
            
            // Récupérer le terme de recherche
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            
            // Recharger les données des soldats pour avoir les plus récentes
            reloadSoldiersData();
            
            // Filtrer les soldats assignables
            const assignableSoldiers = allSoldiers.filter(soldier => {
                // Exclure les soldats inactifs
                if (soldier.status === 'Inactif' || soldier.statut === 'Inactif') return false;
                
                // Exclure les soldats déjà assignés à une unité
                if (soldier.unité && soldier.unité.trim() !== '') {
                    // Si le soldat est déjà dans l'unité courante, l'exclure aussi
                    if (soldier.unité === currentUnit.id_unite || soldier.unité === currentUnit.nom) {
                        return false;
                    }
                    return false;
                }
                
                // Filtrer par terme de recherche
                if (searchTerm) {
                    const nom = soldier.nom || soldier.lastName || '';
                    const prenom = soldier.prenom || soldier.firstName || '';
                    const pseudo = soldier.pseudo || '';
                    const matricule = soldier.matricule || '';
                    
                    return nom.toLowerCase().includes(searchTerm) ||
                           prenom.toLowerCase().includes(searchTerm) ||
                           pseudo.toLowerCase().includes(searchTerm) ||
                           matricule.toLowerCase().includes(searchTerm);
                }
                
                return true;
            });
            
            // Mettre à jour le compteur
            const soldiersCount = document.getElementById('soldiers-count');
            if (soldiersCount) {
                soldiersCount.textContent = assignableSoldiers.length;
            }
            
            // Afficher les soldats filtrés
            if (assignableSoldiers.length > 0) {
                assignableSoldiers.forEach(soldier => {
                    const soldierItem = createSoldierItemForAssignment(soldier);
                    soldiersList.appendChild(soldierItem);
                });
            } else {
                soldiersList.innerHTML = '<p class="no-results">Aucun soldat disponible pour cette unité.</p>';
            }
            
            // Mettre à jour l'état du bouton Confirmer
            updateAssignButtonState();
        } catch (error) {
            console.error('Erreur lors du filtrage des soldats assignables:', error);
        }
    }

    /**
     * Crée un élément de liste pour un soldat assignable
     * @param {Object} soldier - Le soldat à afficher
     * @returns {HTMLElement} L'élément de liste créé
     */
    function createSoldierItemForAssignment(soldier) {
        const item = document.createElement('div');
        item.className = 'soldier-item';
        item.dataset.soldierId = soldier.id;
        
        // Créer la case à cocher
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'soldier-checkbox';
        checkbox.dataset.soldierId = soldier.id;
        checkbox.onchange = function() {
            if (this.checked) {
                if (!selectedSoldiers.includes(soldier.id)) {
                    selectedSoldiers.push(soldier.id);
                }
            } else {
                const index = selectedSoldiers.indexOf(soldier.id);
                if (index !== -1) {
                    selectedSoldiers.splice(index, 1);
                }
            }
            updateAssignButtonState();
        };
        
        // Créer les informations du soldat
        const soldierInfo = document.createElement('div');
        soldierInfo.className = 'soldier-info';
        soldierInfo.innerHTML = `
            <div class="soldier-name">${soldier.pseudo || 'Sans pseudo'}</div>
            <div class="soldier-details">
                <span>${soldier.grade || 'Sans grade'}</span> | 
                <span>${soldier.nom || 'Sans nom'} ${soldier.prenom || ''}</span>
            </div>
        `;
        
        // Assembler l'élément
        item.appendChild(checkbox);
        item.appendChild(soldierInfo);
        
        return item;
    }

    /**
     * Met à jour l'état du bouton Confirmer en fonction des soldats sélectionnés
     */
    function updateAssignButtonState() {
        try {
            const confirmBtn = document.getElementById('confirmAssignBtn');
            const selectedCount = document.getElementById('selected-count');
            
            if (confirmBtn && selectedCount) {
                const count = selectedSoldiers.length;
                selectedCount.textContent = count;
                
                if (count > 0) {
                    confirmBtn.disabled = false;
                } else {
                    confirmBtn.disabled = true;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'\u00e9tat du bouton Confirmer:', error);
        }
    }

    /**
     * Assigne les soldats sélectionnés à l'unité courante
     */
    assignSelectedSoldiers = function() {
        try {
            if (!currentUnit || selectedSoldiers.length === 0) {
                console.error('Aucune unité courante ou aucun soldat sélectionné');
                return;
            }
            
            // Assigner chaque soldat sélectionné à l'unité
            selectedSoldiers.forEach(soldierId => {
                // Mettre à jour l'unité du soldat
                updateSoldierUnit(soldierId, currentUnit.nom);
            });
            
            // Fermer la modale
            closeAssignSoldiersModal();
            
            // Rafraîchir l'affichage des détails de l'unité
            displayUnitDetails(currentUnit.id_unite);
        } catch (error) {
            console.error('Erreur lors de l\'assignation des soldats sélectionnés:', error);
        }
    }
});