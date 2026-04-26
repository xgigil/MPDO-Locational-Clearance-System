from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# Custome Base Manager for CustomUser to handle user creation with email as the username field
class CustomUserManager(BaseUserManager):
    def create_user(self, username=None, password=None, **extra_fields):
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(username, password, **extra_fields)

class CustomUser(AbstractUser):
    # Extra profile fields merged into CustomUser
    email = models.CharField(max_length=255, unique=True, null=True, blank=True) # Optional email field for account validation, not used as username
    middle_initial = models.CharField(max_length=1, null=True, blank=True)
    suffix = models.CharField(max_length=10, null=True, blank=True)
    contact_number = models.CharField(max_length=20)
    birthdate = models.DateField(null=True, blank=True)
    
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    objects = CustomUserManager() # type: ignore # Tell Django to use our custom manager for user creation and superuser creation

    def __str__(self):
        return self.username or f"User {self.pk}"
    
class Admin(models.Model):
    admin = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)


class Personnel(models.Model):
    personnel = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    personnel_role = models.CharField(max_length=50, unique=True)


class Applicant(models.Model):
    applicant = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    email = models.EmailField(unique=True) # Required for account validation
    house_street = models.CharField(max_length=100)
    barangay = models.CharField(max_length=100)
    
    def save(self, *args, **kwargs):
        # Always sync with CustomUser.email
        if self.applicant and self.email != self.applicant.email:
            self.applicant.email = self.email
            self.applicant.save()
        super().save(*args, **kwargs)


class Project(models.Model):
    project_id = models.AutoField(primary_key=True)
    project_title = models.CharField(max_length=150)
    project_type = models.CharField(max_length=50)
    project_nature = models.CharField(max_length=50)
    project_tenure = models.CharField(max_length=50)
    project_cost = models.DecimalField(max_digits=15, decimal_places=2)
    project_address = models.CharField(max_length=200)
    project_barangay = models.CharField(max_length=100)
    area_lot = models.DecimalField(max_digits=10, decimal_places=2)
    area_improvement = models.DecimalField(max_digits=10, decimal_places=2)
    area_bldg = models.DecimalField(max_digits=10, decimal_places=2)
    existing_use = models.CharField(max_length=100)

class Application(models.Model):
    application_id = models.AutoField(primary_key=True)
    application_status = models.CharField(max_length=50)
    review_status = models.CharField(max_length=50)
    application_comply = models.BooleanField(default=False)
    application_completion = models.BooleanField(default=False)
    application_endorsement = models.BooleanField(default=False)
    submitted_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="submitted_applications")
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    applicant_type = models.CharField(max_length=50, choices=[("Individual", "Individual"), ("Corporation", "Corporation")])
    corp_name = models.CharField(max_length=100, null=True, blank=True)
    corp_address = models.CharField(max_length=200, null=True, blank=True)
    corp_telephone = models.CharField(max_length=20, null=True, blank=True)
    right_over_land = models.CharField(max_length=50, choices=[("Owner", "Owner"), ("Leased", "Leased"), ("NotLot_Owner", "Not-Lot Owner")])
    authorized = models.BooleanField(default=False)
    absoluteowner_first_name = models.CharField(max_length=50)
    absoluteowner_last_name = models.CharField(max_length=50)
    absoluteowner_middle_name = models.CharField(max_length=50, null=True, blank=True)
    absoluteowner_suffix = models.CharField(max_length=10, null=True, blank=True)
    application_date = models.DateTimeField(auto_now_add=True)


class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("report_document", "Report Document"),
        ("lot_title", "Lot Title"),
        ("survey_plan", "Survey Plan"),
        ("tax_dec", "Tax Declaration"),
        ("tax_clear", "Tax Clearance"),
        ("brgy_const_clear", "Barangay Construction Clearance"),
        ("deed_of_sale", "Deed of Sale"),
        ("auth_letter", "Authorization Letter"),
        ("letter_exception", "Letter of Exception"),
        ("draw_plan", "Drawing Plan"),
        ("app_fr_bldg_permit", "Application for Building Permit"),
        ("cost_est", "Cost Estimate"),
        ("struc_analysis", "Structural Analysis"),
        ("loc_clear_app_form", "Locational Clearance Application Form"),
        ("loc_clear_cert", "Locational Clearance Certificate"),
    ]
    
    document_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    uploaded_document = models.FileField(upload_to="documents/")
    upload_timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{dict(self.DOCUMENT_TYPE_CHOICES).get(self.document_type)} for Application {self.application.application_id}"


class Report(models.Model):
    report_id = models.AutoField(primary_key=True)
    report_type = models.CharField(max_length=50)
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)


class Comment(models.Model):
    comment_id = models.AutoField(primary_key=True)
    comment_type = models.CharField(max_length=50)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    comment_box = models.TextField()
    comment_timestamp = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    channel = models.CharField(max_length=20, default="web")
    status = models.CharField(max_length=20, default="unread")
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    source_event_id = models.ForeignKey("Syslog", on_delete=models.SET_NULL, null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)


class Syslog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    logged_at = models.DateTimeField(auto_now_add=True)
