/**
 * SOLUTION D'URGENCE POUR FERMER LES MODALES
 * Ce script remplace les boutons de fermeture existants
 * et force la fermeture des modales sans dépendre du code existant
 */

// Exécution immédiate
(function() {
    console.log('SOLUTION D\'URGENCE POUR FERMER LES MODALES ACTIVÉE');
    
    // S'exécuter immédiatement et après le chargement du DOM
    enhanceCloseButtons();
    document.addEventListener('DOMContentLoaded', enhanceCloseButtons);
    
    // Vérifier toutes les 500ms si de nouvelles modales sont apparues
    setInterval(enhanceCloseButtons, 500);
})();

/**
 * Améliore les boutons de fermeture existants dans les modales
 */
function enhanceCloseButtons() {
    // Identifier toutes les modales
    const modals = document.querySelectorAll('.modal-bg');
    
    console.log(`${modals.length} modales trouvées`);
    
    // Pour chaque modale
    modals.forEach(modal => {
        // Trouver tous les boutons de fermeture existants
        const closeButtons = modal.querySelectorAll('.close-formation-btn, .close-dossier-btn, #close-formation-detail-btn, #close-formation-edit-btn, #close-assign-soldiers-btn, #cancel-formation, #cancel-assign');
        
        // Si des boutons existent, les améliorer
        if (closeButtons.length > 0) {
            closeButtons.forEach(button => {
                // Vérifier si le bouton a déjà été amélioré
                if (!button.dataset.enhanced) {
                    console.log(`Amélioration du bouton ${button.id || button.className} dans la modale ${modal.id}`);
                    
                    // Supprimer tous les gestionnaires d'événements existants
                    const newButton = button.cloneNode(true);
                    if (button.parentNode) {
                        button.parentNode.replaceChild(newButton, button);
                    }
                    
                    // Ajouter le nouveau gestionnaire d'événement
                    newButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Fermeture de la modale ${modal.id} via bouton ${newButton.id || newButton.className}`);
                        forceCloseModal(modal);
                        return false;
                    });
                    
                    // Marquer le bouton comme amélioré
                    newButton.dataset.enhanced = 'true';
                }
            });
        } else {
            // Si aucun bouton n'existe, ajouter un bouton de fermeture dans l'en-tête
            const modalHeader = modal.querySelector('.modal-header-container');
            
            if (modalHeader && !modalHeader.querySelector('.enhanced-close-btn')) {
                console.log(`Ajout d'un bouton de fermeture à la modale ${modal.id}`);
                
                // Créer un bouton de fermeture
                const closeButton = document.createElement('button');
                closeButton.className = 'close-formation-btn enhanced-close-btn';
                closeButton.textContent = 'Fermer';
                
                // Ajouter le gestionnaire d'événement
                closeButton.addEventListener('click', function() {
                    console.log(`Fermeture de la modale ${modal.id} via bouton ajouté`);
                    forceCloseModal(modal);
                });
                
                // Ajouter le bouton à l'en-tête de la modale
                modalHeader.appendChild(closeButton);
            }
        }
    });
    
    // Ajouter un gestionnaire global pour la touche Échap
    if (!window.escapeHandlerAdded) {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const visibleModals = Array.from(document.querySelectorAll('.modal-bg')).filter(modal => {
                    return !modal.classList.contains('hidden-modal') && 
                           window.getComputedStyle(modal).display !== 'none';
                });
                
                if (visibleModals.length > 0) {
                    console.log(`Fermeture d'urgence par touche Échap de ${visibleModals.length} modales`);
                    visibleModals.forEach(forceCloseModal);
                }
            }
        });
        
        window.escapeHandlerAdded = true;
    }
    
    // Ajouter des gestionnaires de clic sur l'arrière-plan pour toutes les modales
    document.querySelectorAll('.modal-bg').forEach(modal => {
        if (!modal.dataset.backgroundClickHandlerAdded) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    console.log(`Fermeture d'urgence par clic sur l'arrière-plan de la modale ${modal.id}`);
                    forceCloseModal(modal);
                }
            });
            
            modal.dataset.backgroundClickHandlerAdded = 'true';
        }
    });
}

/**
 * Force la fermeture d'une modale
 * @param {HTMLElement} modal - Élément DOM de la modale à fermer
 */
function forceCloseModal(modal) {
    if (!modal) return;
    
    // Ajouter la classe hidden-modal
    modal.classList.add('hidden-modal');
    
    // Forcer le style display à none
    modal.style.display = 'none';
    
    console.log(`Modale ${modal.id} fermée de force`);
    
    // Réinitialiser les variables globales si nécessaire
    try {
        if (modal.id === 'formation-edit-modal' && typeof resetFormationForm === 'function') {
            resetFormationForm();
        }
        
        if (modal.id === 'assign-soldiers-modal' && typeof window.selectedSoldiers !== 'undefined') {
            window.selectedSoldiers = [];
        }
    } catch (e) {
        console.error('Erreur lors de la réinitialisation des données:', e);
    }
}
