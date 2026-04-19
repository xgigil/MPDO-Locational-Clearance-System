from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

# Custome Base Manager for CustomUser to handle user creation with email as the username field
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # Extra profile fields merged into CustomUser
    middle_initial = models.CharField(max_length=1, null=True, blank=True)
    suffix = models.CharField(max_length=10, null=True, blank=True)
    contact_number = models.CharField(max_length=20)
    birthdate = models.DateField(null=True, blank=True)

    objects = CustomUserManager() # type: ignore # Tell Django to use our custom manager for user creation and superuser creation

    def __str__(self):
        return self.email
    
class Admin(models.Model):
    admin = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)


class Personnel(models.Model):
    personnel = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    personnel_role = models.CharField(max_length=50)


class Applicant(models.Model):
    applicant = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    house_street = models.CharField(max_length=100)
    barangay = models.CharField(max_length=100)


class Project(models.Model):
    project_id = models.AutoField(primary_key=True)
    project_title = models.CharField(max_length=150)
    project_type = models.CharField(max_length=50)
    project_nature = models.CharField(max_length=50)
    project_cost = models.DecimalField(max_digits=15, decimal_places=2)
    project_location = models.CharField(max_length=200)
    project_address = models.CharField(max_length=200)
    project_barangay = models.CharField(max_length=100)
    area_lot = models.DecimalField(max_digits=10, decimal_places=2)
    area_improvement = models.DecimalField(max_digits=10, decimal_places=2)
    area_bldg = models.DecimalField(max_digits=10, decimal_places=2)
    existing_use = models.CharField(max_length=100)
    tax_dec_no = models.CharField(max_length=50)


class Application(models.Model):
    application_id = models.AutoField(primary_key=True)
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name="applications")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="applications")
    applicant_type = models.CharField(max_length=50)
    corp_name = models.CharField(max_length=100, null=True, blank=True)
    corp_address = models.CharField(max_length=200, null=True, blank=True)
    right_of_land = models.CharField(max_length=100)
    absoluteowner_suffix = models.CharField(max_length=10, null=True, blank=True)
    absoluteowner_first_name = models.CharField(max_length=50, null=True, blank=True)
    absoluteowner_last_name = models.CharField(max_length=50, null=True, blank=True)
    absoluteowner_middle_initial = models.CharField(max_length=1, null=True, blank=True)


class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=50)
    uploaded_document = models.CharField(max_length=255)


class EvaluationReport(models.Model):
    decision_id = models.AutoField(primary_key=True)
    eval_timestamp = models.DateTimeField()
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="evaluation_reports")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="evaluation_reports")
    personnel = models.ForeignKey(Personnel, on_delete=models.CASCADE, related_name="evaluation_reports")
    decision_type = models.CharField(max_length=50)


class Remark(models.Model):
    remark_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="remarks")
    personnel = models.ForeignKey(Personnel, on_delete=models.CASCADE, related_name="remarks")
    remark_desc = models.TextField()
    remark_type = models.CharField(max_length=50, null=True, blank=True)
    remark_datetime = models.DateTimeField(auto_now_add=True)


class Syslog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="syslogs")
    action = models.CharField(max_length=100)
    logged_at = models.DateTimeField(auto_now_add=True)

