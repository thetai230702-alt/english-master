# NTT GROUP — English Learning Platform

## UI updates in this package
- Premium blue visual theme (navy, royal blue, soft blue-gray).
- NTT GROUP branding on the application shell, sidebar, login and registration screens.
- Segmented breadcrumb navigation in the top header: `NTT GROUP / Học tiếng Anh / [Current page]`.
- Clickable avatar opens the account profile page.
- Account profile page with four tabs:
  - Thông tin cá nhân
  - Công việc
  - Học vấn
  - Gia đình
- Profile data is currently stored in this browser's localStorage. Email is read from Firebase Authentication and shown as read-only. The profile fields are not yet synced to Firestore or shared across devices.
- Responsive layout for desktop and mobile.

## Run locally
1. Keep your existing `.env.local` file outside this archive and restore it into the project root.
2. Install dependencies with `npm install`.
3. Start development server with `npm run dev`.
4. Verify production build with `npm run build`.

This archive intentionally excludes `.env*`, `node_modules`, `.git`, and `dist`.
