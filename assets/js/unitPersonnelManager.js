// Module de gestion du personnel des unités
// Ce fichier contient les fonctions pour gérer le personnel des unités (statut, rôle, retrait)

/**
 * Met à jour le statut d'un soldat
 * @param {string} status - Nouveau statut
 * @param {string} soldierId - ID du soldat
 */
function updateSoldierStatus(status, soldierId) {
    try {
        console.log(`Mise à jour du statut du soldat ${soldierId} vers ${status}`);
        
        // Récupérer les données des soldats
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
        
        if (soldierIndex === -1) {
            console.error(`Soldat ${soldierId} non trouvé dans la base de données`);
            alert('Erreur: Soldat non trouvé.');
            return;
        }
        
        // Mettre à jour le statut
        soldiers[soldierIndex].statut = status;
        
        // Sauvegarder les modifications
        localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
        
        // Afficher un message de confirmation
        console.log(`Statut du soldat ${soldierId} mis à jour vers ${status}`);
        
        // Mettre à jour l'affichage sans recharger la page
        // On pourrait ajouter une animation ou un indicateur visuel ici
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du soldat:', error);
        alert('Une erreur est survenue lors de la mise à jour du statut. Veuillez réessayer.');
    }
}

/**
 * Met à jour le rôle d'un soldat dans une unité
 * @param {string} role - Nouveau rôle
 * @param {string} soldierId - ID du soldat
 */
function updateSoldierRole(role, soldierId) {
    try {
        console.log(`Mise à jour du rôle du soldat ${soldierId} vers ${role}`);
        
        // Récupérer les données des soldats
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
        
        if (soldierIndex === -1) {
            console.error(`Soldat ${soldierId} non trouvé dans la base de données`);
            alert('Erreur: Soldat non trouvé.');
            return;
        }
        
        // Mettre à jour le rôle
        soldiers[soldierIndex].role = role;
        
        // Sauvegarder les modifications
        localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
        
        // Afficher un message de confirmation
        console.log(`Rôle du soldat ${soldierId} mis à jour vers ${role}`);
        
        // Mettre à jour l'affichage sans recharger la page
        // On pourrait ajouter une animation ou un indicateur visuel ici
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle du soldat:', error);
        alert('Une erreur est survenue lors de la mise à jour du rôle. Veuillez réessayer.');
    }
}

/**
 * Retire un soldat d'une unité
 * @param {string} soldierId - ID du soldat
 * @param {string} unitId - ID de l'unité
 */
function removeSoldierFromUnit(soldierId, unitId) {
    try {
        console.log(`Retrait du soldat ${soldierId} de l'unité ${unitId}`);
        
        // Demander confirmation
        if (!confirm('Êtes-vous sûr de vouloir retirer ce soldat de l\'unité ?')) {
            return;
        }
        
        // Récupérer les données des soldats
        const soldiers = JSON.parse(localStorage.getItem('eagleOperator_soldiers') || '[]');
        const soldierIndex = soldiers.findIndex(s => s.id === soldierId);
        
        if (soldierIndex === -1) {
            console.error(`Soldat ${soldierId} non trouvé dans la base de données`);
            alert('Erreur: Soldat non trouvé.');
            return;
        }
        
        // Récupérer les données des unités
        const units = JSON.parse(localStorage.getItem('eagleOperator_units') || '[]');
        const unitIndex = units.findIndex(u => u.id_unite === unitId || u.id === unitId);
        
        if (unitIndex === -1) {
            console.error(`Unité ${unitId} non trouvée dans la base de données`);
            alert('Erreur: Unité non trouvée.');
            return;
        }
        
        // Vérifier si le soldat est le commandant ou l'adjoint de l'unité
        const unit = units[unitIndex];
        if (unit.commandant_id === soldierId) {
            if (!confirm('Ce soldat est le commandant de l\'unité. Êtes-vous sûr de vouloir le retirer ?')) {
                return;
            }
            // Retirer le commandant de l'unité
            delete unit.commandant_id;
        } else if (unit.adjoint_id === soldierId) {
            if (!confirm('Ce soldat est l\'adjoint de l\'unité. Êtes-vous sûr de vouloir le retirer ?')) {
                return;
            }
            // Retirer l'adjoint de l'unité
            delete unit.adjoint_id;
        }
        
        // Retirer l'unité du soldat
        soldiers[soldierIndex].unité = "";
        soldiers[soldierIndex].unité_id = "";
        soldiers[soldierIndex].role = "";
        
        // Sauvegarder les modifications
        localStorage.setItem('eagleOperator_soldiers', JSON.stringify(soldiers));
        localStorage.setItem('eagleOperator_units', JSON.stringify(units));
        
        // Afficher un message de confirmation
        alert(`Le soldat ${soldiers[soldierIndex].pseudo} a été retiré de l'unité.`);
        
        // Recharger la page pour voir les changements
        location.reload();
    } catch (error) {
        console.error('Erreur lors du retrait du soldat de l\'unité:', error);
        alert('Une erreur est survenue lors du retrait du soldat. Veuillez réessayer.');
    }
}

// Exposer les fonctions globalement
window.updateSoldierStatus = updateSoldierStatus;
window.updateSoldierRole = updateSoldierRole;
window.removeSoldierFromUnit = removeSoldierFromUnit;
