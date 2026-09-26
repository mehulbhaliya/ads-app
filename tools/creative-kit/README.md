# Canvas creative kit (dev only)

Hand-drawn ad layouts used for the MRCOG Comprehensive light-theme drafts (Sep 2026).
They render in the browser at exact text, so no AI image text errors.

1. `npm run dev`, open http://localhost:3000.
2. Put the assets in `local-assets/` (gitignored): `src/diginerve-logo.png`, `exports/mrcog-richa-crop.png`.
3. Copy both files into `local-assets/tools/`, then in the browser console:

```js
(0,eval)(await (await fetch('/local-assets/tools/creative-kit.js')).text()); await KIT_INIT();
(0,eval)(await (await fetch('/local-assets/tools/creative-kit-sizes.js')).text());
await K.save(draw2XSize('4x5'), 'test_4x5.png');            // saved to local-assets/exports
await K.save(drawBundleSize('1x1', [/* 6 checklist items */]), 'test_1x1.png');
```

Sizes: `4x5` (1024x1280), `1x1` (1080x1080), `9x16` (1080x1920, content kept inside the Stories safe zone).
