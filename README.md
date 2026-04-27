# MPDO-Locational-Clearance-System
For Project version control purposes. Used in ITCC 40 (Web Design), ITCC 42 (SLP) and ITCC 16 (System Administration) subjects

---

## Setup Guide

### Python Backend
- Must have Python installed in Computer and can be accessed in PATH
```bash
# Create virtual environment
python -m venv env

# If no admin privilage do this. If yes, skip.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate virtual environment
env\Scripts\Activate.ps1

# Navigate to backend folder
cd backend

# Create requirements.txt and add (skip if requirements.txt is already in backend folder):
asgiref
Django
django-cors-headers
djangorestframework
djangorestframework-simplejwt
PyJWT
pytz
sqlparse
psycopg2-binary
python-dotenv

# Install dependencies
pip install -r requirements.txt

# Database migrations (when models.py change)
python manage.py makemigrations
python manage.py migrate

# Run application
python manage.py runserver

# Create admin account
python manage.py createsuperuser
```

### Python Frontend
- Must have Node.js installed in Computer and can be accessed in PATH (Node.js version should be 20)
```bash
# Initialize project (no need to do this)
npm create vite@latest frontend --template react

# Enter the Folder
cd frontend

# If no admin privilage do this. If yes, skip.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Install dependencies
npm install
npm install axios react-router-dom jwt-decode

# Run development server
npm run dev
```

---

## 📌 Project Roadmap

### 🔐 Role-Based Access Control (RBAC)
- [X] Applicant: Login/Logout & Registration
- [ ] Personnel: Login/Logout
- [ ] Personnel: Create account via Admin

### 📝 Application Process

#### Applicant Side
- [X] Can Upload Dropzone based on **Document_Type** 
  - **Zoning Certificate**
    - Required:
      - [X] Lot Title
      - [X] Survey Plan
      - [X] Tax Declaration
      - [X] Tax Clearance
      - [X] Barangay Construction Clearance
    - Optional (triggered via checkbox):
      - [X] Deed of Sale
      - [X] Authorization Letter
      - [X] Letter of Exception
  - [X] Drawing Plan
  - [X] Application for Building Permit
  - [X] Cost Estimates
  - [X] Structural Analysis
  - [X] Locational Clearance Application Form
- [ ] Resubmit Application once receiving Notice to Comply
  - [ ] Show Upload Dropzone, based on the needed documents to comply
- [X] Allow Submission to be triggered only when all available Dropzones have uploaded PDF Files
- [ ] Receive Confirmation Messages via Notification

#### Personnel Side

**Records Staff**
- [ ] View Applications (segregated by `Application_Status`)
  - Pending → Just submitted, documents not yet checked
  - Notice to Comply → Missing or incorrect documents
    - [ ] Indicate which document needs to be uploaded before submitting notice
    - [ ] Add comments
  - Under Review → Ongoing process
    - [ ] Button to mark as ready for next stage
  - Accepted → Approved by MPDO Approving Authority
    - [ ] Receive approved application
        - [ ] Attached are all the Reports uploaded during the process (except for the ones uploaded by the Draftsman)
        - [ ] Download attached reports
    - [ ] Notify applicant of acceptance
      - [ ] Attach digital Locational Clearance Certificate
      - [ ] Inform applicant to claim physical copy at MPDO
  - Rejected → Rejected by MPDO Approving Authority
    - [ ] Receive rejected application
        - [ ] Attached are all the Reports uploaded during the process
    - [ ] Notify applicant with rejection comments

**GIS Specialist**
- [ ] View Applications (`review_status = gis_review`)
- [ ] Upload GIS Evaluation Certification (PDF)
  - [ ] Dropzone → `Report_Type = GIS_Evaluation`
  - [ ] Checklist: Drone Inspection required? (Yes/No)
    - If Yes → `review_status = drone_review`
      - [ ] Add comment for why
    - If No → Confirmed upload triggers Application Tracker (GIS Review turns Green)

**Drone Inspection**
- [ ] View Applications (`review_status = drone_review`)
- [ ] Upload Drone Inspection Results (PDF)
  - [ ] Dropzone → `Report_Type = Drone_Evaluation`
  - [ ] Confirmed upload triggers Application Tracker (GIS Review turns Green)

**Site Inspection**
- [ ] View Applications (`review_status = site_review`)
- [ ] Upload Site Inspection Report (PDF)
  - [ ] Dropzone → `Report_Type = Site_Evaluation`
  - [ ] Confirmed upload triggers Application Tracker (Site Review turns Green)

**Draftsman**
- [ ] View Applications (`review_status = draftsman_review`)
  - [ ] Access attached Reports from previous stages
- [ ] Tag Application
  - [ ] “Endorsed for MPDC Review”
  - [ ] “Not Endorsed for MPDC Review”
- [ ] Upload Drafted Locational Clearance (PDF, if endorsed)
  - [ ] Dropzone → `Report_Type = Locational_Clearance_Draft`
- [ ] Upload Consolidated Evaluation Report (PDF, required in both cases)
  - [ ] Dropzone → `Report_Type = Evaluation_Report`
- [ ] Receive applications approved by Approving Authority but not endorsed
  - [ ] Required to Upload Drafted Locational Clearance (PDF)

**MPDO Final Approving Authority**
- [ ] View Applications (`review_status = approving_authority_review`)
  - [ ] Access attached Reports from previous stages
  - [ ] Download attached reports
  - [ ] Sort by Endorsed / Not Endorsed
- **Not Endorsed Applications**
  - If Approved:
    - [ ] Upload signed Consolidated Evaluation Reports (PDF)
      - Dropzone → `Report_Type = Signed_Evaluation_Report`
    - [ ] Trigger re-review by Draftsman
  - If Rejected:
    - [ ] Tag as Rejected (`Application_Status = Rejected`)
    - [ ] Add rejection comments
- **Endorsed Applications**
  - If Approved:
    - [ ] Upload signed Consolidated Evaluation Reports (PDF, if not already uploaded)
      - Dropzone → `Report_Type = Signed_Evaluation_Report`
    - [ ] Upload signed Locational Clearance (PDF)
      - Dropzone → `Report_Type = Signed_Locational_Clearance`
    - [ ] Upload Zone Certification (PDF)
      - Dropzone → `Report_Type = Zone_Certification`
  - If Rejected:
    - [ ] Tag as Rejected (`Application_Status = Rejected`)
    - [ ] Add rejection comments

### 📊 Application Tracker
- [ ] Implement tracking system (makes use of the review_status attribute of the Application model)
    - [ ] Initial Review 
        - [ ] Yellow if review_status = initial_review
        - [ ] Green if review_status ≠ initial_review
    - [ ] GIS Review
        - [ ] Grey if review_status = initial_review
        - [ ] Yellow if review_status = gis_review
        - [ ] Green if review_status ≠ initial_review, drone_review and gis_review
    - [ ] Site Review
        - [ ] Grey if review_status = initial_review, drone_review and gis_review
        - [ ] Yellow if review_status = site_review
        - [ ] Green if review_status ≠ initial_review, drone_review, gis_review and site_review
    - [ ] Draftsman Review
        - [ ] Grey if review_status = initial_review, drone_review, gis_review and site_review
        - [ ] Yellow if review_status = draftsman_review
        - [ ] Green if review_status ≠ initial_review, drone_review, gis_review, site_review and draftsman_review
    - [ ] Approving Authority Review
        - [ ] Grey if review_status = initial_review, drone_review, gis_review, site_review and draftsman_review
        - [ ] Yellow if review_status = approving_authority_review
        - [ ] Green if review_status = review_complete

### 👥 Account Management
- Admin
  - [X] Create Personnel Accounts
  - [X] Edit Personnel Accounts
  - [X] Be able to Set Admin Privileges
  - [ ] Delete Accounts
  - [ ] View Applicant Accounts
  - [ ] Be able to Create Admin Accounts
- Personnel
  - [ ] Edit Profile?
  - [ ] Link redirection to profile (if kaya)
- Applicant
  - [X] Account Creation
  - [ ] Edit Account Details
    - [ ] Update Serializer
    - [ ] Update Views
  - [ ] Deactivate Account

### Email Verification
- [ ] Require email verification to register (for applicant)
- [ ] Require email verification for login (Admin and Personnel)?

### 🗄️ Database & Backend
- [ ] Connect to Supabase
    - [ ] Setup Supabase Tables
    - [ ] Setup Supabase Triggers
    - [X] Fix the donwload document, wont download when its click on
- [ ] Configure Django Admin Site (ITCC 16.1 Members)
    - [ ] View all application, even the rejected ones.
    - [ ] Finish Account Management Functions for Admin

### 🎨 Frontend
- [ ] Build React Frontend
- [ ] Add validation for registration form
- [ ] Add validation for application form
- [ ] Add Error Messages
- [ ] Add Auto-Fill(editable) in Applicant Information in Application Form
- [ ] Save Application Form inputs when exited even though Form was yet to be submitted
 
### 🔔 Notification System
- [ ] Notify in website
- [ ] Notify in email
- [ ] Notify in sms
- [ ] Notify when application is updated
- [ ] Notify when final decision is made (Record Staff sends back an Accepted or Rejected Notification)

### Possible MFA Options
- [ ] Email verification before login

---

### Deployment Phase

---

### 🚀 Future Enhancements
- [ ] Conatact Us Page
- [ ] Change Access Token Storage
- [ ] Generate QR Code for Website Redirect
- [ ] Frontend Componenent: List out Required Documents accessed through Home Dashboard
  - [ ] Show samples of those required documents

---

## Deployment Method for Trial
- http://console.choreo.dev/ ???
