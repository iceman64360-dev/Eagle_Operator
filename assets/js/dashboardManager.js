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
    
    // Mettre à jour l'activité récente
    updateRecentActivity();
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
        
        // Créer les liens cliquables pour les noms d'unités et de commandants
        const unitLink = `<a href="unites.html?unit=${unit.id_unite}" class="clickable-name">${unit.nom}</a>`;
        
        // Créer le lien pour le commandant s'il existe
        let commandantLink = 'Non assigné';
        if (unit.commandant_id) {
            const commandantSoldier = soldiersData.find(s => s.id === unit.commandant_id);
            if (commandantSoldier) {
                commandantLink = `<a href="soldats.html?id=${commandantSoldier.id}" class="clickable-name">${commandant}</a>`;
            }
        }
        
        row.innerHTML = `
            <td>${unitLink}</td>
            <td>${commandantLink}</td>
            <td>${effectifs}</td>
            <td><span class="badge ${statutClass}">${statut}</span></td>
            <td>
                <a href="unites.html?unit=${unit.id_unite}" class="detail-button">Détail</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Mettre à jour l'activité récente
function updateRecentActivity() {
    const activityList = document.getElementById('recent-activity');
    if (!activityList) return;
    
    // Simuler des activités récentes pour la démo
    const activities = [
        { type: 'add', message: 'Nouvelle recrue ajoutée', time: '10 min' },
        { type: 'edit', message: 'Statut de soldat mis à jour', time: '30 min' },
        { type: 'unit', message: 'Unité Alpha créée', time: '1 heure' },
        { type: 'status', message: '2 soldats marqués inactifs', time: '3 heures' }
    ];
    
    // Vider la liste
    activityList.innerHTML = '';
    
    // Ajouter les activités
    activities.forEach(activity => {
        const li = document.createElement('li');
        let icon = '';
        
        switch(activity.type) {
            case 'add':
                icon = '<i class="fas fa-user-plus text-success"></i>';
                break;
            case 'edit':
                icon = '<i class="fas fa-edit text-primary"></i>';
                break;
            case 'unit':
                icon = '<i class="fas fa-shield-alt text-warning"></i>';
                break;
            case 'status':
                icon = '<i class="fas fa-exchange-alt text-danger"></i>';
                break;
        }
        
        li.innerHTML = `
            <div class="activity-item">
                <span class="activity-icon">${icon}</span>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `;
        
        activityList.appendChild(li);
    });
}
