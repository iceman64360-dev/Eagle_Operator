// soldierPhotoManager.js
// Ce fichier contient des fonctions pour gérer les photos des soldats et les statuts

document.addEventListener('DOMContentLoaded', () => {
    // Migrer les anciennes photos vers le nouveau format
    migrateOldPhotos();
    
    // Appliquer les codes couleur aux statuts
    applyStatusColors();
    
    // Ajouter des écouteurs d'événements pour l'upload de photos
    setupPhotoUpload();
    
    // Rendre le cadre de la photo cliquable
    makePhotoContainerClickable();
    
    // Observer les changements dans le DOM pour mettre à jour les photos et les statuts
    observeDOMChanges();
    
    // Modifier le comportement du bouton Modifier
    updateEditButton();
});

// Fonction pour migrer les anciennes photos vers le nouveau format
function migrateOldPhotos() {
    // Récupérer les données des soldats
    const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
    let hasChanges = false;
    
    // Parcourir tous les soldats
    soldiersData.forEach(soldier => {
        // Si le soldat a une photo directement dans ses données (ancien format)
        if (soldier.photo) {
            // Créer une clé unique pour la photo basée sur le matricule du soldat
            const photoKey = `soldier_photo_${soldier.id}`;
            
            // Stocker la photo dans le localStorage avec une clé unique
            localStorage.setItem(photoKey, soldier.photo);
            
            // Mettre à jour la référence de la photo dans les données du soldat
            soldier.photoRef = photoKey;
            
            // Supprimer l'ancienne référence
            delete soldier.photo;
            
            hasChanges = true;
        }
    });
    
    // Sauvegarder les modifications si nécessaire
    if (hasChanges) {
        localStorage.setItem('eagle_soldiers', JSON.stringify(soldiersData));
        console.log('Photos migrées vers le nouveau format');
    }
}

// Fonction pour récupérer la photo d'un soldat
function getSoldierPhoto(soldier) {
    // Vérifier si le soldat a une référence de photo
    if (soldier.photoRef) {
        // Récupérer la photo depuis le localStorage avec la clé unique
        const photoData = localStorage.getItem(soldier.photoRef);
        if (photoData) {
            return photoData;
        }
    }
    
    // Si le soldat a une photo directement dans ses données (ancien format)
    if (soldier.photo) {
        // Migrer vers le nouveau format
        const photoKey = `soldier_photo_${soldier.id}`;
        localStorage.setItem(photoKey, soldier.photo);
        soldier.photoRef = photoKey;
        delete soldier.photo; // Supprimer l'ancienne référence
        
        // Sauvegarder les modifications
        const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
        const index = soldiersData.findIndex(s => s.id === soldier.id);
        if (index !== -1) {
            soldiersData[index] = soldier;
            localStorage.setItem('eagle_soldiers', JSON.stringify(soldiersData));
        }
        
        return localStorage.getItem(photoKey);
    }
    
    // Aucune photo trouvée
    return null;
}

// Fonction pour sauvegarder la photo d'un soldat
function saveSoldierPhoto(soldier, imageData) {
    // Créer une clé unique basée sur le matricule du soldat
    const photoKey = `soldier_photo_${soldier.id}`;
    
    // Sauvegarder la photo dans le localStorage avec le matricule comme nom de fichier
    localStorage.setItem(photoKey, imageData);
    
    // Mettre à jour la référence dans les données du soldat
    soldier.photoRef = photoKey;
    
    // Ajouter un attribut avec le matricule pour faciliter la recherche
    soldier.photoMatricule = soldier.id;
    
    // Supprimer l'ancienne propriété photo si elle existe
    if (soldier.photo) {
        delete soldier.photo;
    }
    
    // Mettre à jour les données des soldats dans le localStorage
    const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
    const index = soldiersData.findIndex(s => s.id === soldier.id);
    if (index !== -1) {
        soldiersData[index] = soldier;
        localStorage.setItem('eagle_soldiers', JSON.stringify(soldiersData));
        
        // Sauvegarder les données mises à jour sur le serveur
        fetch('/api/soldiers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(soldiersData)
        })
        .catch(error => console.error('Erreur lors de la sauvegarde des données sur le serveur:', error));
    }
    
    // Sauvegarder la photo sur le serveur
    fetch(`/api/photos/${soldier.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoData: imageData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Photo du soldat ${soldier.pseudo} (${soldier.id}) sauvegardée sur le serveur avec succès`);
            // Mettre à jour le chemin de la photo avec le chemin du serveur
            soldier.serverPhotoPath = data.path;
        }
    })
    .catch(error => console.error('Erreur lors de la sauvegarde de la photo sur le serveur:', error));
    
    console.log(`Photo du soldat ${soldier.pseudo} (${soldier.id}) sauvegardée localement sous la clé ${photoKey}`);
    return photoKey;
}

// Fonction pour appliquer les codes couleur aux statuts
function applyStatusColors() {
    // Ajouter les styles CSS pour les codes couleur des statuts
    const style = document.createElement('style');
    style.textContent = `
        .statut-color-actif {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            background-color: #2a803b;
        }
        
        .statut-color-inactif {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            background-color: #803a3a;
        }
        
        .statut-color-permission {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            background-color: #3a80a0;
        }
        
        .statut-color-recrue {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: #1c1e22;
            background-color: #ffbf00;
        }
        
        .statut-actif {
            border-top: 5px solid #2a803b;
        }
        
        .statut-inactif {
            border-top: 5px solid #803a3a;
        }
        
        .statut-permission {
            border-top: 5px solid #3a80a0;
        }
        
        .statut-recrue {
            border-top: 5px solid #ffbf00;
        }
    `;
    document.head.appendChild(style);
    
    // Observer les changements dans le DOM pour appliquer les codes couleur aux nouveaux éléments
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                // Parcourir les nœuds ajoutés
                mutation.addedNodes.forEach(node => {
                    // Vérifier si c'est un élément DOM
                    if (node.nodeType === 1) {
                        // Appliquer les codes couleur aux statuts
                        applyStatusColorsToNode(node);
                        
                        // Mettre à jour les photos
                        updatePhotosInNode(node);
                    }
                });
            }
        });
    });
    
    // Observer les changements dans le corps du document
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Appliquer les codes couleur aux éléments existants
    applyStatusColorsToNode(document.body);
    
    // Mettre à jour les photos dans les éléments existants
    updatePhotosInNode(document.body);
}

// Fonction pour appliquer les codes couleur aux statuts dans un nœud
function applyStatusColorsToNode(node) {
    // Trouver tous les éléments avec la classe soldier-card
    const soldierCards = node.querySelectorAll('.soldier-card');
    soldierCards.forEach(card => {
        // Vérifier si la carte a déjà été traitée
        if (card.hasAttribute('data-status-processed')) {
            return; // Ne pas traiter deux fois la même carte
        }
        
        // Marquer la carte comme traitée
        card.setAttribute('data-status-processed', 'true');
        
        // Appliquer la classe de bordure supérieure en fonction du statut
        // mais ne pas modifier le contenu du paragraphe de statut
        // car il est déjà formaté par soldierManager.js
        
        // Vérifier si la carte a déjà une classe de statut
        const hasStatusClass = Array.from(card.classList).some(cls => cls.startsWith('statut-'));
        
        // Si la carte n'a pas encore de classe de statut, essayer de l'ajouter
        if (!hasStatusClass) {
            const paragraphs = card.querySelectorAll('p');
            let statutElement = null;
            
            // Parcourir tous les paragraphes pour trouver celui qui contient "Statut:"
            for (const p of paragraphs) {
                if (p.textContent.includes('Statut:')) {
                    statutElement = p;
                    break;
                }
            }
            
            if (statutElement) {
                const statutText = statutElement.textContent.replace('Statut:', '').trim();
                const statutLower = statutText.toLowerCase();
                
                // Ajouter la classe de bordure appropriée à la carte
                switch(statutLower) {
                    case 'actif':
                        card.classList.add('statut-actif');
                        break;
                    case 'inactif':
                        card.classList.add('statut-inactif');
                        break;
                    case 'permission':
                    case 'en permission':
                        card.classList.add('statut-permission');
                        break;
                    case 'recrue':
                        card.classList.add('statut-recrue');
                        break;
                }
            }
        }
    });
}

// Fonction pour mettre à jour les photos dans un nœud - version optimisée
function updatePhotosInNode(node) {
    // Vérifier si la mise à jour est nécessaire
    if (!node) return;
    
    try {
        // Trouver tous les éléments avec la classe soldier-card
        const soldierCards = node.querySelectorAll('.soldier-card');
        
        soldierCards.forEach(card => {
            // Vérifier si la carte a déjà été traitée pour les photos
            if (card.hasAttribute('data-photo-processed')) {
                return; // Ne pas traiter deux fois la même carte
            }
            
            // Marquer la carte comme traitée
            card.setAttribute('data-photo-processed', 'true');
            
            // D'abord essayer de récupérer l'ID depuis l'attribut data-id
            let soldierId = null;
            
            if (card.hasAttribute('data-id')) {
                soldierId = card.getAttribute('data-id');
            } else {
                // Sinon, chercher dans les paragraphes
                const paragraphs = card.querySelectorAll('p');
                
                for (const p of paragraphs) {
                    if (p.textContent.includes('ID:')) {
                        soldierId = p.textContent.replace('ID:', '').trim();
                        break;
                    }
                }
            }
            
            // Si aucun ID n'a été trouvé, passer à la carte suivante
            if (!soldierId) return;
            
            // Récupérer les données du soldat
            const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
            const soldier = soldiersData.find(s => s.id === soldierId);
            
            if (soldier) {
                // Récupérer la photo du soldat
                const soldierPhoto = getSoldierPhoto(soldier);
                
                // Mettre à jour l'affichage de la photo uniquement si elle existe
                if (soldierPhoto) {
                    // Vérifier si la carte a déjà une photo
                    const existingPhoto = card.querySelector('.soldier-card-photo');
                    
                    if (existingPhoto) {
                        // Mettre à jour la photo existante
                        existingPhoto.innerHTML = `<img src="${soldierPhoto}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;            
                    } else {
                        // Créer un nouveau conteneur pour la photo
                        const newPhotoContainer = document.createElement('div');
                        newPhotoContainer.className = 'soldier-card-photo';
                        newPhotoContainer.innerHTML = `<img src="${soldierPhoto}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;            
                        
                        // Insérer le conteneur au début de la carte
                        if (card.firstChild) {
                            card.insertBefore(newPhotoContainer, card.firstChild);
                        } else {
                            card.appendChild(newPhotoContainer);
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des photos:', error);
    }
}

// Fonction pour configurer l'upload de photos
function setupPhotoUpload() {
    // Trouver le bouton d'édition de photo et l'input de fichier
    const photoEditBtn = document.getElementById('edit-photo-btn');
    const photoUpload = document.getElementById('photo-upload');
    
    if (photoEditBtn && photoUpload) {
        // Remplacer l'événement onchange de l'input de fichier
        photoUpload.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Vérifier que c'est bien une image
            if (!file.type.match('image.*')) {
                alert('Veuillez sélectionner une image.');
                return;
            }
            
            // Lire le fichier comme une URL de données
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                
                // Récupérer l'ID du soldat depuis l'attribut de la modale
                const soldierId = document.getElementById('soldierFileModal').getAttribute('data-soldier-id');
                const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
                const soldier = soldiersData.find(s => s.id === soldierId);
                
                if (!soldier) {
                    alert('Erreur: Soldat non trouvé.');
                    return;
                }
                
                // Utiliser notre fonction pour sauvegarder la photo
                saveSoldierPhoto(soldier, imageData);
                
                // Mettre à jour l'affichage
                const photoContainer = document.getElementById('photo-container');
                photoContainer.innerHTML = `<img src="${imageData}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;
                photoContainer.classList.remove('placeholder-photo');
            };
            reader.readAsDataURL(file);
        };
    }
}

// Fonction pour rendre le cadre de la photo cliquable
function makePhotoContainerClickable() {
    // Ajouter un gestionnaire d'événements directement au document pour capturer les clics sur le cadre photo
    document.addEventListener('click', function(event) {
        // Vérifier si l'élément cliqué est le conteneur de photo ou un de ses enfants
        let targetElement = event.target;
        while (targetElement != null) {
            if (targetElement.id === 'photo-container') {
                // Déclencher le sélecteur de fichier
                const photoUpload = document.getElementById('photo-upload');
                if (photoUpload) {
                    photoUpload.click();
                }
                break;
            }
            targetElement = targetElement.parentElement;
        }
    });
    
    // Configurer l'événement de changement de fichier
    document.addEventListener('change', function(event) {
        if (event.target.id === 'photo-upload') {
            handlePhotoUpload(event);
        }
    });
}

// Fonction pour gérer l'upload de photos
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifier que c'est bien une image
    if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image.');
        return;
    }
    
    // Récupérer l'ID du soldat depuis l'attribut de la modale
    const soldierId = document.getElementById('soldierFileModal').getAttribute('data-soldier-id');
    if (!soldierId) {
        alert('Erreur: Impossible d\'identifier le soldat.');
        return;
    }
    
    // Récupérer les données du soldat
    const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
    const soldier = soldiersData.find(s => s.id === soldierId);
    
    if (!soldier) {
        alert('Erreur: Soldat non trouvé.');
        return;
    }
    
    // Lire le fichier comme une URL de données
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // Utiliser notre fonction pour sauvegarder la photo avec le matricule du soldat
        saveSoldierPhoto(soldier, imageData);
        
        // Mettre à jour l'affichage de la photo dans le dossier
        const photoContainer = document.getElementById('photo-container');
        if (photoContainer) {
            photoContainer.innerHTML = `<img src="${imageData}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;            
            photoContainer.classList.remove('placeholder-photo');
        }
        
        // Mettre à jour l'affichage de la photo sur la carte du soldat
        const soldierCards = document.querySelectorAll(`.soldier-card[data-id="${soldier.id}"]`);
        soldierCards.forEach(soldierCard => {
            const cardPhotoContainers = soldierCard.querySelectorAll('.soldier-photo');
            cardPhotoContainers.forEach(cardPhotoContainer => {
                cardPhotoContainer.innerHTML = `<img src="${imageData}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;            
                cardPhotoContainer.classList.remove('placeholder-photo');
            });
        });
        
        // Sauvegarder les modifications dans le localStorage
        localStorage.setItem('eagle_soldiers', JSON.stringify(soldiersData));
        
        // Afficher un message de confirmation
        alert(`La photo du soldat ${soldier.pseudo} (${soldier.id}) a été mise à jour avec succès.`);
    };
    
    // Lire le fichier
    reader.readAsDataURL(file);
}

// Fonction pour observer les changements dans le DOM - version optimisée
function observeDOMChanges() {
    // Utiliser un délai pour limiter la fréquence des mises à jour
    let updateTimeout = null;
    
    // Observer les changements dans le DOM pour mettre à jour les photos et les statuts
    const observer = new MutationObserver(mutations => {
        // Annuler le timeout précédent si un nouveau changement est détecté
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        
        // Créer un nouveau timeout pour décaler la mise à jour
        updateTimeout = setTimeout(() => {
            // Vérifier si la modale du dossier soldat est ouverte
            const modal = document.getElementById('soldierFileModal');
            if (modal && !modal.classList.contains('hidden-modal')) {
                // Récupérer l'ID du soldat
                const soldierId = modal.getAttribute('data-soldier-id');
                if (soldierId) {
                    try {
                        // Récupérer les données du soldat
                        const soldiersData = JSON.parse(localStorage.getItem('eagle_soldiers') || '[]');
                        const soldier = soldiersData.find(s => s.id === soldierId);
                        
                        if (soldier) {
                            // Mettre à jour la photo
                            updateSoldierPhoto(soldier);
                        }
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour de la photo:', error);
                    }
                }
            }
        }, 200); // Délai de 200ms pour éviter les mises à jour trop fréquentes
    });
    
    // Observer uniquement les changements de premier niveau dans le corps du document
    // pour réduire la charge de traitement
    observer.observe(document.body, { childList: true, subtree: false });
}

// Fonction pour mettre à jour la photo d'un soldat dans le dossier - version optimisée
function updateSoldierPhoto(soldier) {
    // Vérifier si la mise à jour est nécessaire
    if (!soldier) return;
    
    try {
        // Récupérer la photo du soldat
        const soldierPhoto = getSoldierPhoto(soldier);
        
        // Mettre à jour l'affichage de la photo
        if (soldierPhoto) {
            const photoContainer = document.getElementById('photo-container');
            if (photoContainer) {
                // Vérifier si la photo a changé
                const currentImg = photoContainer.querySelector('img');
                const currentSrc = currentImg ? currentImg.src : null;
                
                // Ne mettre à jour que si la photo a changé
                if (!currentSrc || currentSrc !== soldierPhoto) {
                    // Créer l'image en mémoire avant de l'ajouter au DOM
                    const img = new Image();
                    img.src = soldierPhoto;
                    img.alt = `Photo de ${soldier.pseudo}`;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    
                    // Vider le conteneur et ajouter la nouvelle image
                    photoContainer.innerHTML = '';
                    photoContainer.appendChild(img);
                    photoContainer.classList.remove('placeholder-photo');
                }
                
                // Rendre le conteneur de photo cliquable une seule fois
                if (!photoContainer.hasAttribute('data-clickable')) {
                    photoContainer.style.cursor = 'pointer';
                    photoContainer.setAttribute('data-clickable', 'true');
                    
                    // Utiliser un gestionnaire d'événements simple
                    photoContainer.onclick = function() {
                        const photoUpload = document.getElementById('photo-upload');
                        if (photoUpload) photoUpload.click();
                    };
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la photo:', error);
    }
}

// Fonction pour modifier le comportement du bouton Modifier
function updateEditButton() {
    // Observer les changements dans le DOM pour détecter quand le bouton Modifier est ajouté
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                const editBtn = document.getElementById('editSoldierFileBtn');
                if (editBtn) {
                    // Masquer le bouton Modifier car il ne sert plus à rien
                    editBtn.style.display = 'none';
                }
            }
        });
    });
    
    // Observer les changements dans le corps du document
    observer.observe(document.body, { childList: true, subtree: true });
}

// Fonction utilitaire pour rechercher des éléments contenant un texte spécifique
function findElementsWithText(element, selector, text) {
    // Utiliser la méthode native querySelectorAll
    const elements = Array.from(element.querySelectorAll(selector || '*'));
    // Filtrer les éléments qui contiennent le texte spécifié
    return elements.filter(el => el.textContent.includes(text));
}

// Fonction utilitaire pour trouver le premier élément contenant un texte spécifique
function findElementWithText(element, selector, text) {
    // Utiliser la méthode native querySelectorAll
    const elements = Array.from(element.querySelectorAll(selector || '*'));
    // Trouver le premier élément qui contient le texte spécifié
    return elements.find(el => el.textContent.includes(text)) || null;
}
