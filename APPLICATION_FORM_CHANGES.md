# Application Form Implementation Notes

## Scope Completed

Implemented a new applicant application flow with backend submission support and a sample multi-step frontend that follows the provided form branching reference:

- Applicant information
- Conditional absolute owner details (shown when right-over-land is not owner, including leased)
- Project details
- Upload required documents using dropzone-style PDF upload areas

After project details, the flow now continues to the required documents upload step.

## Backend Changes

### New submission serializer

File: `backend/api/serializers.py`

- Added `ApplicationSubmissionSerializer` for the application workflow.
- Validates:
  - `applicant_type` and corporation required data
  - `right_over_land` and required absolute owner names for non-lot owners
  - Optional document selections for duplicates
- Uses the README-based document rules:
  - Required:
    - `lot_title`
    - `survey_plan`
    - `tax_dec`
    - `tax_clear`
    - `brgy_const_clear`
    - `draw_plan`
    - `app_fr_bldg_permit`
    - `cost_est`
    - `struc_analysis`
    - `loc_clear_app_form`
  - Optional (if selected):
    - `deed_of_sale`
    - `auth_letter`
    - `letter_exception`
- Verifies uploaded files are present and PDF content type.
- Creates `Project`, `Application`, and linked `Document` rows in a single atomic transaction.

### New submission API endpoint

Files:

- `backend/api/views.py`
- `backend/api/urls.py`

Added:

- `SubmitApplicationView` (`POST`)
  - Path: `/api/applications/submit/`
  - Requires authenticated user (`IsAuthenticated`)
  - Parses `selected_optional_documents` from multipart JSON string
  - Returns created application metadata (`application_id`, status, review status)

### Media serving for uploaded files

Files:

- `backend/backend/settings.py`
- `backend/backend/urls.py`

Added:

- `MEDIA_URL` and `MEDIA_ROOT`
- `static(...)` media serving in debug mode

## Frontend Changes

### Multi-step application form sample

File: `frontend/src/pages/Application.jsx`

Replaced placeholder page with a multi-step sample flow:

1. Applicant Information
   - Applicant type (Individual/Corporation)
   - Name fields
   - Address fields
   - Right-over-land selection
   - Corporation fields (conditional)
2. Absolute Owner Information (conditional)
   - Shown when `right_over_land` is not `Owner`
3. Project Details
4. Upload Required Documents
   - Dropzone-style file upload blocks
   - Required documents list based on README
   - Optional document checkboxes that dynamically add required dropzones

Submission behavior:

- Sends `multipart/form-data` to `/api/applications/submit/`
- Sends all form fields + selected optional document list + PDF files
- Shows success/failure message and resets form after successful submit

### New styling

File: `frontend/src/styles/Application.css`

- Added dedicated form page styling (dark theme close to provided reference)
- Added consistent layout/states for:
  - Step indicator
  - Inputs/selects
  - Dropzones (including drag-over visual state)
  - Action buttons
  - Status message

### Componentized application form (follow-up refactor)

Files:

- `frontend/src/components/ApplicationForm.jsx`
- `frontend/src/pages/Application.jsx`

Updated structure to match login-page pattern:

- Moved the full application wizard logic/UI into `ApplicationForm` component.
- Reduced `Application` page to a thin wrapper that imports and renders `ApplicationForm`.

### Choice fields and submission lock (latest update)

Files:

- `frontend/src/components/ApplicationForm.jsx`
- `backend/api/models.py`
- `backend/api/serializers.py`
- `backend/api/views.py`
- `backend/api/urls.py`
- `backend/api/migrations/0003_application_application_completion_and_more.py`

Added requested dropdown choices in the form:

- `project_nature`:
  - New Development
  - Expansion/Renovation
  - Change of Use
  - Others
- `project_tenure`:
  - permanent
  - temporary
- `existing_use`:
  - Residential
  - Commercial
  - Institutional
  - Industrial
  - Agricultural
  - Vacant/Idle
  - Tenanted
  - Not Tenanted
  - Others
- Barangay list (for applicant and project):
  - Baybay
  - Benigwayan
  - Calatcat
  - Lagtang
  - Lanao
  - Loguilo
  - Lourdes
  - Lumbo
  - Molocboloc
  - Poblacion
  - Sampatulog
  - Sungay
  - Talaba
  - Taparak
  - Tugasnon
  - Tula

Submission lock and copy view:

- Added `application_completion` boolean to `Application` model.
- Added `submitted_by` relation on `Application` to track the owner of each submission.
- Backend now rejects new submission if user has an active (not completed) application.
- `POST /api/applications/submit/` now returns `application_copy` payload.
- Added `GET /api/applications/my-latest/` for frontend to:
  - display submitted application copy
  - disable new submission if current application is not completed

### Flow logic split into page + components (latest)

Files:

- `frontend/src/pages/Application.jsx`
- `frontend/src/components/ApplicationForm.jsx`
- `frontend/src/components/ApplicationCopy.jsx`

Updated application button behavior based on `application_completion`:

- If user has an existing application with `application_completion = false`:
  - `Application` page renders `ApplicationCopy` component only.
  - Form is hidden.
- If user has an existing application with `application_completion = true`:
  - `Application` page renders `ApplicationForm`.
- If user has no existing application:
  - `Application` page renders `ApplicationForm`.

Implementation note:

- `Application` page now owns the decision logic and fetches latest application state.
- The copy view is now in a dedicated component for clean separation of concerns.

## Validation and Tooling Notes

- Frontend lint run succeeded for changed files.
- Existing warning remains in `frontend/src/components/ProtectedRoutes.jsx` (pre-existing, unrelated to this task).
- Backend check could not run in this environment because Django is not installed in the active Python interpreter (virtual environment not active).

## Manual Test Checklist

1. Start backend with project virtual environment active.
2. Login as an applicant user in frontend.
3. Open `/Application`.
4. Verify flow branching:
   - Owner/Leased: Applicant -> Project -> Upload Docs
   - Not lot owner: Applicant -> Absolute Owner -> Project -> Upload Docs
5. Verify submit is blocked until all required dropzones are filled.
6. Verify optional document checkbox adds/removes required dropzone.
7. Submit valid PDFs and confirm API success message with application ID.
