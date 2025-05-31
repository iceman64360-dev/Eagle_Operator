/**
 * Solution d'urgence pour les modales Eagle Operator
 * Ce script force la fermeture des modales
 */

// Exécuter immédiatement et à chaque chargement de page
(function() {
    console.log('SOLUTION D\'URGENCE POUR LES MODALES ACTIVÉE');
    // Exécuter immédiatement
    fixModalsNow();
    
    // Et aussi après le chargement complet du DOM
    document.addEventListener('DOMContentLoaded', fixModalsNow);
    
    // Et toutes les secondes pour s'assurer que ça fonctionne
    setInterval(fixModalsNow, 1000);
})();

/**
 * Applique immédiatement la solution pour les modales
 */
function fixModalsNow() {
    console.log('Application de la solution d\'urgence pour les modales...');
    
    // Forcer l'ajout des gestionnaires d'événements pour tous les boutons de fermeture
    addCloseHandlers();
    
    // Ajouter des boutons de fermeture d'urgence à toutes les modales
    addEmergencyCloseButtons();
}

/**
 * Ajoute des gestionnaires d'événements à tous les boutons de fermeture
 */
function addCloseHandlers() {
    // Boutons de fermeture spécifiques
    const closeButtons = [
        { id: 'close-formation-detail', modalId: 'formation-detail-modal' },
        { id: 'close-formation-edit', modalId: 'formation-edit-modal' },
        { id: 'close-assign-soldiers', modalId: 'assign-soldiers-modal' },
        { id: 'cancel-formation', modalId: 'formation-edit-modal' },
        { id: 'cancel-assign', modalId: 'assign-soldiers-modal' }
    ];
    
    // Ajouter des gestionnaires pour chaque bouton
    closeButtons.forEach(button => {
        const btn = document.getElementById(button.id);
        const modal = document.getElementById(button.modalId);
        
        if (btn && modal) {
            // Supprimer tous les gestionnaires existants
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // Ajouter le nouveau gestionnaire
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Fermeture forcée de ${button.modalId} via ${button.id}`);
                forceCloseModal(button.modalId);
                return false;
            });
        }
    });
    
    // Gestionnaires pour tous les boutons avec les classes spécifiques
    document.querySelectorAll('.close-formation-btn, .close-dossier-btn').forEach(btn => {
        // Trouver la modale parente
        const modal = btn.closest('.modal-bg');
        if (modal) {
            // Supprimer les gestionnaires existants
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // Ajouter le nouveau gestionnaire
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Fermeture forcée de ${modal.id} via bouton de fermeture`);
                forceCloseModal(modal.id);
                return false;
            });
        }
    });
    
    // Gestionnaire global pour la touche Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const visibleModals = document.querySelectorAll('.modal-bg:not(.hidden-modal)');
            visibleModals.forEach(modal => forceCloseModal(modal.id));
        }
    });
    
    // Gestionnaire de clic sur l'arrière-plan pour toutes les modales
    document.querySelectorAll('.modal-bg').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                forceCloseModal(modal.id);
            }
        });
    });
}

/**
 * Ajoute des boutons de fermeture d'urgence à toutes les modales
 */
function addEmergencyCloseButtons() {
    document.querySelectorAll('.modal-bg').forEach(modal => {
        // Vérifier si un bouton d'urgence existe déjà
        if (!modal.querySelector('.emergency-close-btn')) {
            // Créer un bouton de fermeture d'urgence
            const emergencyBtn = document.createElement('button');
            emergencyBtn.className = 'emergency-close-btn';
            emergencyBtn.innerHTML = 'FERMER';
            emergencyBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; ' +
                                       'background-color: red; color: white; padding: 10px 20px; ' +
                                       'border: none; border-radius: 5px; cursor: pointer; ' +
                                       'font-weight: bold; font-size: 16px;';
            
            // Ajouter le gestionnaire d'événement
            emergencyBtn.addEventListener('click', function() {
                forceCloseModal(modal.id);
            });
            
            // Ajouter le bouton à la modale
            modal.appendChild(emergencyBtn);
        }
    });
}

/**
 * Force la fermeture d'une modale
 * @param {string} modalId - ID de la modale à fermer
 */
function forceCloseModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    console.log(`Fermeture forcée de la modale: ${modalId}`);
    
    // Ajouter la classe hidden-modal
    modal.classList.add('hidden-modal');
    
    // Réinitialiser les variables globales si nécessaire
    if (modalId === 'assign-soldiers-modal' && typeof window.selectedSoldiers !== 'undefined') {
        window.selectedSoldiers = [];
    }
    
    // Réinitialiser le formulaire si nécessaire
    if (modalId === 'formation-edit-modal' && typeof window.resetFormationForm === 'function') {
        try {
            window.resetFormationForm();
        } catch (e) {
            console.error('Erreur lors de la réinitialisation du formulaire:', e);
        }
    }
}
