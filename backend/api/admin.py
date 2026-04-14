from django.contrib import admin
from .models import Admin as CustomAdmin
from .models import CustomUser, Personnel, Applicant

# Register your models here.
@admin.register(CustomAdmin)
class AdminAdmin(admin.ModelAdmin):
    list_display = ("admin",)
    
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name")
    
@admin.register(Personnel)
class PersonnelAdmin(admin.ModelAdmin):
    list_display = ("personnel", "personnel_role")

@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ("applicant",)
