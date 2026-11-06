# NTT Learning — Dashboard UI V2

## Scope
- New premium-blue hero for the learning overview.
- Live completion ring based on the existing 50-unit checklist.
- Resume unit recommendation (first in-progress unit, otherwise first not completed).
- Quick navigation to Units, Listening, and Flashcards via the existing tab router.
- Overview insights for completed exercises and reviews.
- Responsive layout for phone/tablet/desktop and reduced-motion support.
- Defensive loading of old checklist localStorage records while preserving valid existing fields.

## Compatibility
No changes to Firebase configuration, unit service, learning scoring, audio playback, personal vocabulary, or authentication. NTT Business is still deferred.

## Build status
Build was attempted but local dependencies are incomplete (`vite/client`, `node` type definitions missing). On your machine: `npm install`, `npm run build`, `npm run dev`.
