# spec-reactions

Script to count the number of reactions to issues in spec repos.

`build.js` fetches issues from GitHub into `issues.json` (needs `GITHUB_TOKEN`).
`render.js` builds the Svelte app with Vite and prerenders it into
`dist/index.html` with inlined CSS. The page is fully readable without JS;
filtering and sorting are enabled once it hydrates.

```sh
npm run fetch    # write issues.json
npm run dev      # local dev server
npm run render   # build dist/ from an existing issues.json
npm run build    # fetch + render
```
