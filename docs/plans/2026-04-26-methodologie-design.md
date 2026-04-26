# Document de Conception : Méthodologie Crystal Score™

**Date** : 26 Avril 2026  
**Statut** : En attente de validation  
**Cible** : `/methodologie`  

## 1. Objectif Stratégique
Transformer la perception du "Crystal Score" d'un simple chiffre en un **standard d'audit indépendant et rigoureux**. Cette page doit asseoir l'autorité (E-E-A-T) du site en étant transparente sur ses algorithmes tout en offrant une expérience visuelle "Premium".

## 2. Philosophie du Score
- **Modèle Déductif** : On ne part pas de zéro, on part de la perfection (**10.0**).
- **L'eau de source comme étalon** : Le 10/10 représente une eau d'une pureté totale, sans aucune trace de polluants ou de traitements.
- **Pénalités pondérées** : Chaque retrait de point est proportionnel au risque (Sanitaire > Confort).

## 3. Structure de la Page

### A. Hero Section : "La Quête de la Pureté"
- **Visuel** : Image de haute qualité d'eau cristalline (générée via AI).
- **Texte** : Présentation de la philosophie "Zéro Défaut".
- **Interaction** : Une barre de score dynamique qui simule la chute de 10.0 à 4.0 pour illustrer le principe de déduction.

### B. Le Barème de l'Expert (Grille Interactive)
Quatre piliers majeurs avec justification pour chaque déduction :

1. **🛡️ Sécurité Sanitaire (Microbiologie)**
   - **Déduction** : -5.0 pts (Sanction immédiate).
   - **Pourquoi** : Risque infectieux à court terme. C'est le pilier non-négociable.

2. **🧪 Polluants Anthropiques (Pesticides & PFAS)**
   - **Déduction** : -1.5 à -4.0 pts selon la concentration.
   - **Pourquoi** : Toxicité chronique et bioaccumulation. Nous sommes plus sévères que la norme légale pour ces "polluants éternels".

3. **🌱 Indicateurs de Pollution (Nitrates)**
   - **Déduction** : Paliers à 15, 25 et 40 mg/L.
   - **Pourquoi** : Témoin de l'impact des activités humaines (agriculture) sur la ressource.

4. **💧 Pureté & Confort (Chlore, Dureté, PH)**
   - **Déduction** : -0.5 à -1.0 pt.
   - **Pourquoi** : Altération du goût (Chlore) ou impact sur les infrastructures (Calcaire).

### C. L'Échelle de Verdict
Tableau stylisé présentant les labels :
- **9.7 - 10.0** : EXCEPTIONNEL
- **9.2 - 9.6** : EXCELLENT
- **8.5 - 9.1** : TRÈS BON
- **7.0 - 8.4** : SATISFAISANT
- **5.0 - 6.9** : MÉDIOCRE
- **< 5.0** : DÉGRADÉ

### D. Source & Intégrité des Données
- Mention explicite de l'API **Hub'Eau** (Ministère de la Santé).
- Engagement sur la neutralité de l'algorithme.

## 4. Spécifications Techniques & Design
- **Framework** : Next.js (App Router).
- **Styling** : CSS Modulaire (via `components.css` ou fichier dédié).
- **Design Tokens** : Utilisation stricte de `variables.css`.
- **Aesthetics** : Glassmorphism, animations au scroll (Reveal), typographie moderne.

## 5. Plan d'Implémentation
1. Création de la page `app/methodologie/page.js`.
2. Création des composants visuels (ScoreDisplay, PenaltyGrid).
3. Ajout du lien dans le Footer/Navigation pour le SEO.
