Projet orgalink
===============
# Orgalink — Outil de modélisation et visualisation d'organisations sociales en entreprise

> Projet M1 — ISEN Brest | 2025/2026  
> Réalisé par **Faustine Madec** & **Océane Le Blainvaux**  
> Encadré par **Thierry Le Pors** & **Manuel Irles**

---

## Description

**Orgalink** est une application web interactive conçue comme support pédagogique pour les cours de sociologie des organisations. Elle permet de modéliser et visualiser les relations sociales en entreprise : aussi bien la hiérarchie formelle que les dynamiques informelles (alliances, tensions, réseaux d'influence).

Ce projet s'inscrit dans une continuité pédagogique à l'ISEN Brest, en reprenant et en améliorant significativement une base existante grâce à une phase de rétro-ingénierie approfondie.

---

## Fonctionnalités principales

- **Authentification** avec deux rôles distincts : `élève` et `professeur`
- **Gestion des acteurs** : création, modification, suppression via un tableau interactif
- **Organigramme formel** : visualisation hiérarchique générée automatiquement (GoJS)
- **Graphique informel** : représentation libre des relations sociales (Cytoscape.js)
  - Flèches simples et double sens avec intensité variable
  - Zones d'ambiance (alliances / tensions) colorées
  - Ajout d'objets et d'entités contextuelles
  - Menu clic droit pour personnaliser les nœuds (forme, texte)
  - Fiche acteur détaillée au double clic
- **Sauvegarde et liste des graphiques** : export PNG + JSON, rechargement et modification
- **Vue professeur** : accès à tous les graphiques déposés par les élèves, avec suppression

---


## Installation en local

### Prérequis
- [XAMPP](https://www.apachefriends.org/) (Windows) ou [MAMP](https://www.mamp.info/) (macOS)
- Navigateur web moderne



## Période de développement

Du **05 janvier 2026** au **30 avril 2026** (~300 heures sur 10 semaines)

---

##  Licence

Projet académique — ISEN Brest. Usage pédagogique uniquement.
