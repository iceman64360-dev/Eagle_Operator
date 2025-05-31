// Module d'assignation d'opérateurs aux unités
// Ce fichier contient toutes les fonctions nécessaires pour assigner des opérateurs aux unités

// Variables globales pour la modale d'assignation
let currentAssignUnit = null;
let selectedOperators = [];

/**
 * Récupère toutes les unités depuis le localStorage
 * @returns {Array} Liste des unités
 */
function getUnits() {
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
 * Récupère tous les soldats depuis le localStorage
 * @returns {Array} Liste des soldats
 */
function getSoldiers() {
    try {
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        return Array.isArray(soldiers) ? soldiers : [];
    } catch (error) {
        console.error('Erreur lors de la récupération des soldats:', error);
        return [];
    }
}

/**
 * Met à jour l'unité d'un soldat
 * @param {string} soldierId - ID du soldat
 * @param {string} unitName - Nom de l'unité
 * @param {boolean} isRemove - Si true, retire l'affectation
 * @returns {boolean} - True si la mise à jour a réussi
 */
function updateSoldierUnitAssignment(soldierId, unitName, isRemove = false) {
    try {
        const soldiers = getSoldiers();
        const soldier = soldiers.find(s => s.id === soldierId);
        
        if (soldier) {
            // Si on retire l'affectation, on vide le champ unité
            soldier.unité = isRemove ? "" : unitName;
            
            // Sauvegarder les modifications des soldats
            localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
            console.log(`Unité du soldat ${soldierId} mise à jour: ${soldier.unité}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'unité du soldat:', error);
        return false;
    }
}

/**
 * Ouvre la modale d'assignation d'opérateurs
 * @param {string} unitId - ID de l'unité
 */
function openAssignOperatorsModal(unitId) {
    try {
        console.log('Ouverture de la modale d\'assignation pour l\'unité:', unitId);
        
        // Récupérer l'unité
        const units = getUnits();
        const unit = units.find(u => u.id_unite === unitId || u.id === unitId);
        
        if (!unit) {
            console.error('Unité non trouvée:', unitId);
            alert('Erreur: Unité non trouvée.');
            return;
        }
        
        // Stocker l'unité courante
        currentAssignUnit = unit;
        
        // Réinitialiser la liste des soldats sélectionnés
        selectedOperators = [];
        
        // Mettre à jour le titre de la modale
        const unitNameTitle = document.getElementById('unit-name-title');
        if (unitNameTitle) {
            unitNameTitle.textContent = unit.nom || unit.name || 'Unité';
        }
        
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
            alert('Erreur: La modale d\'assignation n\'a pas été trouvée dans le DOM.');
            return;
        }
        
        // Ajouter les écouteurs d'événements
        addAssignModalEventListeners();
        
        // Filtrer et afficher les soldats assignables
        filterAssignableSoldiers();
    } catch (error) {
        console.error('Erreur lors de l\'ouverture de la modale d\'assignation:', error);
        alert('Une erreur est survenue lors de l\'ouverture de la modale d\'assignation.');
    }
}

/**
 * Ferme la modale d'assignation d'opérateurs
 */
function closeAssignOperatorsModal() {
    try {
        // Masquer la modale
        const modal = document.getElementById('assignSoldiersModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Réinitialiser les variables
        currentAssignUnit = null;
        selectedOperators = [];
    } catch (error) {
        console.error('Erreur lors de la fermeture de la modale d\'assignation:', error);
    }
}

/**
 * Ajoute les écouteurs d'événements à la modale
 */
function addAssignModalEventListeners() {
    try {
        // Écouteur pour la fermeture de la modale
        const closeBtn = document.getElementById('closeAssignModal');
        if (closeBtn) {
            closeBtn.onclick = closeAssignOperatorsModal;
        }
        
        // Écouteur pour le bouton Annuler
        const cancelBtn = document.getElementById('cancelAssignBtn');
        if (cancelBtn) {
            cancelBtn.onclick = closeAssignOperatorsModal;
        }
        
        // Écouteur pour le bouton Confirmer
        const confirmBtn = document.getElementById('confirmAssignBtn');
        if (confirmBtn) {
            confirmBtn.onclick = assignSelectedOperators;
        }
        
        // Écouteur pour le champ de recherche
        const searchInput = document.getElementById('soldier-search');
        if (searchInput) {
            searchInput.onkeyup = filterAssignableSoldiers;
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout des écouteurs d\'événements à la modale:', error);
    }
}

/**
 * Filtre et affiche les soldats assignables à l'unité
 */
function filterAssignableSoldiers() {
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
        
        // Récupérer tous les soldats
        const allSoldiers = getSoldiers();
        
        // Filtrer les soldats assignables
        const assignableSoldiers = allSoldiers.filter(soldier => {
            // Exclure les soldats inactifs
            if (soldier.status === 'Inactif' || soldier.statut === 'Inactif') {
                return false;
            }
            
            // Exclure les recrues (vérifier tous les champs possibles)
            if (
                soldier.status === 'Recru' || 
                soldier.statut === 'Recru' || 
                soldier.grade === 'Recru' || 
                (soldier.grade && soldier.grade.toLowerCase().includes('recru'))
            ) {
                console.log('Exclu car recru:', soldier.pseudo, soldier.status, soldier.statut, soldier.grade);
                return false;
            }
            
            // Exclure les soldats déjà assignés à une unité
            if (soldier.unité && soldier.unité.trim() !== '') {
                // Si le soldat est déjà dans l'unité courante, l'exclure aussi
                if (currentAssignUnit && (soldier.unité === currentAssignUnit.id_unite || soldier.unité === currentAssignUnit.nom)) {
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
    try {
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
                if (!selectedOperators.includes(soldier.id)) {
                    selectedOperators.push(soldier.id);
                }
            } else {
                const index = selectedOperators.indexOf(soldier.id);
                if (index !== -1) {
                    selectedOperators.splice(index, 1);
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
    } catch (error) {
        console.error('Erreur lors de la création de l\'élément soldat:', error);
        return document.createElement('div');
    }
}

/**
 * Met à jour l'état du bouton d'assignation en fonction des soldats sélectionnés
 */
function updateAssignButtonState() {
    try {
        const confirmBtn = document.getElementById('confirmAssignBtn');
        const selectedCount = document.getElementById('selected-count');
        
        if (confirmBtn && selectedCount) {
            const count = selectedOperators.length;
            selectedCount.textContent = count;
            
            if (count > 0) {
                confirmBtn.disabled = false;
            } else {
                confirmBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'état du bouton Confirmer:', error);
    }
}

/**
 * Assigne les soldats sélectionnés à l'unité courante
 */
function assignSelectedOperators() {
    try {
        console.log('Fonction assignSelectedOperators appelée');
        console.log('Unité courante:', currentAssignUnit);
        console.log('Soldats sélectionnés:', selectedOperators);
        
        if (!currentAssignUnit) {
            console.error('Aucune unité courante définie');
            alert('Erreur: Aucune unité sélectionnée pour l\'affectation.');
            return;
        }
        
        if (selectedOperators.length === 0) {
            console.error('Aucun soldat sélectionné');
            alert('Veuillez sélectionner au moins un soldat à affecter.');
            return;
        }
        
        // Assigner chaque soldat sélectionné à l'unité
        selectedOperators.forEach(soldierId => {
            // Mettre à jour l'unité du soldat
            const unitName = currentAssignUnit.nom || currentAssignUnit.name || 'Unité sans nom';
            console.log(`Affectation du soldat ${soldierId} à l'unité ${unitName}`);
            updateSoldierUnitAssignment(soldierId, unitName);
        });
        
        // Fermer la modale
        closeAssignOperatorsModal();
        
        // Afficher un message de succès
        alert(`${selectedOperators.length} soldat(s) affecté(s) avec succès à l'unité ${currentAssignUnit.nom || currentAssignUnit.name}.`);
        
        // Recharger la page pour voir les changements
        location.reload();
    } catch (error) {
        console.error('Erreur lors de l\'assignation des soldats sélectionnés:', error);
        alert('Une erreur est survenue lors de l\'affectation des soldats. Veuillez réessayer.');
    }
}

// Exposer les fonctions globalement
window.openAssignOperatorsModal = openAssignOperatorsModal;
window.closeAssignOperatorsModal = closeAssignOperatorsModal;
window.assignSelectedOperators = assignSelectedOperators;
window.filterAssignableSoldiers = filterAssignableSoldiers;
