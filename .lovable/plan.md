

## Plan: Implement Items 1-3

### 1. Decouple Menu Approval from Photo Upload (Admin.tsx)

**Current:** The "Approve" mode requires a photo upload — `handleMenuApproveWithPhoto` checks `if (!menuPhotoFile)` and blocks approval without it.

**Changes to `src/pages/Admin.tsx`:**
- Create a new `handleMenuApprove` function that sets `status = 'approved'` directly without requiring a photo
- In the approve UI (lines 775-785), replace with two buttons:
  - **"Approve"** — calls `handleMenuApprove(m)`, no photo needed
  - **"Upload Photo"** — optional file input + upload button, can be done on approved menus too
- Allow photo upload on already-approved menus (add an "Add Photo" button for menus with `status === 'approved'` and no `photo_urls`)

### 2. Remove Neighborhood from User Flow

**Changes to `src/pages/Search.tsx`:**
- Remove the entire neighborhood dropdown section (lines 94-155)
- Remove `neighborhood` state, `dropdownOpen`, `searchQuery`, `filteredNeighborhoods`, `dropdownRef`, and the `dubaiNeighborhoods` import
- Show cuisine selection immediately (no gate behind `neighborhood`)
- Remove `neighborhood` from session storage and from `handleFinal` navigation state
- Update conditions: dietary/frequency sections gated on `selectedCuisines.length > 0` only (not `neighborhood &&`)
- CTA gated on `selectedCuisines.length > 0 && frequency` only

**Changes to `src/pages/Results.tsx`:**
- Remove `neighborhood` from location state destructuring (line 11)
- Remove from `queryKey` (line 14)
- Update heading text to remove "in this area" phrasing

**Changes to `src/pages/BookingForm.tsx`:**
- Remove `searchNeighborhood` variable (lines 129-132)
- Remove the neighborhood display block (lines 503-507)
- Remove `searchNeighborhood` from the `area` field in insert data (line 253) — use `booking.location || routerState.cookArea || ""` instead

### 3. Fix Customer Auth: Existing vs New Users

**Current:** Always shows name + email + phone form. Uses `shouldCreateUser: true` for all users, causing returning users to re-enter their name.

**Changes to `src/pages/CustomerAuth.tsx`:**
- Add session check on mount: if already signed in, redirect immediately (prevents loop)
- Change to email-first flow with 3 screens: `"email"` → `"signup"` (new users) → `"waiting"`
  - **Email screen**: Just email input + "Continue" button
  - On continue: try `signInWithOtp({ email, shouldCreateUser: false })`
  - If succeeds → go to "waiting" screen (existing user, link sent)
  - If fails with signup error → switch to "signup" screen showing name + phone fields
  - **Signup screen**: Name + phone + email (pre-filled) → sends OTP with `shouldCreateUser: true`
- Update heading text: "Welcome back" for sign-in, "Create your account" for signup

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Decouple menu approve from photo; add separate "Add Photo" for approved menus |
| `src/pages/Search.tsx` | Remove neighborhood dropdown entirely; cuisine is first step |
| `src/pages/Results.tsx` | Remove neighborhood from state/query |
| `src/pages/BookingForm.tsx` | Remove searchNeighborhood references |
| `src/pages/CustomerAuth.tsx` | Smart login: email-first, signup only for new users, session check on mount |

No database changes needed.

