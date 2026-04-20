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
- [ ] Applicant Side
    - [ ] Different Upload Dropzone based on Document_Type
        - [ ] For Zoning Certificate
            - Required: 
            - [ ] Lot_Title
            - [ ] Survey_Plan
            - [ ] Tax_Declaration
            - [ ] Tax_Clearance
            - [ ] Barangay_Construction_Clearance
            - Optional (Triggered throguh individual checkbox)
            - [ ] Deed_Of_Sale
            - [ ] Authorization_Letter
        - [ ] Drawing_Plan
        - [ ] Application_For_Building_Permit
        - [ ] Cost_Estimates
        - [ ] Structural_Analysis
- [ ] Personnel Side
  - [ ] Records Staff
      - [ ] View Application
          - [ ] Segregated based on Status (Pending, Notice to Comply, Under Review, Accepted, Rejected)
              - [ ] Pending - For those that were just were just submitted.
              - [ ] Notice to Comply - For those that are lacking or have submitted the wrong Documents.
                  - [ ] Indicate which Document needs to be Uploaded (must be marked, before submitting Notice to Comply.
              - [ ] Under Review - For those that are going through the rest of the application process.
                  - [ ] Button to click if the Record staff think its ready for the rest of the process.
              - [ ] Accepted - For those that were deemed approved by the MPDO Approving Authority.
                  - [ ] Recieve Approved Application from Approving Authority
                  - [ ] Notify Applicant of Application Acceptance
                      - [ ] Attach digital copy of the Locational Clearance Certificate before Notifying Applicant
                      - [ ] Inform them to claim physical copy at the MPDO
              - [ ] Rejected - For those that were deemed rejected by the MPDO Approving Authority.
                  - [ ] Recieve Rejected Application from Approving Authority
                  - [ ] Inform them of Rejection and attach comment for why
  - [ ] GIS Specialist
      - [ ] View Applications, triggered by review_status = gis_review
      - [ ] Upload PDF copy of the GIS Evaluation Certification
          - [ ] Create drop zone for this. Evaluation_Type = GIS_Evaluation
          - [ ] Checklist if need Drone Inspection (Yes or No). Required before upload is confirmed
              - [ ] If no, Confirmed Upload will trigger Application Tracker (GIS Review)
  - [ ] Drone Inspection
      - [ ] View Applications, triggered by review_status = drone_review
          - [ ] GIS Evaluation Certification File must be attached
      - [ ] Upload PDF of the Drone Inspection Results
          - [ ] Create drop zone for this. Evaluation_Type = Drone_Evaluation
          - [ ] Confirmed Upload will trigger Application Tracker (GIS Review)
  - [ ] Site Inspection
      - [ ] View Applications, triggered by review_status = site_review
      - [ ] Upload PDF copy of the Site Inspection Report
          - [ ] Create drop zone for this. Evaluation_Type = Site_Evaluation
          - [ ] Confirmed Upload will trigger Application Tracker (GIS Review)
  - [ ] Draftsman
      - [ ] View Applications, triggered by review_status = draftsman_review
  - [ ] MPDO Final Approving Authority
      - [ ]  View Applications, triggered by review_status = approving_authority_review)

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
