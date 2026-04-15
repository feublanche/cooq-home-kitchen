

## Plan: EID Front+Back Documents + Bio Limit Increase

### 1. Split Emirates ID into Front and Back
**Current:** Single document slot `emirates_id` with label "Emirates ID (front)".
**Change:** Add a second slot `emirates_id_back` so cooks must upload both sides.

Update `DOC_SLOTS` in `CookDocuments.tsx`:
```
emirates_id_front → "Emirates ID (Front)"
emirates_id_back  → "Emirates ID (Back)"
health_card       → unchanged
```

Also update `Admin.tsx` to display both document types correctly in the cook review modal (label mapping for `emirates_id_front` and `emirates_id_back`).

### 2. Increase Bio Character Limit
**Current:** Bio is capped at 200 characters in `CookProfile.tsx`.
**Change:** Increase to 500 characters. Update the `slice(0, 200)` to `slice(0, 500)`, the counter label from `/200` to `/500`, and increase `rows` from 3 to 4 for better visibility.

The bio column in the database is `text` type (no length constraint), so no migration needed.

### 3. Ensure Bio Displays Fully
The customer-facing `CookProfile.tsx` (line 158) and `Admin.tsx` (line 928) both render `cook.bio` without truncation — the bio should display in full. If it appears cut off, it may be the 200-char input limit causing short text. Increasing to 500 will help. No display changes needed.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/cook/CookDocuments.tsx` | Split `emirates_id` into `emirates_id_front` and `emirates_id_back` slots |
| `src/pages/cook/CookProfile.tsx` | Increase bio limit from 200 to 500 chars, increase textarea rows |
| `src/pages/Admin.tsx` | Update document type labels for front/back EID in review modal |

### Database Changes
None required.

