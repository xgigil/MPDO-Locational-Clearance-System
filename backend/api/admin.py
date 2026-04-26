from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.contrib.auth.models import Group
from .models import Admin as CustomAdmin
from .models import CustomUser, Personnel, Applicant


ROLE_CHOICES = Personnel.PERSONNEL_ROLE_CHOICES


def sync_internal_account_membership(user, cleaned_data):
    """
    Persist internal account flags from admin form fields.
    This runs after Django admin saves the user object.
    """
    selected_roles = cleaned_data.get("personnel_roles") or []
    # If roles are selected, always treat as personnel even when the
    # checkbox value is missing/unchecked in the submitted payload.
    is_personnel = bool(cleaned_data.get("create_as_personnel") or selected_roles)
    is_admin = bool(cleaned_data.get("create_as_admin"))

    user.is_staff = bool(is_personnel or is_admin)
    user.save(update_fields=["is_staff"])

    if is_personnel:
        personnel_group, _ = Group.objects.get_or_create(name="Personnel")
        user.groups.add(personnel_group)
        Personnel.objects.update_or_create(
            personnel=user,
            defaults={"personnel_roles": selected_roles},
        )
    else:
        personnel_group = Group.objects.filter(name="Personnel").first()
        if personnel_group:
            user.groups.remove(personnel_group)
        Personnel.objects.filter(personnel=user).delete()

    if is_admin:
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        user.groups.add(admin_group)
        CustomAdmin.objects.get_or_create(admin=user)
    else:
        admin_group = Group.objects.filter(name="Admin").first()
        if admin_group:
            user.groups.remove(admin_group)
        CustomAdmin.objects.filter(admin=user).delete()


class CustomUserAdminCreationForm(UserCreationForm):
    # Convenience switches so admins can create internal accounts
    # without manually editing related models/groups.
    create_as_personnel = forms.BooleanField(required=False, initial=False)
    create_as_admin = forms.BooleanField(required=False, initial=False)
    personnel_roles = forms.MultipleChoiceField(
        choices=ROLE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )

    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "middle_initial",
            "suffix",
            "contact_number",
            "birthdate",
        )

    def clean(self):
        cleaned_data = super().clean()
        selected_roles = cleaned_data.get("personnel_roles") or []
        is_personnel = cleaned_data.get("create_as_personnel") or bool(selected_roles)
        cleaned_data["create_as_personnel"] = bool(is_personnel)
        if is_personnel and not selected_roles:
            raise forms.ValidationError("Select at least one personnel role.")
        return cleaned_data

    def save(self, commit=True):
        # Membership sync is handled in ModelAdmin.save_model to avoid commit=False pitfalls.
        return super().save(commit=commit)


class CustomUserAdminChangeForm(UserChangeForm):
    create_as_personnel = forms.BooleanField(required=False)
    create_as_admin = forms.BooleanField(required=False)
    personnel_roles = forms.MultipleChoiceField(
        choices=ROLE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )

    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.instance
        self.fields["create_as_personnel"].initial = hasattr(user, "personnel")
        self.fields["create_as_admin"].initial = user.groups.filter(name="Admin").exists()
        if hasattr(user, "personnel"):
            self.fields["personnel_roles"].initial = user.personnel.personnel_roles

    def clean(self):
        cleaned_data = super().clean()
        selected_roles = cleaned_data.get("personnel_roles") or []
        is_personnel = cleaned_data.get("create_as_personnel") or bool(selected_roles)
        cleaned_data["create_as_personnel"] = bool(is_personnel)
        if is_personnel and not selected_roles:
            raise forms.ValidationError("Select at least one personnel role.")
        return cleaned_data

    def save(self, commit=True):
        # Membership sync is handled in ModelAdmin.save_model to avoid commit=False pitfalls.
        return super().save(commit=commit)

# Register your models here.
@admin.register(CustomAdmin)
class AdminAdmin(admin.ModelAdmin):
    list_display = ("admin",)
    
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # User-friendly account management for applicant + internal users.
    add_form = CustomUserAdminCreationForm
    form = CustomUserAdminChangeForm
    model = CustomUser
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "account_type",
        "personnel_roles_display",
        "is_active",
    )
    search_fields = ("username", "email", "first_name", "last_name")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    ordering = ("username",)
    add_fieldsets = (
        ("Login Credentials", {"fields": ("username", "email", "password1", "password2")}),
        ("Profile", {"fields": ("first_name", "last_name", "middle_initial", "suffix", "contact_number", "birthdate")}),
        ("Account Type", {"fields": ("create_as_personnel", "personnel_roles", "create_as_admin")}),
    )
    fieldsets = (
        ("Login Credentials", {"fields": ("username", "password", "email")}),
        ("Profile", {"fields": ("first_name", "last_name", "middle_initial", "suffix", "contact_number", "birthdate")}),
        ("Account Type", {"fields": ("create_as_personnel", "personnel_roles", "create_as_admin")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    @admin.display(description="Account Type")
    def account_type(self, obj):
        if obj.groups.filter(name="Admin").exists() and hasattr(obj, "personnel"):
            return "Admin + Personnel"
        if obj.groups.filter(name="Admin").exists():
            return "Admin"
        if hasattr(obj, "personnel"):
            return "Personnel"
        if hasattr(obj, "applicant"):
            return "Applicant"
        return "General User"

    @admin.display(description="Personnel Roles")
    def personnel_roles_display(self, obj):
        if not hasattr(obj, "personnel") or not obj.personnel.personnel_roles:
            return "-"
        label_map = dict(ROLE_CHOICES)
        return ", ".join(label_map.get(role, role) for role in obj.personnel.personnel_roles)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Ensure personnel/admin flags and related records always persist from form fields.
        sync_internal_account_membership(obj, form.cleaned_data)
    
@admin.register(Personnel)
class PersonnelAdmin(admin.ModelAdmin):
    list_display = ("personnel", "personnel_roles")
    search_fields = ("personnel__username", "personnel__first_name", "personnel__last_name")

@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    # Shows all applicant accounts created from the frontend register flow.
    list_display = (
        "applicant",
        "email",
        "barangay",
        "house_street",
        "applicant_username",
        "applicant_full_name",
    )
    search_fields = (
        "applicant__username",
        "applicant__first_name",
        "applicant__last_name",
        "email",
    )
    list_filter = ("barangay",)

    @admin.display(description="Username")
    def applicant_username(self, obj):
        return obj.applicant.username

    @admin.display(description="Full Name")
    def applicant_full_name(self, obj):
        return f"{obj.applicant.first_name} {obj.applicant.last_name}".strip()

# Improve Django admin branding for internal users.
admin.site.site_header = "MPDO Internal Administration"
admin.site.site_title = "MPDO Admin"
admin.site.index_title = "Operations Control Panel"
