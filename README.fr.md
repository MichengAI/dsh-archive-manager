<p align="center">
  <img src="assets/branding/dsh-banner-en.webp" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Gestion sécurisée des sessions archivées dans DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Journal des modifications](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licence : Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![Paquet npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![Téléchargements npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Compatible DSH jusqu'à 0.2.2-rc.1](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.1-2563eb.svg)](#prérequis)
</div>

> DSH Archive Manager est un plugin maintenu par la communauté pour DeepSeek Harness (DSH), et n'est pas un produit officiel de DeepSeek AI.

Ce document décrit la version **1.3.1**. Consultez le [journal des modifications](CHANGELOG.md) pour les détails des versions publiées.

## Vue d'ensemble

Mettez de côté vos conversations inactives et retrouvez-les au besoin, pour une liste de travail claire et aérée.

- **Double vue et accès direct dans la barre latérale** : Une icône dédiée dans la barre latérale principale ouvre une vue spacieuse et centrée de **960 px** pour les sessions archivées et non archivées, éliminant les contraintes des boîtes de dialogue étroites.
- **Gestion complète du cycle de vie** : Archivez des conversations individuelles, des espaces de travail complets en un clic, des lots multi-projets, et restaurez ou reprenez des sessions directement.
- **Clic droit sur toute la ligne de la barre latérale** : Faites un clic droit n'importe où sur une ligne d'espace de travail ou de session pour ouvrir le menu d'actions. Les lignes non groupées ou vierges laissent passer le menu contextuel natif en toute sécurité.
- **Étoile de favori stable et coexistence avec les pastilles d'état (#90, #92)** : Taille d'étoile standardisée à 16×16 px en superposition absolue pour éliminer tout décalage du titre. Pendant les tâches actives ou les demandes d'approbation, la pastille d'état de l'hôte reste 100 % visible tandis que l'étoile se convertit en badge compact de 10 px en bas à droite.
- **Menu d'actions rapides d'espace de travail** : Copiez le chemin du dossier, ouvrez directement l'emplacement dans l'Explorateur Windows ou le Finder macOS, et archivez toutes les sessions associées en un clic.
- **Déplacement de sessions entre espaces de travail** : Transférez des sessions d'un espace de travail à un autre via un sous-menu au survol, avec mise en veille des processus, réécriture atomique et protection NTFS pour les sessions de messagerie.
- **Cartes accordéon unifiées et lignes ultra-compactes de 40 px** : Organisation des projets avec des cartes à tiroir intégrées de style Skills Manager (en-tête de 38 px) et lignes réduites à 40 px pour doubler la densité d'information.
- **Cases à cocher natives en mode sombre** : Composants conformes aux spécifications de l'hôte utilisant `accent-color` pour une intégration harmonieuse avec les thèmes sombres et les sélections actives.
- **Modales opaques sans transparence parasite et accessibilité localisée** : Montage direct sur `body` (`portalToBody`) avec fond opaque et flou pour empêcher le texte en arrière-plan d'apparaître en transparence. Libellés d'accessibilité complets pour le bouton de fermeture (`common.close`).
- **Identifiant de section standardisé et coexistence (#91)** : Enregistré sous l'ID `archive-manager` avec protection contre les pannes à l'exécution (`try/catch`), assurant une parfaite coexistence avec les plugins tiers d'archivage.
- **Barre d'outils adaptative sur une seule ligne** : Utilise le composant natif `Input` avec l'icône de recherche officielle et une bordure verte au focus. Regroupe sur une seule ligne la recherche, le menu d'affichage et de tri, le filtre par projet et le sélecteur de dates.
- **Recherche plein texte et menu composite de style Codex** : Recherche automatique couvrant les titres et le corps des messages (utilisateur et assistant). Menu à deux volets pour filtrer (toutes / favoris uniquement) et trier les résultats.
- **Sélecteur DateRange léger avec popover calendrier** : Remplace l'élément de date natif pour éviter les inversions de couleur en mode sombre (#74). Affichage en une ligne avec bouton d'effacement, préréglages rapides, traduction des jours et des mois dans les 8 langues officielles et navigation complète au clavier WAI-ARIA.
- **Nettoyage automatique des sessions inactives** : Définissez un seuil d'inactivité en jours pour détecter les conversations dormantes, en protégeant automatiquement les tâches en cours, les invites interactives et les favoris, avec annulation immédiate (Undo).
- **Suppression définitive physique** : Élimination complète des journaux physiques, lignes de cache et index avec rapport d'erreurs et réessai par élément.
- **Détection et nettoyage des sous-agents orphelins** : Détection des sous-agents résiduels dont la session mère a été supprimée, calcul de l'espace disque occupé et libération physique en un clic.
- **Verrouillage d'entreprise via configuration Cordis et compatibilité proxy inverse** : Possibilité de désactiver complètement le composant de mise à jour dans le fichier de configuration Cordis (`updater: false` ou `onlineUpdate: false`) et résolution dynamique des points de terminaison avec `document.baseURI`.

## Reconstruction manuelle du cache de liste (#88)

L'ouverture de l'Archive Manager vérifie uniquement les en-têtes et les projections en cache officielles pour les sessions froides dans les espaces de travail enregistrés, listes non groupées et archives (en excluant les sessions spéciales `im:`). Si un cache est manquant ou incompatible, une carte de réparation s'affiche pour relire les journaux un à un en lecture seule et régénérer les projections via `coldSnapshot` dans `session_projcache`.

## Nettoyage des sous-agents orphelins

Lorsqu'une session mère est supprimée hors de DSH, des sous-agents peuvent rester orphelins sur le disque. L'Archive Manager les repère dans le panneau d'organisation et permet de les effacer de manière sécurisée.

## Recherche et prévisualisation

- Les onglets « Archivées » et « Non archivées » partagent la recherche par titre et contenu, le filtre de projet, les favoris, le filtre de dates et le tri par date de création.
- La prévisualisation affiche les tableaux Markdown, citations et blocs de code avec les étiquettes de rôle, ou permet de basculer vers le texte source avec mise en surbrillance.
- La recherche lit des lots séquentiels d'au plus 20 sessions pour une requête de 200 caractères maximum, en excluant les outils, pièces jointes, raisonnements et messages système.

## Captures d'écran

### 1. Gestion des sessions archivées (Cartes accordéon et mode sombre)
Recherchez, marquez comme favori, prévisualisez, restaurez et nettoyez dans **Paramètres → Sessions archivées → Archivées** :

![Archivées : filtres partagés, favoris et lignes compactes](assets/screenshots/archived-sessions.webp)

Basculez vers **Non archivées** pour des suggestions de nettoyage intelligent et l'archivage par projet :

![Non archivées : nettoyage intelligent et archivage par projet](assets/screenshots/unarchived-sessions.webp)

### 2. Panneau centralisé de 960 px dans l'espace de travail principal
Ouvrez un panneau complet de 960 px directement depuis la barre latérale principale :

![Panneau principal : accès direct depuis la barre latérale](assets/screenshots/main-view-panel.webp)

### 3. Clic droit natif et sous-menu en cascade dans la barre latérale
Faites un clic droit sur n'importe quelle ligne de la barre latérale pour ouvrir les menus contextuels et déplacer des sessions :

| Actions d'espace de travail | Déplacer une session entre projets |
| :---: | :---: |
| <img src="assets/screenshots/workspace-context-menu.webp" alt="Workspace Actions Menu" width="100%"> | <img src="assets/screenshots/session-move-menu.webp" alt="Move Session Menu" width="100%"> |

## Installation

Nécessite un environnement DeepSeek Harness opérationnel (exemple avec le profil `web`) :

### Installation par un agent
Transmettez cette commande à un agent disposant d'un accès terminal sur votre machine :

```text
Installez la dernière version de @michengai/dsh-archive-manager dans mon profil web DSH depuis le registre officiel npm, vérifiez l'activation et indiquez comment recharger.
```

### Installation manuelle

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Redémarrez DSH Web et rechargez la page du navigateur (`Ctrl+Shift+R`). Ouvrez **Paramètres → Sessions archivées** pour commencer.

- **Compatibilité hôte** : Série DeepSeek Harness `0.2.x` complète (`>=0.2.0-rc.1 <0.3.0-0`), validée sur toutes les versions candidates (`0.2.0-rc.1` à `0.2.2-rc.1`).
- Les versions antérieures à `0.2.0-rc.1` ne sont plus prises en charge. Pour `0.1.x`, installez la version `1.0.20`.

## Configuration du plugin

Accessible via :
> **Barre latérale → Plugins → Cliquez sur `Archive Manager`**

### 1. Emplacement du raccourci (`entryLocation`)
- **Partout (`both`)** : Affiche l'icône dans la barre latérale gauche et conserve l'entrée dans **Paramètres → Sessions archivées**.
- **Barre latérale uniquement (`sidebar`)** : Affiche l'icône dans la barre latérale et retire l'entrée des paramètres pour un panneau allégé.
- **Paramètres uniquement (`settings`)** (Défaut) : Garde la barre latérale sobre et conserve l'accès depuis **Paramètres → Sessions archivées**.

### 2. Politique de mise à jour (`onlineUpdate` / `updater`)
- En entreprise ou environnement sous contrôle strict, les mises à jour peuvent être verrouillées via la configuration Cordis :
  ```yaml
  updater: false # ou onlineUpdate: false
  ```
  Le gestionnaire de mise à jour est alors entièrement désactivé au démarrage du serveur.

## Guide d'utilisation

| Action | Description |
| --- | --- |
| **Archiver une discussion** | Ouvrez le menu de la session dans la barre latérale et choisissez **Archiver la session** |
| **Archiver un espace de travail** | Ouvrez le menu de l'espace de travail et choisissez **Archiver la session** (confirmation sur place) |
| **Rechercher et filtrer** | Ouvrez **Paramètres → Sessions archivées** ou cliquez sur **Archiver** dans la barre latérale. La recherche couvre titres et contenus |
| **Calendrier interactif** | Cliquez sur la gélule de date pour ouvrir le popover avec navigation complète au clavier |
| **Aperçu rapide** | Cliquez sur un résultat ou dans **Plus → Aperçu rapide** pour lire sans restaurer |
| **Modifier le tri** | Triez par date d'archivage récent, date de mise à jour, de création ou titre |
| **Restaurer une discussion** | Cliquez sur l'icône de restauration de la ligne, ou sur **Plus → Restaurer et ouvrir** |
| **Archiver un groupe entier** | Dans **Non archivées**, utilisez le menu **…** du groupe pour archiver toutes les sessions |
| **Ajouter aux favoris** | Cliquez sur l'icône d'étoile de la ligne pour l'épingler en favori |
| **Nettoyer les sessions inactives** | Dans **Non archivées**, indiquez le nombre de jours d'inactivité pour prévisualiser et archiver |
| **Copier l'ID de session** | Sélectionnez **Copier l'ID de session** dans le menu **Plus** |
| **Nettoyer les sous-agents orphelins** | Identifiez et supprimez les sous-agents sans session mère dans le panneau d'organisation |
| **Annuler cet archivage** | Restaurez les sessions archivées dans le lot actuel depuis la notification |
| **Suppression définitive** | Sélectionnez des sessions, choisissez Supprimer et confirmez l'effacement physique des journaux et index |

### Favoris et nettoyage des sessions inactives

Les groupes de projets compacts peuvent être repliés. Les étoiles et les icônes de restauration/archivage s'affichent sur la droite ; les menus des sessions archivées comprennent « Restaurer et ouvrir » et « Supprimer ».

- Utilisez l'étoile sur l'un ou l'autre onglet et le menu « Favoris uniquement » pour retrouver les discussions importantes. Les favoris restent enregistrés sur l'hôte après archivage, restauration ou changement de navigateur.
- Dans « Non archivées », indiquez un seuil d'inactivité de 1 à 36 500 jours pour prévisualiser les candidats sous les filtres actuels. Vous pouvez désélectionner des éléments individuellement avant de confirmer. Les favoris, le chat actif, les sessions en cours d'exécution (y compris sous-agents) et les interactions en attente sont automatiquement protégés.
- Les opérations par lots rapportent la progression et le décompte des réussites, éléments ignorés et échecs. Un échec n'arrête pas le reste du traitement ; seuls les éléments en échec sont réessayés.
- **Annuler cet archivage** restaure les sessions archivées par le lot actuel. Cette action n'est accessible que tant que la page de gestion actuelle reste ouverte. La suppression définitive ne peut pas être annulée.

### Consulter et poursuivre les conversations archivées

La navigation native permet de lire et de reprendre les discussions :

- **Cliquez sur le titre de la session** : ouvre la conversation native DSH pour consulter les messages, pièces jointes et détails d'outils. Continuez à chatter tout en conservant la session archivée.
- **Plus → Restaurer et ouvrir** : désarchive la session et l'ouvre directement pour reprendre le travail.

## Compatibilité de l'API de recherche (pour intégrateurs)

L'API canonique est `workspaceRegistry.searchSessionContent({ sessionIds, query })`, couvrant les sessions archivées et non archivées. Fournissez de 1 à 20 identifiants de session et une requête non vide de 1 à 200 caractères. Le format de retour est `{ items: [{ sessionId, seq, snippet }], failures: [{ sessionId, message }] }`.

`searchArchivedContent` reste le point d'entrée hérité pour les archives uniquement. Tous deux utilisent la connexion Typert de l'hôte existant et la limite d'autorisation.

## Mises à jour

Réexécutez la commande d'installation ci-dessus dans votre profil DSH actif pour mettre à jour le plugin. En entreprise, les mises à jour peuvent être verrouillées via la configuration Cordis.

## FAQ

### Qu'advient-il des anciens caches du plugin après la mise à jour ?

Le plugin ne remplace pas la table de cache officielle des projections et ne scanne ni ne migre les anciens caches du plugin. Ouvrir la liste d'archives ne relit pas les journaux complets pour combler les entrées manquantes. Les journaux de session appartiennent à l'hôte, qui reconstruit les projections dérivées à la demande.

**Une session froide sans entrée de cache officielle peut initialement apparaître sans titre dans la liste ; rafraîchir la liste seule ne garantit pas sa régénération.** Ouvrir le journal permet de récupérer le titre et restaurer la session comme active permet au chemin d'écriture natif d'enregistrer le cache. Les anciens fichiers de cache restent intacts. Consultez le [journal des modifications](CHANGELOG.md) pour plus de précisions.

### Pourquoi l'entrée n'apparaît-elle pas après installation ?
Redémarrez DSH Web et forcez le rechargement de votre navigateur (`Ctrl+Shift+R`). Vérifiez que le plugin est bien installé dans le profil actif.

### Quelle est la différence entre archiver et supprimer ?
L'archivage range la discussion pour pouvoir la consulter ou la restaurer plus tard. **La suppression définitive est irréversible** et efface physiquement les journaux sur le disque.

### Est-ce compatible avec Codex UI ?
Oui. [Codex UI](https://github.com/MichengAI/dsh-codex-ui) conserve son apparence et ses interactions dans la barre latérale, et l'Archive Manager reste accessible dans **Paramètres → Sessions archivées**.

### Coexistence avec d'autres plugins d'archivage
Le plugin utilise l'identifiant de section `archive-manager`, ce qui lui permet de coexister de manière transparente avec d'autres extensions d'archivage.

## Installation depuis les sources

<details>
<summary>Déplier pour le développement ou tester des modifications non publiées</summary>

Exécutez ces commandes dans le répertoire de votre choix :

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

Après installation, redémarrez DSH Web et rechargez la page. Le code source dans [src](src) utilise TypeScript strict. GitHub et npm contiennent tous deux le répertoire `lib` prêt à l'emploi.

</details>

## Écosystème de produits DSH

Pour un poste de travail complet, téléchargez [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Pour [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), ajoutez les plugins selon vos besoins :

| Plugin | Capacités principales |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organisation des projets, recherche de tâches et navigation dans les messages |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Sélection et invocation d'agents spécialistes |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Recherche, activation, création et importation de compétences locales |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Recherche, restauration et nettoyage physique des discussions archivées |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envoi de tâches et réception de réponses via vos messageries préférées |
| [Automation](https://github.com/MichengAI/dsh-automation) | Planification de tâches récurrentes et suivi des exécutions |
| [BTW](https://github.com/MichengAI/dsh-btw) | Questions annexes sans interrompre la tâche principale |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Utilisation de `/simplify` pour perfectionner le code modifié dans Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Incitation de l'agent à persévérer et vérifier ses résultats avant de conclure |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Revue de code indépendante avec `/review` directement dans la discussion |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Notifications et approbations d'outils via un compagnon de bureau |

## Licence

Distribué sous [Licence Apache 2.0](LICENSE).
