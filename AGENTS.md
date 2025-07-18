# Overview

This is a local streaming music player. That scans a local music directory, adds all audio files
and allows the client to select and stream audio as if it were spotify or youtube music. The user
can search song titles, albums, and artists. The UI should be sleek and modern similar to spotify
or iTunes. Under the settings page the user can change music directory, trigger a scan. There will
be music player controls along the bottom of the window.

# Dependencies

- pnpm
- Next.js
- React
- Typescript
- lowdb
- tailwindcss
- headlessui
- heroicons

# Cody Style

- Prefer functional components over classes
- Do not alter existing formatting
- Add types for when converting json to objects
- strict typescript only. do not use `any`
- add types or interfaces where necessary, especially when deconstructing json
- prefer `const` when possible
