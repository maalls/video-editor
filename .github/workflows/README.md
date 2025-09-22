# Auto-merge Workflow Documentation

Ce workflow GitHub Actions automatise le processus de merge vers la branche `main` quand un tag versionné est créé.

## 🚀 Comment ça fonctionne

### 1. Déclenchement
Le workflow se déclenche automatiquement quand vous poussez un tag qui suit le pattern de versioning sémantique :
- `v1.0.0`, `v2.1.3`, `v0.5.0` (releases)
- `v1.0.0-beta.1`, `v2.0.0-alpha.2` (pre-releases)

### 2. Processus automatique
1. **Détection du tag** : Le workflow identifie le tag et la branche source
2. **Tentative de merge** : Essaie de merger automatiquement vers `main`
3. **Gestion des conflits** : Si des conflits surviennent, crée une issue GitHub
4. **Notifications** : Vous informe du succès ou de l'échec

## 📋 Utilisation

### Méthode recommandée : Script helper

```bash
# Créer un tag de release
./scripts/create-tag.sh 1.2.0

# Créer un tag avec message personnalisé  
./scripts/create-tag.sh 1.2.0 "Nouvelle fonctionnalité importante"

# Créer un tag de pre-release
./scripts/create-tag.sh 2.0.0-beta.1
```

### Méthode alternative : NPM scripts

```bash
# Voir l'aide
npm run release:help

# Utiliser le script (vous devrez passer les arguments manuellement)
npm run release:tag -- 1.2.0
```

### Méthode manuelle : Git

```bash
# Créer et pousser un tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

## ✅ Cas de succès

Quand le merge se passe bien :
- ✅ Le tag est automatiquement mergé dans `main`
- ✅ Un résumé apparaît dans les Actions GitHub
- ✅ La branche `main` est mise à jour automatiquement

## ⚠️ Gestion des conflits

Si des conflits surviennent :
- ❌ Le merge automatique échoue
- 🎫 Une issue est créée automatiquement avec :
  - Les fichiers en conflit
  - Instructions détaillées de résolution
  - Commandes git à exécuter
- 📧 Vous êtes notifié via GitHub

### Résolution manuelle des conflits

1. **Suivre les instructions dans l'issue créée**
2. **Résoudre les conflits localement :**
   ```bash
   git checkout main
   git pull origin main
   git merge v1.2.0  # Le tag en conflit
   # Résoudre les conflits dans les fichiers
   git add .
   git commit -m "chore: resolve conflicts for tag v1.2.0 merge to main"
   git push origin main
   ```
3. **Fermer l'issue une fois résolu**

## 🔧 Configuration

### Permissions requises
Le workflow utilise les permissions suivantes :
- `contents: write` - Pour créer les merges
- `issues: write` - Pour créer les issues de conflit
- `pull-requests: write` - Pour les interactions avec les PRs

### Branches supportées
- **Source** : N'importe quelle branche (copilot, feature/*, etc.)
- **Target** : `main` (branche principale)

## 📊 Monitoring

### Actions GitHub
Surveillez vos workflows sur : `https://github.com/maalls/video-editor/actions`

### Issues automatiques
Les conflits génèrent des issues avec les labels :
- `merge-conflict` - Conflit de merge
- `urgent` - Nécessite attention immédiate  
- `auto-merge` - Généré par le workflow automatique

## 🎯 Bonnes pratiques

### Avant de créer un tag
1. **Vérifiez que votre branche est prête :**
   ```bash
   git status
   npm test
   ```

2. **Utilisez le versioning sémantique :**
   - `MAJOR.MINOR.PATCH` (ex: 1.2.0)
   - Incrémentez `MAJOR` pour les breaking changes
   - Incrémentez `MINOR` pour les nouvelles fonctionnalités
   - Incrémentez `PATCH` pour les corrections de bugs

3. **Testez votre code avant le tag**

### Messages de commit
Le workflow génère des messages de commit standardisés :
```
chore: auto-merge tag v1.2.0 to main
```

## 🛠️ Troubleshooting

### "Main branch does not exist"
- Assurez-vous que la branche `main` existe sur GitHub
- Vérifiez les permissions du repository

### "Tag already exists"
- Utilisez `git tag -l` pour voir les tags existants
- Choisissez un nouveau numéro de version

### "Working directory not clean"
- Committez ou stashez vos changements avant de créer un tag
- Utilisez `git status` pour voir les fichiers modifiés

## 📝 Exemples d'utilisation

### Release standard
```bash
# Développement sur copilot
git checkout copilot
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin copilot

# Créer le tag de release
./scripts/create-tag.sh 1.3.0 "Ajout de nouvelles fonctionnalités"

# Le workflow auto-merge se déclenche automatiquement
```

### Hotfix urgent
```bash
# Créer une branche hotfix depuis main
git checkout main
git checkout -b hotfix/critical-bug
# ... corrections ...
git push origin hotfix/critical-bug

# Tag de patch
./scripts/create-tag.sh 1.2.1 "Correction critique"
```

Ce workflow simplifie considérablement le processus de release et garantit une intégration fluide vers la branche principale ! 🚀