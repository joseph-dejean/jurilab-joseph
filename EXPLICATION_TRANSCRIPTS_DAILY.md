# Explication : Transcripts Daily.co - Comportement et Gestion

## 📋 Comment Daily.co structure les transcripts

### Structure des données Daily.co

Daily.co organise les données de cette manière :

1. **Room (Salle)** : Une salle unique créée pour chaque rendez-vous
   - ID : `jurilab-{appointmentId}-{timestamp}`
   - Persistante jusqu'à expiration
   - Peut avoir plusieurs sessions

2. **Session** : Chaque fois qu'un participant rejoint la salle
   - Une session commence quand quelqu'un rejoint
   - Une session se termine quand tous les participants quittent
   - Plusieurs sessions peuvent avoir lieu dans la même salle

3. **Recording (Enregistrement)** : Si l'enregistrement est activé
   - Un enregistrement = une session complète
   - Chaque session peut générer un enregistrement séparé
   - Les enregistrements sont stockés avec un ID unique

4. **Transcript** : Transcription textuelle d'un enregistrement
   - Un transcript = transcription d'un enregistrement
   - Si plusieurs enregistrements existent, il y a plusieurs transcripts

## 🔄 Comportement actuel de notre code

### Ce que fait `getRoomTranscript()` actuellement :

```typescript
// Ligne 181-182 dans dailyService.ts
const latestRecording = recordings.data[0]; // Prend le DERNIER enregistrement
```

**Problème identifié** :
- ✅ Prend le dernier enregistrement (le plus récent)
- ❌ Ne cumule PAS les transcripts de plusieurs sessions
- ❌ Ignore les sessions précédentes

### Scénarios et comportement

#### Scénario 1 : Rejoindre plusieurs fois la même salle

**Exemple** :
- 10h00 : Client rejoint → Session 1 (5 min) → Quitte
- 10h30 : Client rejoint à nouveau → Session 2 (10 min) → Quitte
- 11h00 : Avocat rejoint → Session 3 (30 min) → Quitte

**Comportement actuel** :
- Le code récupère uniquement le transcript de la Session 3 (dernier enregistrement)
- Les Sessions 1 et 2 sont ignorées

#### Scénario 2 : Rejoindre avant l'heure du RDV

**Exemple** :
- RDV prévu à 11h00
- Client rejoint à 10h45 (15 min avant) → Session 1
- Avocat rejoint à 11h00 → Session 2 (réunion principale)

**Comportement actuel** :
- Si la Session 1 a généré un enregistrement, elle sera ignorée
- Seul le transcript de la Session 2 (dernière) sera récupéré

## ⚠️ Limitations actuelles

1. **Pas de cumul** : Les transcripts de plusieurs sessions ne sont pas combinés
2. **Perte de données** : Les sessions précédentes sont perdues
3. **Pas de filtrage par date** : On ne vérifie pas si l'enregistrement correspond à l'heure du RDV

## 💡 Solutions possibles

### Option 1 : Cumuler tous les transcripts (Recommandé)

Modifier `getRoomTranscript()` pour :
- Récupérer TOUS les enregistrements de la salle
- Filtrer ceux qui sont dans la fenêtre du RDV (15 min avant → 1h après)
- Combiner tous les transcripts pertinents
- Trier par ordre chronologique

### Option 2 : Prendre le transcript le plus long

- Récupérer tous les enregistrements
- Prendre celui qui a la durée la plus longue (probablement la vraie réunion)

### Option 3 : Filtrer par timestamp

- Récupérer tous les enregistrements
- Filtrer ceux qui sont proches de l'heure du RDV (±30 minutes)
- Combiner ces transcripts

## 🔧 Amélioration recommandée

Je recommande l'**Option 1** car :
- ✅ Capture toute la conversation (même si on rejoint plusieurs fois)
- ✅ Gère les cas où on rejoint avant l'heure
- ✅ Plus complet et utile pour l'avocat
- ⚠️ Peut être plus long si beaucoup de sessions

## 📝 Note importante sur l'enregistrement

**Actuellement, l'enregistrement est DÉSACTIVÉ** dans notre code (ligne 69 de `dailyService.ts`) :
```typescript
// enable_recording: true, // Commenté car nécessite un plan payant
```

**Conséquence** :
- ❌ Sans enregistrement, il n'y a PAS de transcript disponible
- ❌ Les transcripts ne peuvent pas être générés

**Solutions** :
1. Activer l'enregistrement (nécessite un plan Daily.co payant)
2. Utiliser l'API de transcription en temps réel (si disponible)
3. Utiliser un service alternatif pour la transcription

## 🎯 Recommandation immédiate

Pour que les transcripts fonctionnent, il faut :
1. **Activer l'enregistrement** dans Daily.co (plan payant requis)
2. **Améliorer `getRoomTranscript()`** pour cumuler les transcripts de toutes les sessions pertinentes
3. **Filtrer par fenêtre de temps** pour ne prendre que les sessions du RDV

Souhaitez-vous que je modifie le code pour implémenter l'Option 1 (cumul des transcripts) ?

