// assets/js/soldierManager.js
document.addEventListener('DOMContentLoaded', () => {
    const soldierListDiv = document.getElementById('soldierList');
    const searchInput = document.getElementById('searchSoldier');
    const gradeFilter = document.getElementById('filterGrade');
    const statusFilter = document.getElementById('filterStatus');
    const resetFiltersButton = document.getElementById('resetFilters');
    const loadingMessage = document.getElementById('loadingMessage');

    let allSoldiersData = []; // Pour stocker tous les soldats récupérés
    
    // Fonction pour vérifier les paramètres d'URL et appliquer les filtres automatiquement
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const statutParam = urlParams.get('statut');
        
        if (statutParam && statusFilter) {
            // Définir le filtre de statut selon le paramètre URL
            statusFilter.value = statutParam;
            
            // Appliquer le filtre immédiatement après le chargement des données
            const applyUrlFilter = () => {
                if (allSoldiersData.length > 0) {
                    filterAndSearchSoldiers();
                } else {
                    // Si les données ne sont pas encore chargées, réessayer dans 100ms
                    setTimeout(applyUrlFilter, 100);
                }
            };
            
            // Lancer la première tentative
            setTimeout(applyUrlFilter, 100);
        }
    }

    async function saveSoldiersToStorage() {
        try {
            // En environnement GitHub Pages, utiliser localStorage pour stocker les données
            localStorage.setItem('eagleOperator_soldiers', JSON.stringify(allSoldiersData));
            console.log('Données des soldats sauvegardées avec succès dans localStorage');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données dans localStorage:', error);
            alert('Erreur lors de la sauvegarde des données. Veuillez réessayer.');
        }
    }

    async function fetchSoldiers() {
        try {
            // Vérifier d'abord si des données existent dans localStorage
            const savedData = localStorage.getItem('eagleOperator_soldiers');
            
            if (savedData) {
                console.log('Chargement des données depuis localStorage');
                allSoldiersData = JSON.parse(savedData);
            } else {
                // Si aucune donnée n'est trouvée dans localStorage, charger le fichier JSON statique
                console.log('Aucune donnée trouvée dans localStorage, chargement du fichier JSON statique...');
                const response = await fetch('./data/soldiers.json');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const soldiers = await response.json();
                allSoldiersData = soldiers;
                
                // Sauvegarder les données dans localStorage pour une utilisation future
                saveSoldiersToStorage();
            }
            
            // Afficher les données
            populateFilters(allSoldiersData);
            displaySoldiers(allSoldiersData);
            
            // Vérifier les paramètres d'URL pour appliquer les filtres
            checkUrlParams();
            
        } catch (error) {
            console.error('Error fetching soldiers data:', error);
            if (soldierListDiv) {
                soldierListDiv.innerHTML = '<p style="color: red;">Erreur lors du chargement des données des soldats.</p>';
            }
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    }

    function populateFilters(soldiers) {
        const grades = new Set();
        const statuses = new Set();

        soldiers.forEach(soldier => {
            if (soldier.grade) grades.add(soldier.grade);
            if (soldier.statut) statuses.add(soldier.statut);
        });

        gradeFilter.innerHTML = '<option value="">Filtrer par Grade</option>'; // Reset
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeFilter.appendChild(option);
        });

        statusFilter.innerHTML = '<option value="">Filtrer par Statut</option>'; // Reset
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });
    }

    // Fonction pour récupérer les unités depuis le serveur
    async function getUnitsData() {
        try {
            const response = await fetch('/api/units');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const units = await response.json();
            return units;
        } catch (error) {
            console.error('Erreur lors du chargement des unités:', error);
            return [];
        }
        return [];
    }
    
    // Fonction pour gérer les photos des soldats
    function getSoldierPhoto(soldier) {
        // Vérifier si l'ID du soldat est valide
        if (!soldier || !soldier.id) {
            console.error('ID de soldat invalide');
            return './assets/images/default-avatar.png';
        }

        // Vérifier d'abord si la photo existe dans localStorage
        const photoKey = `eagleOperator_photo_${soldier.id}`;
        const savedPhoto = localStorage.getItem(photoKey);
        
        if (savedPhoto) {
            return Promise.resolve(savedPhoto);
            return localStorage.getItem(photoKey);
        }
        
        // Aucune photo trouvée
        return null;
    }
    
    // Fonction pour sauvegarder une photo de soldat
    function saveSoldierPhoto(soldier, imageData) {
        // Créer une clé unique pour la photo basée sur le matricule du soldat
        const photoKey = `soldier_photo_${soldier.id}`;
        
        // Stocker la photo dans le localStorage avec une clé unique
        localStorage.setItem(photoKey, imageData);
        
        // Mettre à jour la référence de la photo dans les données du soldat
        soldier.photoRef = photoKey;
        
        // Supprimer l'ancienne référence si elle existe
        if (soldier.photo) {
            delete soldier.photo;
        }
        
        // Sauvegarder les modifications
        saveSoldiersToStorage();
        
        return photoKey;
    }

    // Fonction pour déterminer le rôle d'un soldat dans une unité
    function getSoldierRole(soldierId) {
        const units = getUnitsData();
        let role = { isCommandant: false, isAdjoint: false, unitName: '', unitId: '' };
        
        if (!units || units.length === 0) return role;
        
        for (const unit of units) {
            if (unit.commandant_id === soldierId) {
                role.isCommandant = true;
                role.unitName = unit.nom;
                role.unitId = unit.id_unite;
                break;
            } else if (unit.adjoint_id === soldierId) {
                role.isAdjoint = true;
                role.unitName = unit.nom;
                role.unitId = unit.id_unite;
                break;
            }
        }
        
        return role;
    }

    function displaySoldiers(soldiersToDisplay) {
        if (!soldierListDiv) {
            console.error('soldierListDiv not found');
            return;
        }
        // Masquer le message de chargement s'il existe
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) loadingMsg.style.display = 'none';
        soldierListDiv.innerHTML = ''; // Vider la liste ou le message de chargement

        if (soldiersToDisplay.length === 0) {
            soldierListDiv.innerHTML = '<p>Aucun soldat ne correspond aux critères actuels.</p>';
            return;
        }

        soldiersToDisplay.forEach(soldier => {
            const card = document.createElement('div');
            let cardClasses = 'soldier-card';
            
            // Ajouter l'attribut data-id pour faciliter l'identification
            card.setAttribute('data-id', soldier.id);
            
            // Ajouter la classe pour le grade
            if (soldier.grade) {
                cardClasses += ` grade-${soldier.grade}`;
            }
            
            // Ajouter une classe spéciale pour les statuts
            if (soldier.statut) {
                const statut = soldier.statut.toLowerCase();
                cardClasses += ` statut-${statut}`;
                
                // Ajouter une classe spéciale pour les recrues (pour compatibilité)
                if (statut === 'recrue') {
                    cardClasses += ' recrue';
                }
            }
            
            card.className = cardClasses;
            
            // Vérifier si le soldat est commandant ou adjoint d'une unité
            const role = getSoldierRole(soldier.id);
            let roleHtml = '';
            
            if (role.isCommandant) {
                roleHtml = `<p class="soldier-role commandant"><strong>Rôle:</strong> Commandant de ${role.unitName}</p>`;
            } else if (role.isAdjoint) {
                roleHtml = `<p class="soldier-role adjoint"><strong>Rôle:</strong> Adjoint de ${role.unitName}</p>`;
            }
            
            // Déterminer l'ID de l'unité pour le lien
            let unitId = role.unitId;
            
            // Si le soldat a une unité mais pas de rôle spécifique, chercher l'ID de l'unité par son nom
            if (!unitId && soldier.unité && soldier.unité.trim() !== 'N/A' && soldier.unité.trim() !== '') {
                // Rechercher l'unité par son nom
                const unitsData = JSON.parse(localStorage.getItem('eagle_units') || '[]');
                const matchingUnit = unitsData.find(u => u.nom === soldier.unité);
                if (matchingUnit) {
                    unitId = matchingUnit.id_unite;
                    console.log(`Unité trouvée pour ${soldier.pseudo}: ${unitId}`);
                }
            }
            
            // Créer le lien vers l'unité seulement si on a un ID d'unité
            let unitHtml = '';
            if (unitId) {
                unitHtml = `<p><strong>Unité:</strong> <a href="unites.html?unit=${unitId}" class="unit-link" data-unit-id="${unitId}">${soldier.unité || 'N/A'}</a></p>`;
            } else {
                unitHtml = `<p><strong>Unité:</strong> ${soldier.unité || 'N/A'}</p>`;
            }
            
            // Préparer l'affichage de la photo si elle existe
            let photoHtml = '';
            const soldierPhoto = getSoldierPhoto(soldier);
            if (soldierPhoto) {
                photoHtml = `<div class="soldier-card-photo"><img src="${soldierPhoto}" alt="Photo de ${soldier.pseudo}"></div>`;
            }
            
            // Déterminer la classe de couleur pour le statut
            let statutColorClass = '';
            if (soldier.statut) {
                const statut = soldier.statut.toLowerCase();
                switch(statut) {
                    case 'actif':
                        statutColorClass = 'statut-color-actif';
                        break;
                    case 'inactif':
                        statutColorClass = 'statut-color-inactif';
                        break;
                    case 'permission':
                        statutColorClass = 'statut-color-permission';
                        break;
                    case 'recrue':
                        statutColorClass = 'statut-color-recrue';
                        break;
                }
            }
            
            // Utilisation de 'pseudo' comme demandé dans la structure de soldiers.json
            card.innerHTML = `
                ${photoHtml}
                <h3>${soldier.pseudo || 'N/A'}</h3> 
                <p><strong>ID:</strong> ${soldier.id || 'N/A'}</p>
                <p><strong>Grade:</strong> ${soldier.grade || 'N/A'}</p>
                ${unitHtml}
                <p><strong>Statut:</strong> <span class="${statutColorClass}">${soldier.statut || 'N/A'}</span></p>
                ${roleHtml}
                <div class="soldier-actions">
                    <button onclick="voirDossier('${soldier.id}')" class="affect-btn">Voir Dossier</button>
                    <button class="delete-btn" onclick="supprimerSoldat('${soldier.id}')">Supprimer</button>
                </div>
            `;
            soldierListDiv.appendChild(card);
        });
    }

    function filterAndSearchSoldiers() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGrade = gradeFilter.value;
        const selectedStatus = statusFilter.value;

        const filteredSoldiers = allSoldiersData.filter(soldier => {
            const nameMatch = soldier.pseudo && soldier.pseudo.toLowerCase().includes(searchTerm);
            const unitMatch = soldier.unité && soldier.unité.toLowerCase().includes(searchTerm);
            const searchMatch = searchTerm ? (nameMatch || unitMatch) : true; // If no search term, it's a match

            const gradeMatch = !selectedGrade || soldier.grade === selectedGrade;
            const statusMatch = !selectedStatus || soldier.statut === selectedStatus;

            return searchMatch && gradeMatch && statusMatch;
        });
        displaySoldiers(filteredSoldiers);
    }
    
    if (searchInput) searchInput.addEventListener('input', filterAndSearchSoldiers);
    if (gradeFilter) gradeFilter.addEventListener('change', filterAndSearchSoldiers);
    if (statusFilter) statusFilter.addEventListener('change', filterAndSearchSoldiers);
    
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            searchInput.value = '';
            gradeFilter.value = '';
            statusFilter.value = '';
            displaySoldiers(allSoldiersData); // Afficher tous les soldats
        });
    }

    // --- Fonction pour afficher le dossier complet d'un soldat ---
    window.voirDossier = function(soldierId) {
        console.log('Ouverture du dossier du soldat:', soldierId);
        
        // Récupérer les données du soldat
        const soldier = allSoldiersData.find(s => s.id === soldierId);
        if (!soldier) {
            alert('Soldat non trouvé.');
            return;
        }
        
        // Stocker l'ID du soldat actuel dans un attribut de la modale pour y accéder plus tard
        const modal = document.getElementById('soldierFileModal');
        modal.setAttribute('data-soldier-id', soldierId);
        
        // Récupérer le rôle du soldat
        const role = getSoldierRole(soldierId);
        let roleText = 'Soldat';
        if (role.isCommandant) {
            roleText = `Commandant de ${role.unitName}`;
        } else if (role.isAdjoint) {
            roleText = `Adjoint de ${role.unitName}`;
        } else if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
            roleText = 'Recrue en formation';
        }
        
        // Remplir les informations d'identité
        document.getElementById('soldierFileTitle').textContent = soldier.pseudo;
        document.getElementById('file-id').textContent = soldier.id;
        document.getElementById('file-pseudo').textContent = soldier.pseudo;
        document.getElementById('file-grade').textContent = soldier.grade || 'N/A';
        document.getElementById('file-statut').textContent = soldier.statut || 'N/A';
        document.getElementById('file-unite').textContent = soldier.unité || 'Non assigné';
        document.getElementById('file-role').textContent = roleText;
        document.getElementById('file-date').textContent = soldier.date_incorporation ? 
            new Date(soldier.date_incorporation).toLocaleDateString('fr-FR') : 'N/A';
        
        // Mettre à jour la photo si elle existe
        if (soldier.photo) {
            const photoContainer = document.getElementById('photo-container');
            photoContainer.innerHTML = `<img src="${soldier.photo}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;
            photoContainer.classList.remove('placeholder-photo');
        }
        
        // Afficher la modale
        modal.classList.remove('hidden-modal');
        
        // Gérer la fermeture de la modale - version simplifiée pour éviter les blocages
        const closeBtn = document.getElementById('closeSoldierFileBtn');
        if (closeBtn) {
            // Utiliser onclick plutôt que addEventListener pour éviter les problèmes de portée
            closeBtn.onclick = function() {
                // Masquer la modale immédiatement
                modal.classList.add('hidden-modal');
                
                // Utiliser setTimeout pour décaler le rafraîchissement et éviter de bloquer l'interface
                setTimeout(function() {
                    displaySoldiers(allSoldiersData);
                }, 100);
            };
        }
        
        // Gérer les onglets
        setupTabs();
        
        // Gérer les boutons d'action
        setupActionButtons(soldier);
        
        // Afficher l'historique
        displayHistory(soldier);
    };
    
    // Fonction pour configurer les boutons d'action
    function setupActionButtons(soldier) {
        // Bouton Promotion
        const promoteBtn = document.getElementById('promote-btn');
        if (promoteBtn) {
            promoteBtn.onclick = function() {
                showPromotionDialog(soldier);
            };
        }
        
        // Bouton Statut
        const changeStatusBtn = document.getElementById('change-status-btn');
        if (changeStatusBtn) {
            changeStatusBtn.onclick = function() {
                showStatusDialog(soldier);
            };
        }
        
        // Bouton Réaffecter
        const reassignBtn = document.getElementById('reassign-btn');
        if (reassignBtn) {
            reassignBtn.onclick = function() {
                showReassignDialog(soldier);
            };
        }
        
        // Bouton d'édition de photo
        const photoEditBtn = document.getElementById('edit-photo-btn');
        const photoUpload = document.getElementById('photo-upload');
        
        if (photoEditBtn && photoUpload) {
            // Gérer le clic sur le bouton d'édition de photo
            photoEditBtn.onclick = function() {
                photoUpload.click(); // Déclencher le sélecteur de fichier
            };
            
            // Gérer le changement de fichier
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
                    const soldier = allSoldiersData.find(s => s.id === soldierId);
                    
                    if (!soldier) {
                        alert('Erreur: Soldat non trouvé.');
                        return;
                    }
                    
                    // Mettre à jour la photo du soldat
                    soldier.photo = imageData;
                    
                    // Mettre à jour l'affichage
                    const photoContainer = document.getElementById('photo-container');
                    photoContainer.innerHTML = `<img src="${imageData}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;
                    photoContainer.classList.remove('placeholder-photo');
                    
                    // Sauvegarder les modifications
                    saveSoldiersToStorage();
                };
                reader.readAsDataURL(file);
            };
        }
    }
    
    // Fonction pour afficher la boîte de dialogue de promotion
    function showPromotionDialog(soldier) {
        // Récupérer la liste des grades
        const grades = [
            'Recrue',
            'Soldat',
            'Caporal',
            'Sergent',
            'Sergent-Chef',
            'Adjudant',
            'Adjudant-Chef',
            'Major',
            'Sous-Lieutenant',
            'Lieutenant',
            'Capitaine',
            'Commandant',
            'Lieutenant-Colonel',
            'Colonel',
            'Général'
        ];
        
        // Créer une boîte de dialogue pour la promotion
        const dialog = document.createElement('div');
        dialog.className = 'action-dialog';
        
        // Déterminer l'index du grade actuel
        const currentGradeIndex = grades.indexOf(soldier.grade);
        
        // Créer le contenu de la boîte de dialogue
        let dialogContent = `
            <h3>Promotion</h3>
            <p>Soldat: <strong>${soldier.pseudo}</strong></p>
            <p>Grade actuel: <span class="current-value">${soldier.grade}</span></p>
            <div class="dialog-form">
                <label for="new-grade">Nouveau grade:</label>
                <select id="new-grade">
        `;
        
        // Ajouter les options de grade (uniquement ceux supérieurs ou égaux au grade actuel)
        for (let i = 0; i < grades.length; i++) {
            // Permettre de sélectionner le grade actuel ou supérieur
            if (i >= currentGradeIndex) {
                dialogContent += `<option value="${grades[i]}"${i === currentGradeIndex ? ' selected' : ''}>${grades[i]}</option>`;
            }
        }
        
        dialogContent += `
                </select>
            </div>
            <div class="dialog-actions">
                <button id="confirm-promotion" class="action-btn">Confirmer</button>
                <button id="cancel-promotion" class="action-btn">Annuler</button>
            </div>
        `;
        
        dialog.innerHTML = dialogContent;
        document.body.appendChild(dialog);
        
        // Gérer les boutons de la boîte de dialogue
        const confirmButton = document.getElementById('confirm-promotion');
        const cancelButton = document.getElementById('cancel-promotion');
        const newGradeSelect = document.getElementById('new-grade');
        
        confirmButton.onclick = function() {
            const newGrade = newGradeSelect.value;
            if (newGrade !== soldier.grade) {
                // Mettre à jour le grade du soldat
                const oldGrade = soldier.grade;
                soldier.grade = newGrade;
                
                // Ajouter l'entrée dans l'historique
                addHistoryEntry(soldier, 'grade', oldGrade, newGrade);
                
                // Mettre à jour l'affichage
                document.getElementById('file-grade').textContent = newGrade;
                
                // Mettre à jour les données et sauvegarder
                updateSoldierInList(soldier);
                saveSoldiersToStorage();
                
                // Mettre à jour l'affichage de l'historique
                displayHistory(soldier);
                
                // Fermer la boîte de dialogue
                document.body.removeChild(dialog);
            } else {
                // Si aucun changement, simplement fermer la boîte de dialogue
                document.body.removeChild(dialog);
            }
            
            // Fermer la boîte de dialogue
            dialog.remove();
        };
    }
    
    // Fonction pour afficher la boîte de dialogue de changement de statut
    function showStatusDialog(soldier) {
        // Créer une boîte de dialogue pour le changement de statut
        const dialog = document.createElement('div');
        dialog.className = 'action-dialog';
        
        // Créer le contenu de la boîte de dialogue
        const dialogContent = `
            <h3>Changement de Statut</h3>
            <p>Soldat: <strong>${soldier.pseudo}</strong></p>
            <p>Statut actuel: <span class="current-value">${soldier.statut || 'Non défini'}</span></p>
            <div class="dialog-form">
                <label for="new-status">Nouveau statut:</label>
                <select id="new-status">
                    <option value="recrue" ${soldier.statut === 'recrue' ? 'selected' : ''}>Recrue</option>
                    <option value="actif" ${soldier.statut === 'actif' ? 'selected' : ''}>Actif</option>
                    <option value="inactif" ${soldier.statut === 'inactif' ? 'selected' : ''}>Inactif</option>
                    <option value="permission" ${soldier.statut === 'permission' ? 'selected' : ''}>En Permission</option>
                </select>
            </div>
            <div class="dialog-actions">
                <button id="confirm-status" class="action-btn">Confirmer</button>
                <button id="cancel-status" class="action-btn">Annuler</button>
            </div>
        `;
        
        dialog.innerHTML = dialogContent;
        
        // Ajouter la boîte de dialogue à la modale
        const modalContent = document.querySelector('.soldier-file-content');
        modalContent.appendChild(dialog);
        
        // Gérer le bouton d'annulation
        document.getElementById('cancel-status').onclick = function() {
            dialog.remove();
        };
        
        // Gérer le bouton de confirmation
        document.getElementById('confirm-status').onclick = function() {
            const newStatus = document.getElementById('new-status').value;
            
            // Vérifier si le statut a changé
            if (newStatus !== soldier.statut) {
                // Enregistrer l'ancien statut pour l'historique
                const oldStatus = soldier.statut;
                
                // Mettre à jour le statut du soldat
                soldier.statut = newStatus;
                
                // Si le statut est recrue, forcer le grade à "Recrue"
                if (newStatus === 'recrue' && soldier.grade !== 'Recrue') {
                    const oldGrade = soldier.grade;
                    soldier.grade = 'Recrue';
                    
                    // Ajouter l'entrée dans l'historique pour le changement de grade
                    addHistoryEntry(soldier, 'grade', oldGrade, 'Recrue');
                    
                    // Mettre à jour l'affichage du grade
                    document.getElementById('file-grade').textContent = 'Recrue';
                }
                
                // Ajouter l'entrée dans l'historique pour le changement de statut
                addHistoryEntry(soldier, 'statut', oldStatus, newStatus);
                
                // Mettre à jour l'affichage du statut
                document.getElementById('file-statut').textContent = newStatus;
                
                // Mettre à jour le rôle si nécessaire
                updateRoleDisplay(soldier);
                
                // Sauvegarder les modifications
                saveSoldiersToStorage();
                
                // Mettre à jour l'affichage de l'historique
                displayHistory(soldier);
            }
            
            // Fermer la boîte de dialogue
            dialog.remove();
        };
    }
    
    // Fonction pour afficher la boîte de dialogue de réaffectation
    function showReassignDialog(soldier) {
        // Récupérer la liste des unités
        const unitsData = JSON.parse(localStorage.getItem('unitsData') || '[]');
        
        // Créer une boîte de dialogue pour la réaffectation
        const dialog = document.createElement('div');
        dialog.className = 'action-dialog';
        
        // Créer le contenu de la boîte de dialogue
        let dialogContent = `
            <h3>Réaffectation</h3>
            <p>Soldat: <strong>${soldier.pseudo}</strong></p>
            <p>Unité actuelle: <span class="current-value">${soldier.unité || 'Non assigné'}</span></p>
            <div class="dialog-form">
                <label for="new-unit">Nouvelle unité:</label>
                <select id="new-unit">
                    <option value="">Non assigné</option>
        `;
        
        // Ajouter les options d'unité
        unitsData.forEach(unit => {
            dialogContent += `<option value="${unit.nom}" ${unit.nom === soldier.unité ? 'selected' : ''}>${unit.nom}</option>`;
        });
        
        dialogContent += `
                </select>
            </div>
            <div class="dialog-actions">
                <button id="confirm-reassign" class="action-btn">Confirmer</button>
                <button id="cancel-reassign" class="action-btn">Annuler</button>
            </div>
        `;
        
        dialog.innerHTML = dialogContent;
        
        // Ajouter la boîte de dialogue à la modale
        const modalContent = document.querySelector('.soldier-file-content');
        modalContent.appendChild(dialog);
        
        // Gérer le bouton d'annulation
        document.getElementById('cancel-reassign').onclick = function() {
            dialog.remove();
        };
        
        // Gérer le bouton de confirmation
        document.getElementById('confirm-reassign').onclick = function() {
            const newUnit = document.getElementById('new-unit').value;
            
            // Vérifier si l'unité a changé
            if (newUnit !== soldier.unité) {
                // Enregistrer l'ancienne unité pour l'historique
                const oldUnit = soldier.unité || 'Non assigné';
                
                // Mettre à jour l'unité du soldat
                soldier.unité = newUnit;
                
                // Ajouter l'entrée dans l'historique
                addHistoryEntry(soldier, 'unite', oldUnit, newUnit || 'Non assigné');
                
                // Mettre à jour l'affichage
                document.getElementById('file-unite').textContent = newUnit || 'Non assigné';
                
                // Mettre à jour le rôle
                updateRoleDisplay(soldier);
                
                // Sauvegarder les modifications
                saveSoldiersToStorage();
                
                // Mettre à jour l'affichage de l'historique
                displayHistory(soldier);
            }
            
            // Fermer la boîte de dialogue
            dialog.remove();
        };
    }
    
    // Fonction pour mettre à jour l'affichage du rôle
    function updateRoleDisplay(soldier) {
        const role = getSoldierRole(soldier.id);
        let roleText = 'Soldat';
        
        if (role.isCommandant) {
            roleText = `Commandant de ${role.unitName}`;
        } else if (role.isAdjoint) {
            roleText = `Adjoint de ${role.unitName}`;
        } else if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
            roleText = 'Recrue en formation';
        }
        
        document.getElementById('file-role').textContent = roleText;
    }
    
    // Fonction pour ajouter une entrée dans l'historique
    function addHistoryEntry(soldier, type, oldValue, newValue) {
        // Initialiser l'historique si nécessaire
        if (!soldier.historique) {
            soldier.historique = [];
        }
        
        // Créer l'entrée d'historique
        const entry = {
            date: new Date().toISOString(),
            type: type,
            oldValue: oldValue,
            newValue: newValue
        };
        
        // Ajouter l'entrée à l'historique
        soldier.historique.push(entry);
    }
    
    // Fonction pour afficher l'historique
    function displayHistory(soldier) {
        const historyList = document.getElementById('history-list');
        const placeholder = document.getElementById('history-placeholder');
        
        // Vérifier si l'historique existe et n'est pas vide
        if (!soldier.historique || soldier.historique.length === 0) {
            historyList.innerHTML = '';
            placeholder.style.display = 'block';
            return;
        }
        
        // Masquer le placeholder
        placeholder.style.display = 'none';
        
        // Trier l'historique par date (du plus récent au plus ancien)
        const sortedHistory = [...soldier.historique].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Obtenir le filtre actif
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        
        // Filtrer l'historique si nécessaire
        let filteredHistory = sortedHistory;
        if (activeFilter !== 'all') {
            filteredHistory = sortedHistory.filter(entry => entry.type === activeFilter);
        }
        
        // Vérifier si l'historique filtré est vide
        if (filteredHistory.length === 0) {
            historyList.innerHTML = '<li class="empty-history">Aucun changement de ce type dans l\'historique.</li>';
            return;
        }
        
        // Vider la liste actuelle
        historyList.innerHTML = '';
        
        // Créer les éléments de liste pour chaque entrée d'historique
        filteredHistory.forEach(entry => {
            // Créer l'élément de liste
            const li = document.createElement('li');
            li.className = `history-entry ${entry.type}-entry`;
            
            // Formater la date
            const date = new Date(entry.date);
            const formattedDate = `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            
            // Déterminer l'icône et le texte en fonction du type de changement
            let icon, text, colorClass;
            switch(entry.type) {
                case 'grade':
                    icon = '<i class="fas fa-medal"></i>';
                    text = `Promotion de <span class="old-value">${entry.oldValue}</span> à <span class="new-value">${entry.newValue}</span>`;
                    colorClass = 'grade-change';
                    break;
                case 'statut':
                    icon = '<i class="fas fa-user-shield"></i>';
                    text = `Changement de statut de <span class="old-value">${entry.oldValue || 'Non défini'}</span> à <span class="new-value">${entry.newValue}</span>`;
                    colorClass = 'status-change';
                    break;
                case 'unite':
                    icon = '<i class="fas fa-users"></i>';
                    text = `Réaffectation de <span class="old-value">${entry.oldValue || 'Non assigné'}</span> à <span class="new-value">${entry.newValue || 'Non assigné'}</span>`;
                    colorClass = 'unit-change';
                    break;
                default:
                    icon = '<i class="fas fa-history"></i>';
                    text = `Changement de ${entry.oldValue} à ${entry.newValue}`;
                    colorClass = 'other-change';
            }
            
            // Construire le contenu HTML de l'élément
            li.innerHTML = `
                <div class="history-icon ${colorClass}">${icon}</div>
                <div class="history-content">
                    <div class="history-text">${text}</div>
                    <div class="history-date">${formattedDate}</div>
                </div>
            `;
            
            // Ajouter l'élément à la liste
            historyList.appendChild(li);
        });
    }
    
    // Fonction pour configurer les filtres de l'historique
    function setupHistoryFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const soldierId = document.getElementById('soldierFileModal').getAttribute('data-soldier-id');
        const soldier = allSoldiersData.find(s => s.id === soldierId);
        
        if (!soldier) return;
        
        filterButtons.forEach(button => {
            button.onclick = function() {
                // Retirer la classe active de tous les boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Ajouter la classe active au bouton cliqué
                this.classList.add('active');
                
                // Rafraîchir l'affichage de l'historique avec le nouveau filtre
                displayHistory(soldier);
            };
        });
    }
    
    // Fonction pour activer/désactiver le mode édition
    function toggleEditMode() {
        const fileContent = document.querySelector('.soldier-file-content');
        const editBtn = document.getElementById('editSoldierFileBtn');
        const editButtons = document.querySelectorAll('.edit-btn');
        
        if (fileContent.classList.contains('editing-mode')) {
            // Désactiver le mode édition
            fileContent.classList.remove('editing-mode');
            editBtn.textContent = 'Modifier';
            
            // Masquer tous les boutons d'édition
            editButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Rafraîchir l'affichage pour voir les changements
            const soldierId = document.getElementById('soldierFileModal').getAttribute('data-soldier-id');
            const soldier = allSoldiersData.find(s => s.id === soldierId);
            if (soldier) {
                updateSoldierFileDisplay(soldier);
            }
        } else {
            // Activer le mode édition
            fileContent.classList.add('editing-mode');
            editBtn.textContent = 'Terminer l\'édition';
            
            // Afficher tous les boutons d'édition
            editButtons.forEach(btn => {
                btn.style.display = 'inline-block';
            });
            
            // Forcer un petit délai pour s'assurer que les styles sont appliqués
            setTimeout(() => {
                console.log('Mode édition activé, boutons visibles:', editButtons.length);
            }, 100);
        }
    }
    
    // Fonction pour mettre à jour l'affichage du dossier soldat
    function updateSoldierFileDisplay(soldier) {
        // Récupérer le rôle du soldat
        const role = getSoldierRole(soldier.id);
        let roleText = 'Soldat';
        if (role.isCommandant) {
            roleText = `Commandant de ${role.unitName}`;
        } else if (role.isAdjoint) {
            roleText = `Adjoint de ${role.unitName}`;
        } else if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
            roleText = 'Recrue en formation';
        }
        
        // Mettre à jour les informations d'identité
        document.getElementById('soldierFileTitle').textContent = soldier.pseudo;
        document.getElementById('file-pseudo').textContent = soldier.pseudo;
        document.getElementById('file-grade').textContent = soldier.grade || 'N/A';
        document.getElementById('file-statut').textContent = soldier.statut || 'N/A';
        document.getElementById('file-unite').textContent = soldier.unité || 'Non assigné';
        document.getElementById('file-role').textContent = roleText;
        
        // Mettre à jour la photo si elle existe
        if (soldier.photo) {
            const photoContainer = document.getElementById('photo-container');
            photoContainer.innerHTML = `<img src="${soldier.photo}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;
            photoContainer.classList.remove('placeholder-photo');
        }
    }
    
    // Fonction pour configurer les boutons d'édition
    function setupEditButtons(soldier) {
        // Récupérer tous les boutons d'édition
        const editButtons = document.querySelectorAll('.edit-btn[data-field]');
        
        // Ajouter un écouteur d'événement à chaque bouton
        editButtons.forEach(button => {
            button.onclick = function() {
                const field = this.getAttribute('data-field');
                const detailRow = this.closest('.detail-row');
                const valueSpan = detailRow.querySelector('span');
                const currentValue = valueSpan.textContent;
                
                // Marquer le champ comme étant en cours d'édition
                detailRow.classList.add('editing');
                
                // Créer le formulaire d'édition en fonction du champ
                let formHTML = `<div class="edit-form">`;
                
                switch(field) {
                    case 'pseudo':
                        formHTML += `<input type="text" value="${currentValue}" maxlength="32">`;
                        break;
                    case 'grade':
                        formHTML += `<select>
                            <option value="Recrue" ${currentValue === 'Recrue' ? 'selected' : ''}>Recrue</option>
                            <option value="Soldat" ${currentValue === 'Soldat' ? 'selected' : ''}>Soldat</option>
                            <option value="Soldat Première Classe" ${currentValue === 'Soldat Première Classe' ? 'selected' : ''}>Soldat Première Classe</option>
                            <option value="Caporal" ${currentValue === 'Caporal' ? 'selected' : ''}>Caporal</option>
                            <option value="Caporal-Chef" ${currentValue === 'Caporal-Chef' ? 'selected' : ''}>Caporal-Chef</option>
                            <option value="Sergent" ${currentValue === 'Sergent' ? 'selected' : ''}>Sergent</option>
                            <option value="Sergent-Chef" ${currentValue === 'Sergent-Chef' ? 'selected' : ''}>Sergent-Chef</option>
                            <option value="Sous-Lieutenant" ${currentValue === 'Sous-Lieutenant' ? 'selected' : ''}>Sous-Lieutenant</option>
                            <option value="Lieutenant" ${currentValue === 'Lieutenant' ? 'selected' : ''}>Lieutenant</option>
                            <option value="Capitaine" ${currentValue === 'Capitaine' ? 'selected' : ''}>Capitaine</option>
                            <option value="Commandant" ${currentValue === 'Commandant' ? 'selected' : ''}>Commandant</option>
                        </select>`;
                        break;
                    case 'statut':
                        formHTML += `<select>
                            <option value="recrue" ${currentValue.toLowerCase() === 'recrue' ? 'selected' : ''}>Recrue</option>
                            <option value="actif" ${currentValue.toLowerCase() === 'actif' ? 'selected' : ''}>Actif</option>
                        </select>`;
                        break;
                    case 'unite':
                        // Récupérer la liste des unités
                        const unitsData = JSON.parse(localStorage.getItem('unitsData') || '[]');
                        formHTML += `<select>
                            <option value="">Non assigné</option>`;
                        
                        unitsData.forEach(unit => {
                            formHTML += `<option value="${unit.nom}" ${currentValue === unit.nom ? 'selected' : ''}>${unit.nom}</option>`;
                        });
                        
                        formHTML += `</select>`;
                        break;
                }
                
                formHTML += `<div class="edit-form-btns">
                    <button class="save-btn" title="Enregistrer">✓</button>
                    <button class="cancel-btn" title="Annuler">✗</button>
                </div></div>`;
                
                // Remplacer le contenu du champ par le formulaire
                const originalContent = detailRow.innerHTML;
                detailRow.innerHTML = formHTML;
                
                // Gérer le bouton d'annulation
                detailRow.querySelector('.cancel-btn').onclick = function() {
                    detailRow.innerHTML = originalContent;
                    detailRow.classList.remove('editing');
                    // Réinitialiser l'écouteur d'événement sur le bouton d'édition
                    detailRow.querySelector('.edit-btn').onclick = button.onclick;
                };
                
                // Gérer le bouton de sauvegarde
                detailRow.querySelector('.save-btn').onclick = function() {
                    const inputElement = detailRow.querySelector('input, select');
                    const newValue = inputElement.value;
                    
                    // Récupérer l'ID du soldat depuis l'attribut de la modale
                    const soldierId = document.getElementById('soldierFileModal').getAttribute('data-soldier-id');
                    const soldier = allSoldiersData.find(s => s.id === soldierId);
                    
                    if (!soldier) {
                        alert('Erreur: Soldat non trouvé.');
                        return;
                    }
                    
                    // Mettre à jour la valeur dans l'objet soldat
                    switch(field) {
                        case 'pseudo':
                            soldier.pseudo = newValue;
                            document.getElementById('soldierFileTitle').textContent = newValue;
                            break;
                        case 'grade':
                            soldier.grade = newValue;
                            // Si le statut est recrue, vérifier que le grade est bien "Recrue"
                            if (soldier.statut === 'recrue' && newValue !== 'Recrue') {
                                alert('Attention: Le grade d\'une recrue doit être "Recrue".');
                                soldier.grade = 'Recrue';
                            }
                            break;
                        case 'statut':
                            soldier.statut = newValue;
                            // Si le statut est recrue, forcer le grade à "Recrue"
                            if (newValue === 'recrue') {
                                soldier.grade = 'Recrue';
                                document.getElementById('file-grade').textContent = 'Recrue';
                            }
                            break;
                        case 'unite':
                            soldier.unité = newValue;
                            // Mettre à jour le rôle
                            const role = getSoldierRole(soldierId);
                            let roleText = 'Soldat';
                            if (role.isCommandant) {
                                roleText = `Commandant de ${role.unitName}`;
                            } else if (role.isAdjoint) {
                                roleText = `Adjoint de ${role.unitName}`;
                            } else if (soldier.statut && soldier.statut.toLowerCase() === 'recrue') {
                                roleText = 'Recrue en formation';
                            }
                            document.getElementById('file-role').textContent = roleText;
                            break;
                    }
                    
                    // Sauvegarder les modifications
                    saveSoldiersToStorage();
                    
                    // Mettre à jour l'affichage
                    valueSpan.textContent = field === 'unite' && !newValue ? 'Non assigné' : newValue;
                    detailRow.innerHTML = originalContent;
                    detailRow.classList.remove('editing');
                    
                    // Réinitialiser l'écouteur d'événement sur le bouton d'édition
                    detailRow.querySelector('.edit-btn').onclick = button.onclick;
                };
            };
        });
        
        // Gérer le bouton d'édition de la photo
        const photoEditBtn = document.getElementById('edit-photo-btn');
        const photoUpload = document.getElementById('photo-upload');
        
        if (photoEditBtn && photoUpload) {
            // Gérer le clic sur le bouton d'édition de photo
            photoEditBtn.onclick = function() {
                photoUpload.click(); // Déclencher le sélecteur de fichier
            };
            
            // Gérer le changement de fichier
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
                    const soldier = allSoldiersData.find(s => s.id === soldierId);
                    
                    if (!soldier) {
                        alert('Erreur: Soldat non trouvé.');
                        return;
                    }
                    
                    // Mettre à jour la photo du soldat
                    soldier.photo = imageData;
                    
                    // Mettre à jour l'affichage
                    const photoContainer = document.getElementById('photo-container');
                    photoContainer.innerHTML = `<img src="${imageData}" alt="Photo de ${soldier.pseudo}" style="max-width: 100%; max-height: 100%;">`;
                    photoContainer.classList.remove('placeholder-photo');
                    
                    // Sauvegarder les modifications
                    saveSoldiersToStorage();
                };
                reader.readAsDataURL(file);
            };
        }
    }
    
    // Fonction pour déterminer le rôle d'un soldat dans une unité
    function getSoldierRole(soldierId) {
        const result = {
            isCommandant: false,
            isAdjoint: false,
            unitName: ''
        };
        
        // Récupérer les unités depuis le localStorage
        const unitsData = JSON.parse(localStorage.getItem('unitsData') || '[]');
        
        // Vérifier si le soldat est commandant ou adjoint d'une unité
        for (const unit of unitsData) {
            if (unit.commandant === soldierId) {
                result.isCommandant = true;
                result.unitName = unit.nom;
                return result;
            }
            if (unit.adjoint === soldierId) {
                result.isAdjoint = true;
                result.unitName = unit.nom;
                return result;
            }
        }
        
        return result;
    }
    
    // Fonction pour gérer les onglets dans la modale du dossier soldat
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Retirer la classe active de tous les boutons
                tabBtns.forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                this.classList.add('active');
                
                // Masquer tous les panneaux
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Afficher le panneau correspondant
                const tabId = this.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    window.modifierSoldat = function(soldierId) {
    // On remplace la carte par un formulaire d'édition similaire à la création
    const card = Array.from(document.getElementsByClassName('soldier-card')).find(div => div.innerHTML.includes(soldierId));
    if (!card) return;
    const soldier = allSoldiersData.find(s => s.id === soldierId);
    if (!soldier) return;
    card.innerHTML = `
        <h3><input type="text" id="editPseudo" value="${soldier.pseudo}" maxlength="32" style="width:80%"></h3>
        <p><strong>ID:</strong> <span>${soldier.id}</span></p>
        <p><strong>Date d'incorporation:</strong> <span>${soldier.date_incorporation ? new Date(soldier.date_incorporation).toLocaleDateString('fr-FR') : ''}</span></p>
        <p><strong>Grade:</strong> <select id="editGrade" ${soldier.statut === 'recrue' ? 'disabled' : ''}>
            <option value="Recrue" ${soldier.grade==='Recrue'?'selected':''}>Recrue</option>
            <option value="Soldat" ${soldier.grade==='Soldat'?'selected':''}>Soldat</option>
            <option value="Soldat Première Classe" ${soldier.grade==='Soldat Première Classe'?'selected':''}>Soldat Première Classe</option>
            <option value="Caporal" ${soldier.grade==='Caporal'?'selected':''}>Caporal</option>
            <option value="Caporal-Chef" ${soldier.grade==='Caporal-Chef'?'selected':''}>Caporal-Chef</option>
            <option value="Sergent" ${soldier.grade==='Sergent'?'selected':''}>Sergent</option>
            <option value="Sergent-Chef" ${soldier.grade==='Sergent-Chef'?'selected':''}>Sergent-Chef</option>
            <option value="Sous-Lieutenant" ${soldier.grade==='Sous-Lieutenant'?'selected':''}>Sous-Lieutenant</option>
            <option value="Lieutenant" ${soldier.grade==='Lieutenant'?'selected':''}>Lieutenant</option>
            <option value="Capitaine" ${soldier.grade==='Capitaine'?'selected':''}>Capitaine</option>
            <option value="Commandant" ${soldier.grade==='Commandant'?'selected':''}>Commandant</option>
        </select></p>
        <p><strong>Statut:</strong> <select id="editStatut" onchange="handleEditStatutChange()">
            <option value="recrue" ${soldier.statut==='recrue'?'selected':''}>Recrue</option>
            <option value="actif" ${soldier.statut==='actif'?'selected':''}>Actif</option>
            <option value="en formation" ${soldier.statut==='en formation'?'selected':''}>En formation</option>
            <option value="blessé" ${soldier.statut==='blessé'?'selected':''}>Blessé</option>
            <option value="transféré" ${soldier.statut==='transféré'?'selected':''}>Transféré</option>
            <option value="retraite" ${soldier.statut==='retraite'?'selected':''}>Retraite</option>
        </select></p>
        <div class="soldier-actions">
            <button id="validerEdit">Valider</button>
            <button id="annulerEdit">Annuler</button>
        </div>
    `;
    // Fonction pour gérer le changement de statut lors de la modification
    window.handleEditStatutChange = function() {
        const statutSelect = document.getElementById('editStatut');
        const gradeSelect = document.getElementById('editGrade');
        
        if (statutSelect.value === 'recrue') {
            // Si le statut est recrue, définir automatiquement le grade comme "Recrue"
            gradeSelect.value = 'Recrue';
            gradeSelect.disabled = true; // Désactiver le champ de grade
        } else {
            // Sinon, réactiver le champ de grade
            gradeSelect.disabled = false;
            // Si le grade était "Recrue", le réinitialiser
            if (gradeSelect.value === 'Recrue') {
                gradeSelect.value = 'Soldat';
            }
        }
    };
    
    // Appeler la fonction au chargement pour initialiser l'état
    setTimeout(() => {
        handleEditStatutChange();
    }, 0);
    
    document.getElementById('annulerEdit').onclick = () => { displaySoldiers(allSoldiersData); };
    document.getElementById('validerEdit').onclick = () => {
        const pseudo = document.getElementById('editPseudo').value.trim();
        const statut = document.getElementById('editStatut').value;
        let grade = document.getElementById('editGrade').value;
        
        // Si le statut est recrue, forcer le grade à "Recrue"
        if (statut === 'recrue') {
            grade = 'Recrue';
        }
        
        if (!pseudo || !grade || !statut) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        soldier.pseudo = pseudo;
        soldier.grade = grade;
        soldier.statut = statut;
        saveSoldiersToStorage();
        displaySoldiers(allSoldiersData);
    };
};

    window.supprimerSoldat = function(soldierId) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le soldat ID: ${soldierId} ? Cette action est irréversible.`)) {
        allSoldiersData = allSoldiersData.filter(s => s.id !== soldierId);
        saveSoldiersToStorage();
        displaySoldiers(allSoldiersData);
    }
};

    // Gestion du formulaire de création inline
    const openCreateBtn = document.getElementById('openCreateSoldierModal');
    let creationCard = null;

    function generateMatricule() {
        // Génère un matricule du type EGC-XXX (incrémental)
        let maxNum = 0;
        allSoldiersData.forEach(s => {
            const match = s.id && s.id.match(/EGC-(\d+)/);
            if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
        });
        return 'EGC-' + String(maxNum + 1).padStart(3, '0');
    }

    function showCreationCard() {
        if (creationCard) return; // Un seul formulaire à la fois
        creationCard = document.createElement('div');
        creationCard.className = 'soldier-card';
        const matricule = generateMatricule();
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        creationCard.innerHTML = `
            <h3><input type="text" id="newPseudo" placeholder="Entrer le pseudo..." maxlength="32" style="width:80%"></h3>
            <p><strong>ID:</strong> <span id="newMatricule">${matricule}</span></p>
            <p><strong>Date d'incorporation:</strong> <span id="newDate">${dateStr}</span></p>
            <p><strong>Grade:</strong> <select id="newGrade">
                <option value="">Choisir</option>
                <option value="Recrue">Recrue</option>
                <option value="Soldat">Soldat</option>
                <option value="Soldat Première Classe">Soldat Première Classe</option>
                <option value="Caporal">Caporal</option>
                <option value="Caporal-Chef">Caporal-Chef</option>
                <option value="Sergent">Sergent</option>
                <option value="Sergent-Chef">Sergent-Chef</option>
                <option value="Sous-Lieutenant">Sous-Lieutenant</option>
                <option value="Lieutenant">Lieutenant</option>
                <option value="Capitaine">Capitaine</option>
                <option value="Commandant">Commandant</option>
            </select></p>
            <p><strong>Statut:</strong> <select id="newStatut" onchange="handleStatutChange()">
                <option value="recrue">Recrue</option>
                <option value="actif">Actif</option>
            </select></p>
            <div class="soldier-actions">
                <button id="validerCreation">Valider</button>
                <button id="annulerCreation">Annuler</button>
            </div>
        `;
        soldierListDiv.prepend(creationCard);

        document.getElementById('annulerCreation').onclick = () => {
            creationCard.remove();
            creationCard = null;
        };
        // Fonction pour gérer le changement de statut
        window.handleStatutChange = function() {
            const statutSelect = document.getElementById('newStatut');
            const gradeSelect = document.getElementById('newGrade');
            
            if (statutSelect.value === 'recrue') {
                // Si le statut est recrue, définir automatiquement le grade comme "Recrue"
                gradeSelect.value = 'Recrue';
                gradeSelect.disabled = true; // Désactiver le champ de grade
            } else {
                // Sinon, réactiver le champ de grade
                gradeSelect.disabled = false;
                // Si le grade était "Recrue", le réinitialiser
                if (gradeSelect.value === 'Recrue') {
                    gradeSelect.value = '';
                }
            }
        };
        
        // Appeler la fonction au chargement pour initialiser l'état
        handleStatutChange();
        
        document.getElementById('validerCreation').onclick = () => {
            const pseudo = document.getElementById('newPseudo').value.trim();
            const statut = document.getElementById('newStatut').value;
            let grade = document.getElementById('newGrade').value;
            
            // Si le statut est recrue, forcer le grade à "Recrue"
            if (statut === 'recrue') {
                grade = 'Recrue';
            }
            
            if (!pseudo || !grade || !statut) {
                alert('Veuillez remplir tous les champs obligatoires.');
                return;
            }
            const newSoldier = {
                id: matricule,
                pseudo,
                grade,
                "unité": "",
                statut,
                sexe: '',
                formations_suivies: [],
                missions_effectuées: 0,
                faits_d_armes: [],
                recompenses: [],
                date_incorporation: now.toISOString().split('T')[0]
            };
            allSoldiersData.unshift(newSoldier);
            saveSoldiersToStorage();
            creationCard.remove();
            creationCard = null;
            displaySoldiers(allSoldiersData);
        };
    }

if (openCreateBtn) {
    openCreateBtn.addEventListener('click', showCreationCard);
}

// Appel initial pour charger les données
if (soldierListDiv) {
    fetchSoldiers();
    // Vérifier les paramètres d'URL pour appliquer les filtres automatiquement
    checkUrlParams();
} else {
    console.warn("Élément #soldierList non trouvé. Le chargement des soldats est annulé. Assurez-vous d'être sur la page soldats.html.");
}

if (soldierListDiv) {
    fetchSoldiers();
    // Vérifier les paramètres d'URL pour appliquer les filtres automatiquement
    checkUrlParams();
} else {
    console.warn("Elément #soldierList non trouvé. Le chargement des soldats est annulé. Assurez-vous d'être sur la page soldats.html.");
}
});
