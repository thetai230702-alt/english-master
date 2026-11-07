# NTT GROUP — Integrated Premium UI / Overview

## Direction
- Integrated platform: one NTT GROUP application shell and shared Firebase Authentication.
- Default authenticated landing page: `/dashboard`.
- English Learning remains a dedicated module, separate from platform-level account and information areas.

## UI work in this release
- Added a platform overview dashboard with module entry cards and quick links.
- Added a distinct "Tổng quan NTT GROUP" item above the English Learning module in the sidebar.
- Kept the existing English Learning pages, Profile, and About page mounted through the same app routing.
- Updated login wording to describe access to NTT GROUP as a platform.
- Kept existing routes and introduced `/dashboard` as the platform home.

## Existing functionality
The existing Firebase auth flow and learning feature components are retained. This release adds a dashboard and changes navigation/presentation; it does not replace the learning modules or their data logic.

## Run locally
1. Keep your existing `.env.local` file.
2. Run `npm install`.
3. Run `npm run dev`.

## Hosting
The application uses client-side routes. The hosting provider must rewrite app routes to `/index.html` for direct navigation and refresh to work.

## Shared UI standardization — next pass
- Added a shared Premium Blue visual layer in `src/App.css`.
- Standardized shared panel borders, card surfaces, input/select/textarea focus states, search fields, segmented filters, table headers/rows, and action button hierarchy.
- Refined responsive behavior for filter bars, table containers, and profile headings.
- Applied blue styling to legacy purple-accented CEFR and personal vocabulary controls where selectors are safely scoped.
- No data models, Firebase operations, speech playback, learning progress, or feature event handlers were intentionally changed.

## Build verification
A build was attempted in the preparation environment but could not run because the extracted `node_modules` directories for `vite` and `@types/node` were empty. Install dependencies on the development machine with `npm install`, then run `npm run build`.

## Shared component foundation — next pass
Added reusable presentation-only components under `src/components/ui/`:
- `NttPageHeader`
- `NttFilterPanel`
- `NttStatusBadge`
- `NttEmptyState`
- `NttDataTable`

These components do not contain Firebase operations, access-control decisions, or business rules.
See `NTT_UI_COMPONENTS_GUIDE.md` for usage examples. They are ready to reuse when NTT Business
requirements are defined.

## NTT Learning UI completion pass
- Standardized the presentation layer across Checklist, Units, Listening, Flashcards, CEFR vocabulary, My Vocabulary, and UnitPractice.
- Refined common page headings, summary cards, progress bars, filter chips, search controls, tables, unit cards, flashcard surfaces, listening player/playlist, practice question cards, and personal vocabulary cards.
- Unified the English-learning visual language around Premium Blue, with responsive adjustments for smaller screens.
- No learning data models, Firestore operations, speech playback logic, unit loading, or practice scoring logic were intentionally changed.
- NTT Business is intentionally deferred until the English-learning experience is reviewed and completed.

## Build verification
`npm run build` was attempted, but the local dependency tree is incomplete: TypeScript cannot resolve `vite/client` and `node` type definitions. Run `npm install` in the project directory, then `npm run build`.

## NTT Learning — Unit Library V2
- Redesigned the 50-Unit library with a premium blue hero, completion ring, four progress summary cards, search, status filters, and responsive Unit cards.
- Unit completion status is read from the existing `english-master-checklist` localStorage key. The library does not create a second progress store.
- Existing `getUnits()` loading and `UnitPractice` component are retained. No sentence content, answer checking, speech playback, or Firebase data operations were intentionally changed.
- Estimated minutes shown on Unit cards are UI guidance only, calculated from sentence count; they are not measured study time.
- Build remains unverified in this environment because `vite/client` and `node` type definitions are missing from the local dependency tree.

## NTT Learning — UnitPractice V2
- Added a question navigator for jumping directly between sentences in the current Unit.
- Added per-question visual review states (correct / needs review) for checks made in the current practice session.
- Added session counters for checked questions and correct answers.
- Added a Unit summary dialog with attempted count, correct count, and accuracy among checked answers.
- The summary is session-only. It does not write new completion records or modify Firestore/checklist progress.
- Existing sentence normalization, speech synthesis, US/UK voice selection, playback speed, answer reveal, and previous/next controls remain in place.
- Build verification is still blocked in this environment by missing local `vite/client` and `node` type definitions.

## NTT Learning — Listening V2
- Added sentence-level seek/navigation within the active playback queue. The range control seeks by sentence, not by audio seconds, because browser SpeechSynthesis does not expose a reliable audio duration/currentTime timeline.
- Progress now shows the current queue position in addition to the absolute sentence number.
- Focus mode counter reflects the selected playlist length rather than the entire Unit length.
- Existing voice, speed, repeat, playlist selection, word-boundary highlighting, focus mode, and Wake Lock flows are retained.
- Build remains unverified because local `vite/client` and `node` type definitions are missing.

## NTT Learning — Flashcards & CEFR V2
- Unit flashcards now support keyword search across English, IPA, Vietnamese meaning, and example sentence, plus status filtering (all / not remembered / remembered).
- Flashcard statistics and progress are scoped to the currently filtered study list. Random selection now chooses a different card when possible.
- CEFR flashcards now support status filtering alongside level, topic, and keyword search. Shuffle uses the currently filtered study list; changing the remembered state refreshes the study queue.
- Existing localStorage progress keys and source vocabulary JSON are preserved.
- Build remains unverified in this environment because the local TypeScript type definition packages for `vite/client` and `node` are missing.

## NTT Learning — My Vocabulary V2
- Preserved the Firestore data model and live topic/word listeners.
- Added configurable English voice (US/UK) and speech rate controls; the selected settings apply to pronunciation buttons and study mode.
- Added a topic-level memory progress bar with remembered percentage.
- Retained topic CRUD, word CRUD, bulk import, keyword search, remembered-state filter, flashcard, typing practice, quiz, and Firestore synchronization.
- Responsive Premium Blue styling and focus states updated.
- Build remains unverified in this environment because the local TypeScript type definition packages for `vite/client` and `node` are missing.


## UI Polish V3 — Platform Dashboard
- Refined NTT GROUP dashboard visual hierarchy, spacing, typography, cards, and responsive breakpoints.
- Added live search for the six NTT Learning quick-access modules, including clear-search and empty-result states.
- Improved keyboard focus states and hover feedback for dashboard actions.
- Existing navigation targets and Firebase/auth behavior are unchanged.
- This pass focuses on the platform dashboard; remaining learning pages can be polished in subsequent passes.


## Checklist V3 — Learning Progress UX
- Added status counts to the four checklist filter tabs.
- Added a reviewed-only filter and ascending/descending Unit sorting.
- Added one-click reset for active filters.
- Added CSV export for all 50 Unit progress records (status, study date, exercise, review, notes).
- Added segmented overall progress for completed / in-progress / not-started Units.
- Preserved the existing localStorage key `english-master-checklist` and existing record structure.
- Progress remains stored in the current browser/device localStorage; it is not synced to Firebase.
