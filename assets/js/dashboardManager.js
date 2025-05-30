// dashboardManager.js - Gestion du tableau de bord et des statistiques

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le tableau de bord
    initDashboard();
});

// Fonction principale d'initialisation du tableau de bord
function initDashboard() {
    // Charger les données des soldats et des unités
    const soldiersData = getSoldiersData();
    const unitsData = getUnitsData();
    
    // Calculer et afficher les statistiques
    displayStatistics(soldiersData, unitsData);
    
    // Mettre à jour le tableau des unités
    updateUnitsTable(soldiersData, unitsData);
    
    // Mettre à jour la progression des recrues
    updateRecruitProgress(soldiersData);
}

// Récupérer les données des soldats depuis le localStorage
function getSoldiersData() {
    try {
        const storedData = localStorage.getItem('eagleOperator_soldiers');
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (e) {
        console.error('Erreur lors de la récupération des données des soldats:', e);
    }
    return [];
}

// Récupérer les données des unités depuis le localStorage
function getUnitsData() {
    try {
        const storedData = localStorage.getItem('eagleOperator_units');
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (e) {
        console.error('Erreur lors de la récupération des données des unités:', e);
    }
    return [];
}

// Calculer et afficher les statistiques principales
function displayStatistics(soldiersData, unitsData) {
    // Récupérer les éléments DOM où afficher les statistiques
    const totalEffectifsElement = document.getElementById('total-effectifs');
    const actifsElement = document.getElementById('effectifs-actifs');
    const inactifsElement = document.getElementById('effectifs-inactifs');
    const recruesElement = document.getElementById('effectifs-recrues');
    const recruesSansAffectationElement = document.getElementById('recrues-sans-affectation');
    
    // Calculer les statistiques
    const stats = calculateStatistics(soldiersData, unitsData);
    
    // Afficher les statistiques dans le DOM
    if (totalEffectifsElement) totalEffectifsElement.textContent = stats.totalEffectifs;
    if (actifsElement) actifsElement.textContent = stats.effectifsActifs;
    if (inactifsElement) inactifsElement.textContent = stats.effectifsInactifs;
    if (recruesElement) recruesElement.textContent = stats.effectifsRecrues;
    if (recruesSansAffectationElement) recruesSansAffectationElement.textContent = stats.recruesSansAffectation;
    
    // Mettre à jour les pourcentages et les barres de progression
    updateProgressBars(stats);
}

// Calculer les statistiques à partir des données
function calculateStatistics(soldiersData, unitsData) {
    // Statistiques de base
    const totalEffectifs = soldiersData.length;
    let effectifsActifs = 0;
    let effectifsInactifs = 0;
    let effectifsRecrues = 0;
    let recruesSansAffectation = 0;
    
    // Parcourir tous les soldats pour calculer les statistiques
    soldiersData.forEach(soldier => {
        // Compter par statut
        const statut = soldier.statut ? soldier.statut.toLowerCase() : '';
        
        if (statut === 'actif') {
            effectifsActifs++;
        } else if (statut === 'inactif') {
            effectifsInactifs++;
        }
        
        // Compter les recrues
        if (statut === 'recrue') {
            effectifsRecrues++;
            
            // Vérifier si la recrue a une affectation
            const hasUnit = soldier.unité && soldier.unité.trim() !== '' && soldier.unité.trim() !== 'N/A';
            if (!hasUnit) {
                recruesSansAffectation++;
            }
        }
    });
    
    // Calculer les pourcentages
    const pourcentageActifs = totalEffectifs > 0 ? Math.round((effectifsActifs / totalEffectifs) * 100) : 0;
    const pourcentageInactifs = totalEffectifs > 0 ? Math.round((effectifsInactifs / totalEffectifs) * 100) : 0;
    const pourcentageRecrues = totalEffectifs > 0 ? Math.round((effectifsRecrues / totalEffectifs) * 100) : 0;
    
    return {
        totalEffectifs,
        effectifsActifs,
        effectifsInactifs,
        effectifsRecrues,
        recruesSansAffectation,
        pourcentageActifs,
        pourcentageInactifs,
        pourcentageRecrues
    };
}

// Mettre à jour les barres de progression
function updateProgressBars(stats) {
    // Récupérer les éléments des barres de progression
    const actifsProgressBar = document.getElementById('actifs-progress');
    const inactifsProgressBar = document.getElementById('inactifs-progress');
    const recruesProgressBar = document.getElementById('recrues-progress');
    
    // Récupérer les éléments pour les pourcentages
    const actifsPourcentage = document.getElementById('actifs-pourcentage');
    const inactifsPourcentage = document.getElementById('inactifs-pourcentage');
    const recruesPourcentage = document.getElementById('recrues-pourcentage');
    
    // Mettre à jour les barres de progression
    if (actifsProgressBar) actifsProgressBar.style.width = `${stats.pourcentageActifs}%`;
    if (inactifsProgressBar) inactifsProgressBar.style.width = `${stats.pourcentageInactifs}%`;
    if (recruesProgressBar) recruesProgressBar.style.width = `${stats.pourcentageRecrues}%`;
    
    // Mettre à jour les pourcentages affichés
    if (actifsPourcentage) actifsPourcentage.textContent = `${stats.pourcentageActifs}%`;
    if (inactifsPourcentage) inactifsPourcentage.textContent = `${stats.pourcentageInactifs}%`;
    if (recruesPourcentage) recruesPourcentage.textContent = `${stats.pourcentageRecrues}%`;
}

// Mettre à jour le tableau des unités
function updateUnitsTable(soldiersData, unitsData) {
    const tableBody = document.getElementById('units-table-body');
    if (!tableBody || !unitsData || unitsData.length === 0) {
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Aucune unité disponible</td></tr>';
        }
        return;
    }
    
    // Vider le tableau
    tableBody.innerHTML = '';
    
    // Calculer le nombre de soldats par unité
    const unitEffectifs = {};
    soldiersData.forEach(soldier => {
        if (soldier.unité && soldier.unité.trim() !== '' && soldier.unité.trim() !== 'N/A') {
            if (!unitEffectifs[soldier.unité]) {
                unitEffectifs[soldier.unité] = 0;
            }
            unitEffectifs[soldier.unité]++;
        }
    });
    
    // Afficher les 5 premières unités
    const unitsToShow = unitsData.slice(0, 5);
    
    unitsToShow.forEach(unit => {
        // Trouver le commandant de l'unité
        let commandant = 'Non assigné';
        if (unit.commandant_id) {
            const commandantSoldier = soldiersData.find(s => s.id === unit.commandant_id);
            if (commandantSoldier) {
                commandant = commandantSoldier.pseudo || commandantSoldier.id;
            }
        }
        
        // Déterminer le statut de l'unité en fonction du nombre d'effectifs
        const effectifs = unitEffectifs[unit.nom] || 0;
        let statut = 'Inactif';
        let statutClass = 'badge-danger';
        
        if (effectifs > 5) {
            statut = 'Actif';
            statutClass = 'badge-success';
        } else if (effectifs > 0) {
            statut = 'Partiel';
            statutClass = 'badge-warning';
        }
        
        // Créer la ligne du tableau
        const row = document.createElement('tr');
        
        // Déterminer la classe de couleur en fonction du type d'unité
        let unitTypeClass = 'unit-default';
        if (unit.type) {
            const type = unit.type.toLowerCase();
            if (type === 'quartier_general') {
                unitTypeClass = 'unit-hq';
            } else if (type === 'compagnie') {
                unitTypeClass = 'unit-company';
            } else if (type === 'section') {
                unitTypeClass = 'unit-section';
            } else if (type === 'escouade') {
                unitTypeClass = 'unit-squad';
            } else if (type === 'groupe') {
                unitTypeClass = 'unit-group';
            }
        }
        
        // Créer les boutons pour les noms d'unités avec code couleur
        const unitLink = `<a href="pages/unites.html?unit=${unit.id_unite}" class="unit-button ${unitTypeClass}">${unit.nom}</a>`;
        
        // Créer le bouton pour le commandant s'il existe
        let commandantLink = '<span class="commander-empty">Non assigné</span>';
        if (unit.commandant_id) {
            const commandantSoldier = soldiersData.find(s => s.id === unit.commandant_id);
            if (commandantSoldier) {
                commandantLink = `<a href="pages/soldats.html?id=${commandantSoldier.id}" class="commander-button">${commandant}</a>`;
            }
        }
        
        row.innerHTML = `
            <td>${unitLink}</td>
            <td>${commandantLink}</td>
            <td><span class="effectif-count">${effectifs}</span></td>
            <td><span class="badge ${statutClass}">${statut}</span></td>
            <td>
                <a href="pages/unites.html?unit=${unit.id_unite}" class="action-detail-button">Détail</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Mettre à jour la progression des recrues
function updateRecruitProgress(soldiersData) {
    const progressContainer = document.getElementById('recruit-progress');
    if (!progressContainer) return;
    
    // Calculer les statistiques de progression des recrues
    const stats = calculateRecruitProgressStats(soldiersData);
    
    // Mettre à jour les compteurs
    document.getElementById('total-recruits').textContent = stats.totalRecruits;
    document.getElementById('recruits-initial').textContent = stats.inInitialTraining;
    document.getElementById('recruits-specialization').textContent = stats.inSpecialization;
    document.getElementById('recruits-integration').textContent = stats.inUnitIntegration;
    document.getElementById('recruits-evaluation').textContent = stats.inFinalEvaluation;
    
    // Mettre à jour la barre de progression globale
    const totalSteps = stats.totalRecruits * 4; // 4 étapes par recrue
    const completedSteps = (stats.inSpecialization * 1) + (stats.inUnitIntegration * 2) + (stats.inFinalEvaluation * 3) + (stats.completedTraining * 4);
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    
    const progressBar = document.getElementById('recruits-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        document.getElementById('recruits-progress-percentage').textContent = `${progressPercentage}%`;
    }
    
    // Afficher les recrues récemment promues
    const recentPromotionsList = document.getElementById('recent-promotions');
    if (recentPromotionsList) {
        recentPromotionsList.innerHTML = '';
        
        if (stats.recentlyPromoted.length === 0) {
            recentPromotionsList.innerHTML = '<li class="no-data">Aucune promotion récente</li>';
        } else {
            stats.recentlyPromoted.forEach(soldier => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="promotion-item">
                        <span class="promotion-icon"><i class="fas fa-medal text-warning"></i></span>
                        <div class="promotion-content">
                            <div class="promotion-message">${soldier.pseudo} promu au statut actif</div>
                            <div class="promotion-time">${formatDate(soldier.date)}</div>
                        </div>
                    </div>
                `;
                recentPromotionsList.appendChild(li);
            });
        }
    }
}

// Fonction pour formater une date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Aujourd\'hui';
    } else if (diffDays === 1) {
        return 'Hier';
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
    } else {
        return date.toLocaleDateString('fr-FR');
    }
}

// Note: calculateRecruitProgressStats est importé depuis progressionManager.js
