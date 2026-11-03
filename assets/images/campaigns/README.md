# Twibbon Campaign Images - Migration Note

## Problem
Campaign images stored in `campaigns/` folder were not accessible on the live GitHub Pages site (HTTP 404).

## Root Cause
Jekyll, the static site generator used by GitHub Pages, does not copy folders outside of `assets/` to the build output. The `campaigns/` folder was ignored during the build process.

## Solution
All campaign images have been moved from `campaigns/` to `assets/images/campaigns/`:

- `campaigns/harlah/` → `assets/images/campaigns/harlah/`
- `campaigns/maulid/` → `assets/images/campaigns/maulid/`
- `campaigns/ppdb/` → `assets/images/campaigns/ppdb/`
- `campaigns/harlah-ke-4/` → `assets/images/campaigns/harlah-ke-4/`

All paths in `data/campaigns.json` have been updated to use the new `assets/images/campaigns/` prefix.

## For Future Campaigns
When adding new campaign images:
1. Save images in `assets/images/campaigns/<campaign-name>/`
2. Update `data/campaigns.json` with paths like `assets/images/campaigns/<campaign-name>/image.png`
3. Commit and push to GitHub

## Verification
Images are now accessible at:
- https://daarulazmi.ponpes.id/assets/images/campaigns/harlah-ke-4/cover.png (HTTP 200)
