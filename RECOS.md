# Recommandations — Analyse concurrentielle (14/08/2026)

Concurrents analysés : infoeau.fr, moneau.app, cieau.com (EauChezMoi), leaupotable.fr, qualite-eau-france.fr (non analysable : site 100% JS, seul le titre est indexable).

## Ce que les concurrents font et que nous ne faisons pas

### 1. Classement & comparateur d'eaux en bouteille (InfoEau)
Notation de ~27 marques (Evian, Contrex, Cristaline…) sur 80 pts / 11 critères, 12 profils santé (Bébé, Sport, Grossesse, Transit…), podium, favoris, fiches par marque (`/marque/evian`), prix en magasin par enseigne.

### 2. Diagnostic personnalisé « quelle eau boire ? » (InfoEau)
Quiz en 3 questions (rapide) ou 4 étapes (complet : profils, intolérances, préférences) → recommandation.

### 3. Cartes thématiques (InfoEau)
Carte des polluants, goût de l'eau par région (sondage), parcours eau du robinet / en bouteille (infographies en étapes), sources d'eau minérale, cours d'eau (état écologique des rivières). Nous n'avons que la carte PFAS.

### 4. Dimension Europe (InfoEau)
Carte de l'eau dans 27 pays (données EEA), classement européen, prix/composition/polluants européens.

### 5. Alertes qualité en temps réel (InfoEau)
Dashboard d'alertes (sévérité, population affectée, mesures prises) + articles d'actualité sur les épisodes de pollution (chronologie factuelle). NB : il affiche actuellement des données de démo.

### 6. Granularité des analyses (InfoEau)
~30 paramètres par commune (chloridazone, ammonium, bactéries 22°/36°, température, sulfates, Ca, Mg, chlorures…) avec barre « % de la limite ». Nous n'affichons que 9 paramètres.

### 7. Page dédiée « Eau pour bébé » (MonEau)
Seuils OMS nourrissons, méthémoglobinémie, nitrates/PFAS pour biberon, vérification par commune.

### 8. Classement « pires / meilleures villes » (MonEau)
Top 100 pires + 100 meilleures communes (>10 000 hab), score sur 100. Nous n'avons que le top-50 PFAS.

### 9. Pages hub par polluant (MonEau)
`/pollution-pfas`, `/pollution-nitrates`, `/pollution-pesticides` — hub éditorial + données par polluant. Nous n'avons que `/pfas-eau-potable`.

### 10. Étiquette de l'eau type bouteille (CIEau / EauChezMoi)
Présentation de l'eau du robinet comme une étiquette de bouteille (Ca, Mg, minéralisation) + historique mensuel et moyenne 12 mois par paramètre.

### 11. App native iOS/Android (CIEau / EauChezMoi)
Disponible App Store + Google Play (nous avons un PWA).

### 12. Outils & contenu éducatif (CIEau)
Calculateur de consommation annuelle, espace enfants/enseignants, brochures PDF, tutoriels vidéo, baromètres d'opinion, aides financières pour payer la facture.

### 13. Devis gratuit / vente d'analyses (LeauPotable)
Lead-gen commercial : demande de devis pour analyse privée de l'eau à domicile.

### 14. Géolocalisation active (InfoEau)
Bouton « Ma position » fonctionnel sur le diagnostic (le nôtre est désactivé dans le code).

### 15. API publique de données (InfoEau)
Expose une API publique de ses données (nous n'exposons que `/api/search` et `/api/og`).

## Recommandations

| # | Élément | Intéressant ? | Priorité |
|---|---|---|---|
| 1 | Classement eaux en bouteille | **Oui — fort.** Cible déjà notre mot-clé « pfas eau en bouteille » (section PFAS existante), gros volume de recherche, revenus d'affiliation possibles. | ⭐⭐⭐ |
| 9 | Pages hub par polluant (nitrates, pesticides) | **Oui.** Réplique notre succès PFAS sur des requêtes massives (« nitrates eau », « pesticides eau potable »). | ⭐⭐⭐ |
| 8 | Classement pires/meilleures villes | **Oui.** Aimant à liens + presse, easy win à partir de nos données existantes. | ⭐⭐⭐ |
| 7 | Page Eau pour bébé | **Oui.** Demande très forte et personne non couverte chez nous ; en plus de nos cartes Focus bébé. | ⭐⭐ |
| 14 | Géolocalisation active | **Oui, quasi gratuit.** Le bouton existe déjà (désactivé) — il suffit de le câbler. | ⭐⭐ |
| 6 | Plus de paramètres + barre % limite | **Oui.** Les données sont déjà dans nos JSON, c'est du réaffichage ; gain de crédibilité (InfoEau le fait). | ⭐⭐ |
| 10 | Étiquette eau type bouteille + historique | **Oui.** Fort UX, différenciant, peu coûteux (données déjà présentes). | ⭐⭐ |
| 5 | Alertes en temps réel | **À peser.** Notre newsletter Vigilance couvre déjà l'abonnement ; un dashboard temps réel demande un pipeline Hub'Eau dédié. | ⭐ |
| 2 | Diagnostic « quelle eau boire » | **À peser.** Bon engagement mais dimension santé/affiliation bouteilles ; à faire seulement si on fait le #1. | ⭐ |
| 3 | Cartes thématiques (polluants, goût, sources…) | **À peser.** Carte des polluants oui (dérivé de nos données) ; goût/parcours = contenu éditorial lourd. | ⭐ |
| 12 | Calculateur de consommation | **Possible.** Petit outil viral sympa, faible coût. | ⭐ |
| 15 | API publique | **Possible.** Niche dev, bon pour le branding open-data. | ⭐ |
| 13 | Devis/vente d'analyses | **Non — décision stratégique.** C'est le seul modèle de monétisation directe ; change le positionnement éditorial en lead-gen. | ⚠️ décision |
| 4 | Dimension Europe | **Non pour l'instant.** Hors périmètre « par commune FR », sources EEA différentes. | ❌ |
| 11 | App native | **Non.** Notre PWA suffit, coût de maintenance trop élevé. | ❌ |
| 12b | Contenu éducatif CIEau, baromètres, aides | **Non.** Audience institutionnelle, hors positionnement. | ❌ |

## Déjà couvert par nous
Alerte email par commune (Vigilance), liste des villes par région/département (pages `/departement` + `/villes`), score par commune.
