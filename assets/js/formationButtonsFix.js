/**
 * Script de correction des boutons de fermeture des modales de formations
 * Ce script s'assure que les boutons de fermeture fonctionnent correctement
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de la correction des boutons de fermeture...');
    setupFormationCloseButtons();
});

/**
 * Configure les boutons de fermeture des modales de formations
 */
function setupFormationCloseButtons() {
    // Boutons de fermeture des modales
    const closeButtons = [
        { id: 'close-formation-detail-btn', modalId: 'formation-detail-modal' },
        { id: 'close-formation-edit-btn', modalId: 'formation-edit-modal' },
        { id: 'close-assign-soldiers-btn', modalId: 'assign-soldiers-modal' },
        { id: 'cancel-formation', modalId: 'formation-edit-modal' },
        { id: 'cancel-assign', modalId: 'assign-soldiers-modal' }
    ];
    
    // Ajouter des gestionnaires d'événements pour chaque bouton
    closeButtons.forEach(button => {
        const btn = document.getElementById(button.id);
        const modal = document.getElementById(button.modalId);
        
        if (btn && modal) {
            console.log(`Configuration du bouton ${button.id} pour la modale ${button.modalId}`);
            
            // Supprimer tous les gestionnaires d'événements existants
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // Ajouter un nouveau gestionnaire d'événement
            newBtn.addEventListener('click', function(e) {
                console.log(`Bouton ${button.id} cliqué, fermeture de la modale ${button.modalId}`);
                closeFormationModal(button.modalId);
            });
        } else {
            console.warn(`Bouton ${button.id} ou modale ${button.modalId} non trouvé`);
        }
    });
    
    // Ajouter un gestionnaire d'événement pour la touche Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Trouver la modale visible
            const visibleModals = document.querySelectorAll('.modal-bg:not(.hidden-modal)');
            visibleModals.forEach(modal => {
                console.log(`Touche Échap pressée, fermeture de la modale ${modal.id}`);
                closeFormationModal(modal.id);
            });
        }
    });
    
    // Ajouter un gestionnaire d'événement pour le clic sur l'arrière-plan des modales
    document.querySelectorAll('.modal-bg').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                console.log(`Clic sur l'arrière-plan, fermeture de la modale ${modal.id}`);
                closeFormationModal(modal.id);
            }
        });
    });
    
    console.log('Configuration des boutons de fermeture terminée');
}

/**
 * Ferme une modale de formation
 * @param {string} modalId - ID de la modale à fermer
 */
function closeFormationModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modale ${modalId} non trouvée`);
        return;
    }
    
    // Masquer la modale
    modal.classList.add('hidden-modal');
    console.log(`Modale ${modalId} fermée`);
    
    // Réinitialiser les données si nécessaire
    if (modalId === 'formation-edit-modal' && typeof resetFormationForm === 'function') {
        resetFormationForm();
        console.log('Formulaire de formation réinitialisé');
    }
    
    if (modalId === 'assign-soldiers-modal' && typeof selectedSoldiers !== 'undefined') {
        selectedSoldiers = [];
        console.log('Liste des soldats sélectionnés réinitialisée');
    }
}
