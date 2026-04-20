# MPDO-Locational-Clearance-System
For Project version control purposes. Used in ITCC 40 (Web Design), ITCC 42 (SLP) and ITCC 16 (System Administration) subjects

---

## Setup Guide

### Python Backend
- Must have Python installed in Computer and can be accessed in PATH
```bash
# Create and activate virtual environment
python -m venv env
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
- Must have Node.js installed in Computer and can be accessed in PATH
```bash
# Initialize project (no need to do this)
npm create vite@latest frontend --template react

# Enter the Folder
cd frontend

# Install dependencies
npm install
npm install axios react-router-dom jwt-decode

# Run development server
npm run dev
```

---

## 📌 Project Roadmap

### 🔐 Role-Based Access Control (RBAC)
- [ ] Applicant: Login/Logout & Registration
    - [ ] Remove barangay and address
- [ ] Personnel: Login/Logout

### 📝 Application Process

#### Applicant Side
- [ ] Upload Dropzone based on **Document_Type**
  - **Zoning Certificate**
    - Required:
      - [ ] Lot Title
      - [ ] Survey Plan
      - [ ] Tax Declaration
      - [ ] Tax Clearance
      - [ ] Barangay Construction Clearance
    - Optional (triggered via checkbox):
      - [ ] Deed of Sale
      - [ ] Authorization Letter
  - [ ] Drawing Plan
  - [ ] Application for Building Permit
  - [ ] Cost Estimates
  - [ ] Structural Analysis

#### Personnel Side

**Records Staff**
- [ ] View Applications (segregated by `Application_Status`)
  - Pending → Just submitted, documents not yet checked
  - Notice to Comply → Missing or incorrect documents
    - [ ] Indicate which document needs to be uploaded before submitting notice
  - Under Review → Ongoing process
    - [ ] Button to mark as ready for next stage
  - Accepted → Approved by MPDO Approving Authority
    - [ ] Receive approved application
        - [ ] With the attached Evaluation_Reports uploaded during the process (except for the ones uploaded by the Draftsman)
    - [ ] Notify applicant of acceptance
      - [ ] Attach digital Locational Clearance Certificate
      - [ ] Inform applicant to claim physical copy at MPDO
  - Rejected → Rejected by MPDO Approving Authority
    - [ ] Receive rejected application
    - [ ] Notify applicant with rejection comments

**GIS Specialist**
- [ ] View Applications (`review_status = gis_review`)
- [ ] Upload GIS Evaluation Certification (PDF)
  - [ ] Dropzone → `Evaluation_Type = GIS_Evaluation`
  - [ ] Checklist: Drone Inspection required? (Yes/No)
    - If No → Confirmed upload triggers Application Tracker (GIS Review turns Green)

**Drone Inspection**
- [ ] View Applications (`review_status = drone_review`)
- [ ] Upload Drone Inspection Results (PDF)
  - [ ] Dropzone → `Evaluation_Type = Drone_Evaluation`
  - [ ] Confirmed upload triggers Application Tracker (GIS Review turns Green)

**Site Inspection**
- [ ] View Applications (`review_status = site_review`)
- [ ] Upload Site Inspection Report (PDF)
  - [ ] Dropzone → `Evaluation_Type = Site_Evaluation`
  - [ ] Confirmed upload triggers Application Tracker (Site Review turns Green)

**Draftsman**
- [ ] View Applications (`review_status = draftsman_review`)
  - [ ] Access attached Evaluation Reports from previous stages
- [ ] Tag Application
  - [ ] “Endorsed for MPDC Review” → Tracker turns Green
  - [ ] “Not Endorsed for MPDC Review” → Tracker turns Orange
- [ ] Upload Drafted Locational Clearance (PDF, if endorsed)
  - [ ] Dropzone → `Evaluation_Type = Locational_Clearance_Draft`
- [ ] Upload Consolidated Evaluation Report (PDF, required in both cases)
  - [ ] Dropzone → `Evaluation_Type = Evaluation_Report`
- [ ] Receive applications approved by Approving Authority but not endorsed
  - [ ] Upload Drafted Locational Clearance (PDF)

**MPDO Final Approving Authority**
- [ ] View Applications (`review_status = approving_authority_review`)
  - [ ] Access attached Evaluation Reports from previous stages
  - [ ] Download reports
  - [ ] Sort by Endorsed / Not Endorsed
- **Not Endorsed Applications**
  - If Approved:
    - [ ] Upload signed Consolidated Evaluation Reports (PDF)
      - Dropzone → `Evaluation_Type = Signed_Evaluation_Report`
    - [ ] Trigger re-review by Draftsman
  - If Rejected:
    - [ ] Tag as Rejected (`Application_Status = Rejected`)
    - [ ] Add rejection comments
- **Endorsed Applications**
  - If Approved:
    - [ ] Upload signed Consolidated Evaluation Reports (PDF, if not already uploaded)
      - Dropzone → `Evaluation_Type = Signed_Evaluation_Report`
    - [ ] Upload signed Locational Clearance (PDF)
      - Dropzone → `Evaluation_Type = Signed_Locational_Clearance`
    - [ ] Upload Zone Certification (PDF)
      - Dropzone → `Evaluation_Type = Zone_Certification`
  - If Rejected:
    - [ ] Tag as Rejected (`Application_Status = Rejected`)
    - [ ] Add rejection comments

### 📊 Application Tracker
- [ ] Implement tracking system
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
  - [ ] Create Personnel Accounts
  - [ ] Edit Personnel Accounts
  - [ ] Be able to Set Admin Privileges
  - [ ] Be able to Create Admin Accounts
- Applicant
  - [X] Account Creation
  - [ ] Edit Account Details
    - [ ] Update Serializer
    - [ ] Update Views
  - [ ] Deactivate Account

### 🗄️ Database & Backend
- [ ] Connect to Supabase
    - [ ] Setup Supabase Tables
    - [ ] Setup Supabase Triggers
- [ ] Configure Django Admin Site
    - [ ] View all application, even the rejected ones.

### 🎨 Frontend
- [ ] Build React Frontend
- [ ] Add Error Messages

### 🔔 Notification System
- [ ] Notify in website
- [ ] Notify in email
- [ ] Notify in sms
- [ ] Notify when application is updated
- [ ] Notify when final decision is made (Record Staff sends back an Accepted or Rejected Notification)

---

### 🚀 Future Enhancements
- [ ] Conatact Us Page
- [ ] Change Access Token Storage
- [ ] Generate QR Code for Website Redirect
- [ ] Frontend Componenent: List out Required Documents accessed through Home Dashboard

---

## Deployment Method for Trial
- http://console.choreo.dev/ ???
