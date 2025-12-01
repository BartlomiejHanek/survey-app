# survey-app

Aplikacja webowa do tworzenia, zarządzania i wypełniania ankiet.

## Struktura projektu (skrót)

- backend/ — Express + Mongoose (API, modele, kontrolery)
- frontend/ — React + Vite (interfejs do tworzenia i wypełniania ankiet)

## Wymagania

- Node.js 18+ i npm
- Dostęp do MongoDB

## Pliki konfiguracyjne (.env)

- backend/.env

  - MONGO_URI — URI do MongoDB (np. mongodb+srv://user:pass@cluster.mongodb.net/surveydb?retryWrites=true&w=majority)
  - PORT — opcjonalnie port serwera (domyślnie 5000)

- frontend/.env
  - VITE_API — URL backendu, np. `http://localhost:5000`

## Uruchamianie (lokalnie)

1. Backend

   - cd backend
   - npm install
   - npm run dev # uruchamia nodemon src/app.js

2. Frontend
   - cd frontend
   - npm install
   - npm run dev
