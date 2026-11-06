# NTT GROUP — Premium route navigation

## Changes
- Real readable pathname routes instead of hash-only tabs:
  - `/hoc-tieng-anh/tong-quan`
  - `/hoc-tieng-anh/luyen-tap-1500-cau`
  - `/hoc-tieng-anh/luyen-nghe`
  - `/hoc-tieng-anh/flashcard-tu-vung`
  - `/hoc-tieng-anh/tu-vung-cefr`
  - `/hoc-tieng-anh/tu-vung-cua-toi`
  - `/tai-khoan/ho-so-ca-nhan`
  - `/gioi-thieu-ntt-group`
- Premium segmented breadcrumb with clickable parent levels.
- Moved app information out of the English Learning module into a separate Platform section as “Về NTT GROUP”.
- Added SPA fallback files for Netlify (`public/_redirects`) and Vercel (`vercel.json`).

## Important for other hosting providers
The web server must rewrite unknown application paths to `/index.html`. If deployed on Firebase Hosting, configure a rewrite to `/index.html` in `firebase.json`. The source archive does not include a Firebase Hosting config because the current project did not have one.

## Run
Keep your existing `.env.local`, then run:
`npm install`
`npm run dev`
