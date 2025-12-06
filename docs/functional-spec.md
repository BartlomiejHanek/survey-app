<!--- Specyfikacja funkcjonalna aplikacji do ankiet (polski) --->
# Aplikacja do ankiet — Specyfikacja funkcjonalna

## Cel

Dokument opisuje wymagane funkcjonalności systemu do tworzenia, publikowania i analizowania ankiet. Zawiera opis ról użytkowników, funkcji dla każdej roli, wymagania techniczne oraz przykładowe przepływy użytkownika.

## Role użytkowników

Aplikacja zakłada istnienie dwóch głównych ról:

- **Administrator / Autor ankiety**: tworzy i zarządza ankietami. Uprawnienia: pełny dostęp do zarządzania ankietami, edycji, publikacji i analiz.
- **Uczestnik (Respondent)**: wypełnia ankiety udostępnione przez autora. Uprawnienia: dostęp jedynie do formularzy publikowanych.

W przyszłości możliwe jest rozszerzenie o dodatkowe role (np. recenzent, moderator, grupa respondentów).

## Funkcjonalności dla Administratora

- **Zarządzanie ankietami**
  - Tworzenie nowej ankiety — nadawanie nazwy, celu i opisu.
  - Ustalanie statusu ankiety: `robocza` / `opublikowana` / `zakończona`.

- **Projektowanie formularza ankiety**
  - Dodawanie różnych typów pytań:
    - pojedynczy wybór (radio)
    - wielokrotny wybór (checkbox)
    - pytania otwarte (input, textarea)
    - skale (np. 1–5)
    - lista rozwijana
  - Oznaczanie pytań jako obowiązkowe lub opcjonalne.
  - Zmiana kolejności pytań (drag & drop).
  - Podgląd ankiety przed publikacją.

- **Zarządzanie dostępem**
  - Generowanie linku publicznego do ankiety.
  - Ograniczenie liczby wypełnień:
    - jednorazowe wypełnienie na użytkownika
    - możliwość anonimowego udziału
  - Ustalanie daty ważności ankiety.

- **Analiza wyników**
  - Podgląd odpowiedzi w czasie rzeczywistym.
  - Zestawienia statystyczne:
    - liczba odpowiedzi
    - wykresy (słupkowe, kołowe dla pytań zamkniętych)
    - eksport wyników (CSV / XLSX / PDF)
  - Podgląd pojedynczych odpowiedzi.
  - Możliwość archiwizacji lub usuwania ankiety i wyników.

## Funkcjonalności dla Uczestnika

- Dostęp do ankiety poprzez link.
- Wypełnianie formularza zgodnie z logiką aplikacji (walidacja pól, ukrywanie pól warunkowych itp.).
- Walidacja odpowiedzi wymaganych.
- Informacja o poprawnym przesłaniu.
- Brak możliwości ponownego wypełnienia (jeśli ustawione przez autora).

Opcjonalnie:
- Możliwość zapisu odpowiedzi i dokończenia później (po logowaniu lub na podstawie tokenu).

## Wymagania systemowe / techniczne — propozycje

### Backend

- HTTP API: REST lub GraphQL.
- Technologie przykładowe: PHP (Laravel), JavaScript (Node.js/Express), Python (Django/Flask).
- Baza danych: relacyjna lub dokumentowa. Przykładowe tabele/ kolekcje: `users`, `surveys`, `questions`, `answers`, `results`.
- Obsługa autoryzacji i ról użytkowników (JWT, OAuth lub inne mechanizmy sesji).

### Frontend

- SPA (React/Angular/Vue) lub klasyczne widoki.
- Panel administracyjny z edytorem pytań (drag & drop, podgląd na żywo).
- Formularz responsywny, dostępny na urządzeniach mobilnych i desktop.

### Inne wymagania

- RODO: ograniczenie przetwarzania danych osobowych lub zapewnienie mechanizmów ochrony (zgoda, anonimizacja).
- Logowanie zdarzeń (timestampy odpowiedzi, audyt zmian ankiety).
- Backup danych ankiet i wyników.

## Przykładowy przepływ użytkownika

**Administrator**
1. Loguje się → tworzy ankietę → dodaje pytania → publikuje.
2. Wysyła link do grupy odbiorców.
3. Analizuje wyniki w panelu statystyk.

**Respondent**
1. Otwiera link → wypełnia → wysyła.
2. Widzi komunikat o zakończeniu udziału.

## Rozszerzenia / przyszłe funkcje (pomysły)

- Harmonogram publikacji ankiet (publish at / unpublish at).
- Segmentacja odbiorców i wysyłka zaproszeń e-mail.
- Zaawansowana logika warunkowa (pytania zależne od odpowiedzi).
- Integracje z narzędziami analitycznymi i eksport do systemów BI.

---

Plik ten można wykorzystać jako punkt wyjścia do dalszego projektowania UI, API i schematu bazy danych.
