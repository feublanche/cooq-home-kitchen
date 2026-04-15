

## Plan

### 1. Create Customer Privacy Policy (`/privacy`) — New Content
The current `src/pages/Privacy.tsx` contains cook-specific privacy content (Emirates ID, health cards, bank details, cook partner onboarding). This needs to become a **customer-facing** privacy policy instead, since `/privacy` is linked from the homepage, customer auth, and booking form.

**Changes to `src/pages/Privacy.tsx`:**
- Rewrite the sections array with customer-relevant content: name, email, phone, address, booking history, payment info (processed by Stripe), dietary preferences
- Purpose: matching with cooks, processing bookings, communication
- Remove references to Emirates ID, health cards, cook partnerships, session proof photos

### 2. Create Cook Privacy Policy (`/cook-privacy`) — Keep Current Content
- Create `src/pages/CookPrivacy.tsx` with the current cook-specific privacy content (the existing sections about Emirates ID, health cards, bank details, etc.)
- Add route `/cook-privacy` in `App.tsx`
- Update cook signup and cook agreement pages to link to `/cook-privacy` instead of `/privacy`

### 3. Fix Document Photos in Admin Modal
**Bug:** In `Admin.tsx` line 319, the signed URL path computation is wrong. When `file_url` is `cook_id/health_card.png`, it doesn't contain `cook-documents/`, so the fallback prepends `cook.id/` again, producing a doubled path like `cook_id/cook_id/health_card.png`.

**Fix:** Change the path logic to use `doc.file_url` directly (it's already the correct storage path relative to the bucket).

### 4. Fix Cook Photo in Admin Modal
The cook photo URL is a full public URL and should display. Will verify the `<img>` tag renders correctly. If the issue is that the photo file doesn't exist or the URL is stale after re-upload (browser caching), will add a cache-busting query param. Will also ensure the fallback initials circle works when no photo exists.

### Files Changed
| File | Change |
|------|--------|
| `src/pages/Privacy.tsx` | Rewrite sections for customer-facing privacy |
| `src/pages/CookPrivacy.tsx` | New file with current cook privacy content |
| `src/App.tsx` | Add `/cook-privacy` route |
| `src/pages/cook/CookSignup.tsx` | Link to `/cook-privacy` |
| `src/pages/CookAgreement.tsx` | Link to `/cook-privacy` |
| `src/pages/Admin.tsx` | Fix document signed URL path (line ~319); add cache-bust to cook photo |

No database changes needed.

