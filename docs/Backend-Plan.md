Based on the provided API Contract.md and architecture.md for the Hassaniya Translation Manager, and the structure of the previous Backend-Plan.md, here is a complete and well-structured Backend Team Plan tailored to the new project.

---

Hassaniya Translation Manager – Backend Team Plan

Version: 1.0 – Août 2026
Document interne – équipe backend

---

1. Purpose

Ce document permet à l'équipe backend de travailler efficacement tout en protégeant :

· Le contrat API (source de vérité)
· Les règles métier (architecture)
· L'intégrité des données (phrases, traductions, exports)
· La sécurité (validation, rate limiting)

La source de vérité backend est :

· Contrat API : API Contract.md
· Architecture & règles métier : architecture.md
· Séquençage global : Ce document

Aucune implémentation ne doit dévier du contrat API sans validation préalable.

---

2. Ownership

L'équipe backend possède :

· backend/ ou src/app/api/ (API Routes)
· src/lib/services/ (Services métier)
· prisma/schema.prisma (Modèles de données)
· src/lib/validators/ (Validation)
· src/lib/utils/ (Utilitaires)
· scripts/ (Scripts de maintenance)
· Tous les tests backend (unitaires + intégration)

L'équipe backend ne modifie pas l'UI frontend.

---

3. Current Runtime

Depuis la racine du projet :

```bash
npm run dev          # frontend + backend (API Routes)
npm run db:studio    # Accès à la base de données
npm run test         # Tests unitaires
```

Dépendances locales :

```text
PostgreSQL   : postgresql://localhost:5432/hassaniya_translation
Redis        : redis://localhost:6379 (optionnel pour V1)
```

Variables d'environnement requises :

```env
DATABASE_URL=postgresql://...
HUGGINGFACE_TOKEN=hf_...
HUGGINGFACE_REPO=ahmed200512/hassanie_claude-translation
NODE_ENV=development
```

---

4. Backend Rules (strictes)

Règle Explication
Routes API = couche HTTP uniquement Validation, appel service, réponse standard
Services = toute la logique métier Phrase, Statistiques, Export, Validation
Modèles = schémas + relations Pas de logique métier dans Prisma models
Transaction PostgreSQL prisma.$transaction() pour opérations critiques (batch insert, export)
Réponse standard { success, data, error, meta } (sauf 204)
Codes erreur = contrat API Pas d'invention de codes
Idempotence obligatoire Sur POST /sentences/batch et POST /export/hf
Aucun fichier sur le filesystem local Pas de stockage de fichiers local (JSONL généré en mémoire)
Logs structurés Pino ou Winston
Rate limiting express-rate-limit + Redis (optionnel en V1)

---

5. Contract Compatibility Rule

L'équipe backend implémente exactement le contrat API (API Contract.md).

Règles de compatibilité :

· Path, méthode, auth, requête, réponse, codes erreur, pagination → identiques
· Toute réponse = { success, data, error, meta } sauf 204
· Pagination offset-based : page, limit, total
· Timestamps = ISO 8601 UTC

Handoff au frontend : Pour chaque endpoint terminé, fournir :

· méthode + path
· exemple de réponse succès
· codes erreur possibles
· identifiants de test (si authentification V2)

Si le backend ne peut pas respecter le contrat → stop et demande de clarification.

---

6. Phase-by-Phase Backend Work

Phase 1 — Setup & Infrastructure

Livrables :

· Projet Node.js avec TypeScript configuré
· Prisma ORM installé et configuré
· Schéma de base de données (modèle Sentence)
· Migration initiale
· Structure de dossiers organisée

Schéma Prisma (V1) :

```prisma
model Sentence {
  id            Int      @id @default(autoincrement())
  arabic        String   @unique
  hassaniya     String?
  status        Status   @default(PENDING)
  exportedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("sentences")
}

enum Status {
  PENDING
  TRANSLATED
}
```

Règles critiques :

· arabic doit être unique pour éviter les doublons
· Index sur status pour les filtres fréquents
· ✅ Review schéma + migrations

---

Phase 2 — Services de Base

Livrables :

· Service Phrase (src/lib/services/phrase.service.ts)
  · createBatch(phrases: string[]): Promise<BatchResult>
  · createSingle(arabic: string): Promise<Sentence>
  · findAll(filters, pagination): Promise<PaginatedResult>
  · findOne(id: number): Promise<Sentence | null>
  · updateTranslation(id: number, hassaniya: string): Promise<Sentence>
  · deleteOne(id: number): Promise<void>
  · deleteMany(filter): Promise<{ deletedCount: number }>
· Service Statistiques (src/lib/services/statistics.service.ts)
  · getDashboardStats(): Promise<DashboardStats>
· Validation (src/lib/validators/phrase.validator.ts)
  · Schémas Zod pour toutes les entrées

Règles critiques :

· Toute modification de hassaniya déclenche automatiquement la mise à jour du status
· Le statut TRANSLATED si hassaniya non vide, PENDING sinon
· ✅ Review unit tests pour les services

---

Phase 3 — API Routes (Sentence CRUD)

Livrables :

· Routes API :
  · POST /api/sentences/batch → phraseService.createBatch()
  · POST /api/sentences → phraseService.createSingle()
  · GET /api/sentences → phraseService.findAll()
  · GET /api/sentences/:id → phraseService.findOne()
  · PUT /api/sentences/:id → phraseService.updateTranslation()
  · DELETE /api/sentences/:id → phraseService.deleteOne()
  · DELETE /api/sentences → phraseService.deleteMany()
· Route Statistiques :
  · GET /api/stats → statisticsService.getDashboardStats()

Règles critiques :

· Validation avec Zod sur toutes les requêtes
· Gestion des erreurs avec try/catch et réponse standard
· Rate limiting : 100 req/min par IP
· ✅ Review sécurité + validation

---

Phase 4 — Service d'Export (Cœur Métier)

Livrables :

· Service Export (src/lib/services/export.service.ts)
  · previewExport(): Promise<PreviewResult>
  · generateJSONL(): Promise<string> (génère le contenu JSONL)
  · exportToHuggingFace(): Promise<ExportResult>
  · getExportStatus(jobId: string): Promise<ExportStatus>

Logique d'export :

1. Récupérer toutes les phrases TRANSLATED
2. Télécharger dataset existant depuis Hugging Face
3. Fusionner et dédupliquer (basé sur arabic + hassani)
4. Générer JSONL
5. Upload vers Hugging Face

Règles critiques :

· Utilisation de prisma.$transaction() pour l'opération d'export
· Ne pas exporter les phrases sans traduction
· Gestion des erreurs Hugging Face avec fallback
· ✅ Review sécurité + gestion des tokens

---

Phase 5 — Routes d'Export

Livrables :

· Routes API :
  · POST /api/export/hf → exportService.exportToHuggingFace()
  · GET /api/export/status → exportService.getExportStatus()
  · POST /api/export/preview → exportService.previewExport()
  · GET /api/export/dataset → exportService.generateJSONL() (fichier téléchargé)

Règles critiques :

· POST /export/hf doit être idempotent (si un job est en cours, rejeter ou retourner le job existant)
· GET /export/dataset : Content-Type application/x-ndjson, Content-Disposition attachment
· ✅ Review performance (génération JSONL en mémoire avec streaming si nécessaire)

---

Phase 6 — Health & Monitoring

Livrables :

· Route Health :
  · GET /api/health → { status: 'ok', timestamp, services: { database, huggingface } }
· Logs structurés :
  · Implémentation de Pino ou Winston
  · Correlation ID pour les requêtes
· Rate Limiting :
  · Configuration de express-rate-limit (si en environnement Next.js API Routes)

Règles critiques :

· Health check doit vérifier la connexion à PostgreSQL et Hugging Face
· Logs avec niveau : info, warn, error
· ✅ Review monitoring + alerting

---

Phase 7 — Tests & Documentation

Livrables :

· Tests unitaires :
  · Services (Phrase, Statistiques, Export)
  · Validateurs
· Tests d'intégration :
  · Cycle de vie complet (ajout → traduction → export)
  · API Routes
· Documentation :
  · README.md avec instructions d'installation et de développement
  · Swagger/OpenAPI (optionnel)

Règles critiques :

· Tests doivent couvrir les cas d'erreur (duplicate, not found, invalid state)
· ✅ Review coverage (minimum 80%)

---

7. Backend Definition of Done

· L'endpoint existe dans le contrat API avant d'écrire une ligne de code
· La structure de la réponse est identique au contrat
· La règle métier est documentée dans l'architecture
· Validation (Zod ou class-validator) centralisée
· La logique métier est dans un service, pas dans la route
· Les modules critiques (Phrase, Export) ont été relus
· Les tests unitaires passent
· Les tests d'intégration passent
· La transaction PostgreSQL est utilisée pour les opérations multi-tables
· L'idempotence est implémentée pour POST /sentences/batch et POST /export/hf
· Les logs sont structurés et utiles pour le debugging

---

8. Checklist Production

Étape Status
Variables d'environnement configurées ☐
Base de données PostgreSQL prête ☐
Migration exécutée ☐
Token Hugging Face configuré ☐
Rate limiting activé ☐
Logs structurés configurés ☐
Health check accessible ☐
Tests d'intégration passent ☐
Documentation README à jour ☐

---

Fin du document – Backend Team Plan Hassaniya Translation Manager V1.0