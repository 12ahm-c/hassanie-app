Based on the provided cahier_charge 2.md (New Project) and architecure 2.md (Previous Project), here is a complete, well-structured Architecture Document for the new "Hassaniya Translation Manager" application.

The document leverages the professional structure and style of the previous architecture while being meticulously tailored to the specific needs and logic of the new translation management project, avoiding any direct copy of content.

---

Architecture Technique & System Design

Nom du Projet : Hassaniya Translation Manager (HTM)
Version : V1.0 – Août 2026
Document de référence pour l’équipe de développement

---

Table des Matières

1. Vue d’ensemble
2. Principes architecturaux
3. Architecture en couches
4. Structure des projets
5. Acteurs du système
6. Modules backend
7. Architecture base de données
8. Relations entre collections
9. Flux principaux
10. Architecture de sécurité
11. API Design
12. Stratégie de scalabilité

---

1. Vue d’ensemble

Hassaniya Translation Manager est une application web dédiée à la gestion, la traduction et la constitution d'un jeu de données bilingue (Arabe ↔ Hassaniya). Elle permet de :

· Centraliser l'importation et la gestion de phrases en arabe.
· Fournir une interface simple et intuitive pour ajouter manuellement des traductions en Hassaniya.
· Suivre la progression des traductions via un tableau de bord.
· Maintenir une base de données locale complète (phrases traduites et non traduites) pour le suivi.
· Exporter et fusionner les données traduites vers un dataset Hugging Face, en assurant la déduplication et en respectant le format JSONL.

L'application s'adresse à un seul rôle principal : le Traducteur.

---

2. Principes architecturaux

Principe Décision Justification
Application Full-Stack Unifiée Backend et Frontend au sein d'un même projet (ex: Next.js). Simplifie le développement pour une application web de gestion avec un périmètre bien défini.
API‑First (Interne) L'interface utilisateur interagit avec une API REST interne. Sépare clairement la logique métier de la présentation, facilitant les tests et la maintenance.
Base de données unique SQLite (pour le développement) / PostgreSQL (pour la production). Base de données relationnelle robuste pour gérer les états des phrases et les utilisateurs.
Stateless backend JWT pour l’authentification (si applicable). Scalabilité et sécurité simplifiées.
Séparation des données Base de données (Master) vs. Dataset Hugging Face (Publication). Permet de gérer le flux de travail de manière progressive (ajout de phrases → traduction → export).
Processus asynchrone Tâches de fusion et d'upload vers Hugging Face exécutées en arrière-plan. Améliore l'expérience utilisateur en ne bloquant pas l'interface lors d'opérations longues.

---

3. Architecture en couches

```
┌─────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                     │
│                Interface Web (React/Next.js)         │
│   Pages : Dashboard, Gestion des Phrases, Ajout    │
├─────────────────────────────────────────────────────┤
│                       REST API                      │
├─────────────────────────────────────────────────────┤
│                  API LAYER                          │
│           Routes API + Contrôleurs                  │
│         Validation des données avec schémas         │
├─────────────────────────────────────────────────────┤
│              BUSINESS LOGIC LAYER                   │
│ Services : Phrase, Traduction, Export, Statistiques │
│         Règles métier isolées des contrôleurs       │
├─────────────────────────────────────────────────────┤
│              DATA ACCESS LAYER                      │
│                 Prisma / ORM                       │
│           (Repositories pour la base de données)    │
├─────────────────────────────────────────────────────┤
│            EXTERNAL SERVICES LAYER                  │
│   Hugging Face Hub API (datasets), File System     │
└─────────────────────────────────────────────────────┘
```

---

4. Structure des projets

Le projet sera structuré comme une application monolithique modulaire, idéalement avec un framework comme Next.js (App Router) pour bénéficier à la fois du backend API et du frontend React.

```
hassaniya-translation-manager/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (public)/                # Routes de l'interface utilisateur
│   │   │   ├── page.tsx             # Dashboard (Accueil)
│   │   │   ├── phrases/
│   │   │   │   ├── page.tsx         # Liste des phrases (avec filtres)
│   │   │   │   └── add/page.tsx     # Page d'ajout de phrases
│   │   │   └── export/page.tsx      # Page de gestion de l'export
│   │   └── api/                     # Next.js API Routes (Backend)
│   │       ├── auth/                # (Optionnel) Authentification
│   │       ├── phrases/
│   │       │   ├── route.ts         # GET (liste) & POST (ajout)
│   │       │   └── [id]/
│   │       │       └── route.ts     # GET, PUT, DELETE par ID
│   │       ├── stats/
│   │       │   └── route.ts         # GET pour les statistiques
│   │       └── export/
│   │           └── route.ts         # POST pour lancer l'export HF
│   ├── components/
│   │   ├── ui/                      # Composants UI génériques
│   │   ├── dashboard/               # Composants pour le dashboard
│   │   └── phrases/                 # Composants pour la gestion des phrases
│   ├── lib/
│   │   ├── db/                      # Client Prisma et schéma
│   │   │   └── prisma.schema
│   │   ├── services/
│   │   │   ├── phrase.service.ts    # Logique métier des phrases
│   │   │   ├── statistics.service.ts# Calcul des statistiques
│   │   │   └── export.service.ts    # Logique d'export vers Hugging Face
│   │   ├── utils/
│   │   │   └── jsonl.utils.ts       # Fonctions pour manipuler JSONL
│   │   └── validators/
│   │       └── phrase.validator.ts  # Validation des données entrantes
│   └── types/
│       └── index.ts                 # Types TypeScript partagés
├── scripts/
│   ├── backup-db.js                 # (Optionnel) Script de sauvegarde
│   └── seed.js                      # Script d'initialisation de la DB
├── prisma/
│   ├── schema.prisma                # Modèle de données
│   └── migrations/                  # Migrations de base de données
├── public/                          # Fichiers statiques
├── .env.local                       # Variables d'environnement
└── package.json
```

---

5. Acteurs du système

Acteur Rôle Accès
Traducteur Ajouter des phrases, consulter la liste, ajouter des traductions, déclencher l'export vers HF. 100% des fonctionnalités de l'application.
Administrateur (Optionnel) Gestion des utilisateurs, supervision générale. (Fonctionnalité pouvant être ajoutée en V2).

---

6. Modules backend

6.1 Phrases Module

· CRUD : Création, lecture (liste, détails), mise à jour (ajout de la traduction), suppression de phrases.
· Validation : Vérifier que le contenu arabe est unique et non vide.
· Statut : Gérer un statut (TRANSLATED, PENDING) basé sur la présence d'une traduction.

6.2 Statistics Module

· Calcul et exposition des métriques du tableau de bord :
  · Nombre total de phrases.
  · Nombre de phrases traduites.
  · Nombre de phrases en attente.
  · Nombre de phrases exportées avec succès vers Hugging Face.

6.3 Export Module

· Génération JSONL : Récupérer toutes les phrases traduites et les formater en JSONL.
· Intégration Hugging Face : Interagir avec l'API Hugging Face pour :
  · Télécharger le dataset existant.
  · Fusionner les nouvelles données.
  · Dédupliquer les entrées.
  · Uploader le dataset final vers le repository cible.
· Gestion d'état : Suivre l'état de l'export (EN_COURS, REUSSI, ECHEC).

6.4 (Optionnel) Auth Module

· Gestion d'un compte utilisateur unique pour sécuriser l'accès à l'application.
· Connexion (email + mot de passe).
· Génération de JWT.

---

7. Architecture base de données

SGBD : PostgreSQL (Recommandé pour la production) ou SQLite (pour le développement/test).

Outil ORM : Prisma (Facilite les migrations et les requêtes).

7.1 Modèle : Sentence

Ce modèle représente la source de vérité pour l'ensemble du processus de traduction.

```prisma
model Sentence {
  id            Int      @id @default(autoincrement())
  arabic        String   @unique   // Contenu en arabe, unique pour éviter les doublons
  hassaniya     String?            // Traduction en hassaniya (nullable)
  status        Status   @default(PENDING) // PENDING ou TRANSLATED
  exportedAt    DateTime?          // Date de la dernière exportation réussie vers HF
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("sentences")
}

enum Status {
  PENDING
  TRANSLATED
}
```

7.2 Modèle : User (Optionnel - V2)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Hashé
  createdAt DateTime @default(now())

  @@map("users")
}
```

8. Relations entre collections

· La logique est centrée sur une seule entité principale : Sentence. Il n'y a pas de relations complexes entre les collections à ce stade, ce qui simplifie l'architecture.

9. Flux principaux

9.1 Flux d’ajout de phrases (Traducteur)

1. Le traducteur accède à la page "Ajouter des phrases".
2. Il colle plusieurs phrases arabes (une par ligne).
3. Il soumet le formulaire.
4. Le backend reçoit les données, les découpe et, pour chaque phrase :
   · Vérifie si elle existe déjà en base (via le champ arabic).
   · Si elle n'existe pas, crée un nouvel enregistrement avec le statut PENDING.
5. Un message de succès est retourné à l'utilisateur.

9.2 Flux de traduction d’une phrase

1. Le traducteur accède à la liste des phrases (avec un filtre sur les phrases PENDING).
2. Il saisit la traduction en hassaniya dans le champ dédié d'une ligne.
3. Il soumet le formulaire de mise à jour.
4. Le backend met à jour l'enregistrement correspondant avec la traduction et change son statut en TRANSLATED.

9.3 Flux d’export vers Hugging Face

1. Le traducteur se rend sur la page "Export".
2. Il clique sur le bouton "Exporter vers Hugging Face".
3. Le backend lance un job asynchrone (ou effectue les opérations en direct si simple) :
   · Étape 1 : Récupère toutes les phrases avec le statut TRANSLATED.
   · Étape 2 : Télécharge le dataset existant depuis ahmed200512/hassanie_claude-translation.
   · Étape 3 : Formate les nouvelles phrases en une liste de dictionnaires {arabic, hassani}.
   · Étape 4 : Fusionne les deux datasets et supprime les doublons (basé sur (arabic, hassani)).
   · Étape 5 : Convertit le dataset fusionné en format JSONL.
   · Étape 6 : Uploade le nouveau dataset vers le repository Hugging Face.
4. Une fois l'opération terminée, les champs exportedAt des phrases exportées sont mis à jour et un retour est fait à l'utilisateur.

---

10. Architecture de sécurité

· Authentification (V1) : Pour un usage interne ou en développement, l'authentification peut ne pas être implémentée. L'application peut être protégée par un mécanisme simple (ex: Basic Auth au niveau du serveur web) ou un système d'authentification unique (V2).
· Validation des données : Toutes les entrées utilisateur (phrases, traductions) sont validées côté serveur et côté client pour assurer l'intégrité des données.
· Sécurisation des tokens Hugging Face : Le token d'accès à l'API Hugging Face est stocké en variable d'environnement et n'est jamais exposé côté client.

---

11. API Design

Conventions :

· Base URL : /api
· Format réponse standard :

```json
{
  "success": true,
  "data": {},
  "message": "Opération réussie",
  "error": null
}
```

Endpoints clés :

Méthode Route Description Corps de la requête
GET /api/stats Récupère les statistiques du tableau de bord. -
GET /api/phrases Récupère la liste des phrases (avec filtres). -
POST /api/phrases Ajoute une ou plusieurs nouvelles phrases. { "phrases": ["phrase1", "phrase2"] }
PUT /api/phrases/:id Met à jour une phrase (ajout de la traduction). { "hassaniya": "nouvelle traduction" }
DELETE /api/phrases/:id Supprime une phrase. -
POST /api/export/hf Déclenche le processus d'export vers Hugging Face. -
GET /api/export/status (Optionnel) Récupère l'état du dernier job d'export. -

---

12. Stratégie de scalabilité

La V1 est une application simple à faible charge. La stratégie de scalabilité est concentrée sur la performance des jobs d'export.

· V1 (MVP) : Application web monolithique déployée sur une plateforme comme Vercel, Railway ou un VPS simple. Base de données PostgreSQL gérée (ex: Supabase, Neon). Les jobs d'export sont exécutés de manière synchrone ou via une file d'attente simple (BullMQ avec Redis) pour éviter les timeouts.
· V2 (Croissance) : Si le nombre de phrases et d'utilisateurs augmente, on peut envisager :
  · File d'attente dédiée : Utiliser un service comme BullMQ pour gérer les exports de manière robuste et asynchrone.
  · Base de données répliquée : Pour les opérations de lecture intensives.
  · Mise en cache : Mettre en cache les statistiques du tableau de bord pour réduire la charge sur la base de données.