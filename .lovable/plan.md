

## Plan: Add Step 3 "Your Documents" to Cook Signup + Update Dashboard

Your proposed Step 3 is the right approach. But yes, the **cook dashboard also needs a small update** — right now the pending state (lines 225-249) tells cooks to "prepare your Emirates ID and health card — you'll need to upload them once approved" and has an "Upload documents →" button. Since documents will now be uploaded during signup, this messaging is outdated.

Here is the full plan:

### 1. Add Step 3 to CookSignup (`src/pages/cook/CookSignup.tsx`)

Exactly as you described:
- After Step 2 profile submission, instead of setting `done = true`, set `step = 3`
- Step 3 shows "Upload your documents" with 3 required file inputs (Emirates ID front, back, Health Card)
- Each shows thumbnail preview after selection
- "Submit Application" button disabled until all 3 files selected
- On submit: upload files to `cook-documents/{cook_id}/`, insert records into `cook_documents` table, send notification email via `notify-operator` edge function, then show confirmation screen
- Update progress bar from 2 steps to 3: `1 · Your details` / `2 · Your profile` / `3 · Your documents`
- Update the waiting-for-link screen progress bar to show 3 steps too
- Bio field limit stays at the current 200 chars in signup (it was increased to 500 in the cook profile edit page already)

### 2. Update Cook Dashboard Pending State (`src/pages/cook/CookDashboard.tsx`)

- Change the pending message from "prepare your Emirates ID" to: "Your application and documents are under review. We'll be in touch within 48 hours."
- Keep the "Upload documents →" button but change label to "View documents" — cooks may still need to resubmit if admin requests changes
- Remove the "While you wait, prepare your Emirates ID" text

### Files Changed

| File | Change |
|------|--------|
| `src/pages/cook/CookSignup.tsx` | Add Step 3 document upload, 3-step progress bar, confirmation screen after all uploaded |
| `src/pages/cook/CookDashboard.tsx` | Update pending state messaging to reflect docs already submitted |

No database changes needed — `cook_documents` table and `cook-documents` storage bucket already exist.

