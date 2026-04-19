# MPDO-Locational-Clearance-System
For Project version control purposes. Used in ITCC 40 (Web Design), ITCC 42 (SLP) and ITCC 16 (System Administration) subjects

---

## Setup Guide

### Python Backend
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

### Python Backend
```bash
# Initialize project (no need to do this)
npm create vite@latest frontend --template react

# Install dependencies
npm install
npm install axios react-router-dom jwt-decode

# Run development server
npm run dev
```

---

## Roadmap

- [ ] Complete RBAC
    - [X] Complete Login/Logout and Registration Process for Applicant side
    - [ ] Complete Login/Logout Process for Personnel Side
- [ ] Complete Application Process for Applicant Side
- [ ] Complete Application Process for Personnel Side
    - [ ] Records Staff
    - [ ] GIS Specialist 
    - [ ] Drone Inspection
    - [ ] Site Inspection
    - [ ] Draftsman
    - [ ] MPDO Final Approving Authority
- [ ] Complete Application Tracker
- [ ] Complete Account Management    
    - [ ] Set Up Account Managemet for Admin
        - [ ] Create accounts for Personnel
        - [ ] Set Admin Privileges
        - [ ] Create Admin accounts
    - [ ] Set Up Account Management for Applicant
        - [X] Be able to create account
        - [ ] Be able to edit account details
            - [ ] Edit serializer
            - [ ] Edit views
        - [ ] Be able to deactivate account
- [ ] Connect it to the Postgres Database
- [ ] Work on Admin Site (We use the pre-built one by Django)
- [ ] Frontend HAHAHAHAH
- [ ] Add Error Messages

For Later in the Development:
- [ ] Change storage for Access Tokens

---

## Deploymeny Method for Trial
- http://console.choreo.dev/ ???