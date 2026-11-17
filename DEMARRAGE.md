# Démarrage rapide (Windows)

1. **MySQL** doit tourner : `net start MySQL80` (PowerShell administrateur).
2. **Backend** (terminal 1) :
   ```powershell
   cd backend
   Copy-Item .env.example .env   # une seule fois : configuration locale (jamais commitée)
   npm install
   npm run db:reset     # crée les tables + données de démo (efface la base)
   npm run dev          # http://localhost:4000  (test : /health/db)
   ```
3. **Frontend** (terminal 2) :
   ```powershell
   cd frontend
   npm install
   npm run dev          # http://localhost:5173
   ```
4. Ouvre **http://localhost:5173** (pas 127.0.0.1) et connecte-toi : `user1@studioflow.co` / `password123`.

## Connexion Google (bonus) : à savoir

Le bouton « Se connecter avec Google » fonctionne avec n'importe quel compte Google :
- uniquement sur `http://localhost:5173` (pas `127.0.0.1`) ;
- la première connexion Google crée un compte StudioFlow vide (ou rejoint le compte qui a le même e-mail) : pour voir l'application avec des données, utilise les comptes de démo ci-dessus.

Si « Can't reach the server » : le backend ne tourne pas ou le port 4000 est pris
(`netstat -ano | findstr :4000` puis `taskkill /PID <pid> /F`).

## Mise à jour : plusieurs personnes par tâche

La table `tasks.assignee_id` est remplacée par `task_assignees` (plusieurs assignés par tâche).
- Base de démo : `npm run db:reset` dans `backend/` suffit (efface les données).
- Base à conserver : `mysql -u studioflow -p studioflow < db/migrations/001_task_assignees.sql` (copie les anciens assignés puis supprime l'ancienne colonne).

Sur un projet **neuf**, il faut d'abord créer un *livrable* (bouton « + New deliverable » sur le board) : c'est lui qui porte les colonnes To Do / Doing / Done.
