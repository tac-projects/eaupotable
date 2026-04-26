# Plan d'Implémentation : Page Méthodologie Crystal Score™

**Objectif :** Créer une page exhaustive et visuellement premium expliquant le calcul du score.
**Architecture :** Page Next.js (App Router) avec styles CSS modulaires.
**Stack Technique :** Next.js, React, Vanilla CSS.

---

### Tâche 1 : Structure de base et Styles
**Fichiers concernés :**
- Créer : `app/methodologie/page.js`
- Créer : `app/styles/methodology.css`
- Modifier : `app/layout.js` (si besoin pour le lien footer)

**Étape 1 : Création du fichier CSS**
Définition des classes pour le layout (Hero, Grid, Cards) en utilisant les variables de `:root`.

**Étape 2 : Création de la page**
Structure React avec les imports nécessaires.

---

### Tâche 2 : Section Hero (Impact Visuel)
**Fichiers concernés :**
- Modifier : `app/methodologie/page.js`

**Étape 1 : Intégration de l'image générée**
Mise en place du background avec overlay dégradé pour la lisibilité du texte.

**Étape 2 : Animation du Score (Simulée)**
Composant simple qui anime un chiffre de 10.0 à 4.0 pour montrer le principe de déduction.

---

### Tâche 3 : Le Barème Déductif (Algorithm Grid)
**Fichiers concernés :**
- Modifier : `app/methodologie/page.js`

**Étape 1 : Grille de Cartes**
Affichage des 4 piliers (Microbio, Polluants, Nitrates, Confort).
Chaque carte affiche la pénalité maximum et une icône SVG.

**Étape 2 : Textes d'Expert**
Ajout des justifications pour chaque déduction.

---

### Tâche 4 : L'Échelle de Verdict et SEO
**Fichiers concernés :**
- Modifier : `app/methodologie/page.js`

**Étape 1 : Tableau des Labels**
Présentation propre de la correspondance Score -> Label (Exceptionnel, etc.).

**Étape 2 : Meta-données SEO**
Ajout du titre et de la description pour l'indexation Google.

---

### Tâche 5 : Intégration Finale
**Fichiers concernés :**
- Modifier : `app/components/Footer.js` (ou composant équivalent)

**Étape 1 : Ajout du lien**
Ajout de "Méthodologie" dans le footer pour l'accessibilité et le maillage interne.
