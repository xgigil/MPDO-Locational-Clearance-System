# LIST OF ISSUES

## APPLICANT
1. When clicking application, even though user has made an application, it still directs to submission form. Althouhg it won't submit the application (as intended).
2. Fixed `500` on submit endpoint caused by deep-copying multipart payload (`request.data.copy()`) with uploaded file streams on Python 3.14.
   - Updated `SubmitApplicationView` to build a serializer-safe payload from declared serializer fields only.
   - Normalization of `selected_optional_documents` now reads directly from `request.data` without deep-copying files.

## INTERNAL (FIXED)
1. Added logout entry point in internal dashboard (`InternalDashboard`) so personnel/admin can sign out directly.
2. Record Staff payment upload now allows only one `proof_payment` per application.
   - Frontend disables repeat upload when proof already exists.
   - Backend rejects duplicates with validation error.
3. Record Staff can now preview selected proof-of-payment PDF before submitting upload.
4. Internal document preview now applies to all uploaded application documents across all user accounts, not only proof-of-payment flow.
   - Unified the queue-card preview behavior to use the shared `ApplicationDocumentsPreview` document list.
   - Removed the proof-payment-only pre-submit iframe path from `RecordStaffDashboard` to avoid feature duplication/bloat.
   - Added empty-state handling and stable list keys in `ApplicationDocumentsPreview` so all uploaded files render consistently.
