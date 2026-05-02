from django.db import transaction
import json
from rest_framework import serializers
from rest_framework.reverse import reverse
from django.contrib.auth.models import Group
from .models import Application, CustomUser, Applicant, Document, Project, Personnel, Admin, Comment, Report
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .password_rules import validate_password_rules


# Serializers accept JSON and convert it to a Python object, and vice versa to be used to communicate with other applications. They also validate the data.

class ApplicantSerializer(serializers.ModelSerializer):
    # Applicant email is synced from CustomUser email by default.
    email = serializers.EmailField(required=False)

    class Meta:
        model = Applicant
        fields = [
            "email",
            "house_street",
            "barangay",
        ] # Edit this to base on the database


class UserSerializer(serializers.ModelSerializer):
    applicant = ApplicantSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "middle_initial",
            "suffix",
            "contact_number",
            "birthdate",
            "applicant",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        applicant_data = validated_data.pop("applicant", None)
        raw_password = validated_data.get("password") or ""
        pwd_errors = validate_password_rules(raw_password)
        if pwd_errors:
            raise serializers.ValidationError({"password": pwd_errors})
        user = CustomUser.objects.create_user(**validated_data)

        if applicant_data:
            # Keep applicant email aligned with required CustomUser email.
            applicant_data.setdefault("email", user.email)
            Applicant.objects.create(applicant=user, **applicant_data)

        return user

    def update(self, instance, validated_data):
        applicant_data = validated_data.pop("applicant", None)

        for attr, value in validated_data.items():
            if attr == "password":
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()

        if applicant_data:
            # Keep applicant email aligned with required CustomUser email.
            applicant_data.setdefault("email", instance.email)
            Applicant.objects.update_or_create(applicant=instance, defaults=applicant_data)

        return instance


# For Login
class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(username=username, password=password)

        # Try email
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user_obj = User.objects.get(email=username)
                if user_obj.check_password(password): # type: ignore
                    user = user_obj
            except User.DoesNotExist:
                pass

        if not user:
            raise serializers.ValidationError("Invalid login credentials")

        # ✅ Build token manually instead of calling super()
        refresh = self.get_token(user)

        # Return role metadata so the frontend can route users to
        # applicant or internal dashboards right after login.
        is_admin = user.groups.filter(name="Admin").exists()
        is_personnel = hasattr(user, "personnel")
        is_applicant = hasattr(user, "applicant")
        personnel_roles = []
        if is_personnel:
            personnel_roles = [
                role for role in user.personnel.personnel_roles
                if role in {choice[0] for choice in Personnel.PERSONNEL_ROLE_CHOICES}
            ]

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token), # type: ignore
            "user_id": user.id,
            "username": user.username,
            "is_admin": is_admin,
            "is_personnel": is_personnel,
            "is_applicant": is_applicant,
            "is_internal": is_admin or is_personnel,
            "personnel_roles": personnel_roles,
        }


class InternalUserCreateSerializer(serializers.ModelSerializer):
    personnel_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=[choice[0] for choice in Personnel.PERSONNEL_ROLE_CHOICES]),
        required=False,
        default=list,
        allow_empty=True,
    )
    make_admin = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "middle_initial",
            "suffix",
            "contact_number",
            "birthdate",
            "personnel_roles",
            "make_admin",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate_personnel_roles(self, value):
        # Keep role list deterministic and duplicate-free.
        return list(dict.fromkeys(value))

    def create(self, validated_data):
        personnel_roles = validated_data.pop("personnel_roles", [])
        make_admin = validated_data.pop("make_admin", False)
        raw_password = validated_data.get("password") or ""
        pwd_errors = validate_password_rules(raw_password)
        if pwd_errors:
            raise serializers.ValidationError({"password": pwd_errors})
        with transaction.atomic():
            user = CustomUser.objects.create_user(**validated_data)
            user.is_staff = True
            user.save(update_fields=["is_staff"])

            if personnel_roles:
                Personnel.objects.create(personnel=user, personnel_roles=personnel_roles)
                personnel_group, _ = Group.objects.get_or_create(name="Personnel")
                user.groups.add(personnel_group)

            if make_admin:
                admin_group, _ = Group.objects.get_or_create(name="Admin")
                user.groups.add(admin_group)
                Admin.objects.get_or_create(admin=user)

        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        current_password = attrs.get("current_password") or ""
        new_password = attrs.get("new_password") or ""

        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})

        pwd_errors = validate_password_rules(new_password)
        if pwd_errors:
            raise serializers.ValidationError({"new_password": pwd_errors})

        return attrs


class InternalUserSummarySerializer(serializers.ModelSerializer):
    personnel_roles = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    is_personnel = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "is_admin",
            "is_personnel",
            "personnel_roles",
        ]

    def get_is_admin(self, obj):
        return obj.groups.filter(name="Admin").exists()

    def get_is_personnel(self, obj):
        return hasattr(obj, "personnel")

    def get_personnel_roles(self, obj):
        if not hasattr(obj, "personnel"):
            return []
        return obj.personnel.personnel_roles


class DocumentCopySerializer(serializers.ModelSerializer):
    # Exposes a friendly label for the uploaded document type in the copy view.
    document_label = serializers.SerializerMethodField()
    # URL points to API endpoint that streams PDF bytes from the database.
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "document_type",
            "document_label",
            "uploaded_document_name",
            "upload_timestamp",
            "download_url",
        ]

    def get_document_label(self, obj):
<<<<<<< HEAD
=======
        if obj.document_type == "report_document":
            report = obj.report_set.first()
            if report:
                return dict(Report.REVIEW_STATUS_CHOICES).get(report.report_type, report.report_type)
>>>>>>> eb68380 (for draftsman and authuority)
        return dict(Document.DOCUMENT_TYPE_CHOICES).get(obj.document_type, obj.document_type)

    def get_download_url(self, obj):
        request = self.context.get("request")
        return reverse("download_application_document", kwargs={"document_id": obj.document_id}, request=request)


class ProjectCopySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "project_title",
            "project_type",
            "project_nature",
            "project_tenure",
            "project_cost",
            "project_address",
            "project_barangay",
            "area_lot",
            "area_improvement",
            "area_bldg",
            "existing_use",
        ]


class ApplicationCopySerializer(serializers.ModelSerializer):
    project = ProjectCopySerializer(read_only=True)
    documents = DocumentCopySerializer(source="document_set", many=True, read_only=True)
    # Exposes applicant identity from submitted_by for the application copy view.
    submitted_by_id = serializers.SerializerMethodField()
    submitted_by_username = serializers.SerializerMethodField()
    submitted_by_full_name = serializers.SerializerMethodField()
    compliance_required_document_types = serializers.SerializerMethodField()
    compliance_message = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "application_id",
            "application_status",
            "review_status",
            "application_completion",
            "application_date",
            "applicant_type",
            "corp_name",
            "corp_address",
            "corp_telephone",
            "right_over_land",
            "authorized",
            "absoluteowner_first_name",
            "absoluteowner_last_name",
            "absoluteowner_middle_name",
            "absoluteowner_suffix",
            "submitted_by_id",
            "submitted_by_username",
            "submitted_by_full_name",
            "compliance_required_document_types",
            "compliance_message",
            "project",
            "documents",
        ]

    def get_submitted_by_id(self, obj):
        return obj.submitted_by_id

    def get_submitted_by_username(self, obj):
        return obj.submitted_by.username if obj.submitted_by else ""

    def get_submitted_by_full_name(self, obj):
        if not obj.submitted_by:
            return ""
        full_name = f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}".strip()
        return full_name if full_name else obj.submitted_by.username

    def _get_latest_compliance_payload(self, obj):
        latest_compliance_comment = (
            obj.comment_set.filter(comment_type="for_compliance")
            .order_by("-comment_timestamp")
            .first()
        )
        if not latest_compliance_comment:
            return {}
        try:
            payload = json.loads(latest_compliance_comment.comment_box)
            return payload if isinstance(payload, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def get_compliance_required_document_types(self, obj):
        payload = self._get_latest_compliance_payload(obj)
        required_types = payload.get("required_document_types", [])
        return required_types if isinstance(required_types, list) else []

    def get_compliance_message(self, obj):
        payload = self._get_latest_compliance_payload(obj)
        message = payload.get("message", "")
        return message if isinstance(message, str) else ""


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            "comment_id",
            "comment_type",
            "comment_box",
            "comment_timestamp",
        ]


class InternalApplicationQueueSerializer(serializers.ModelSerializer):
    project = ProjectCopySerializer(read_only=True)
    submitted_by_username = serializers.SerializerMethodField()
<<<<<<< HEAD
=======
    applicant_display_name = serializers.SerializerMethodField()
>>>>>>> eb68380 (for draftsman and authuority)
    comments = serializers.SerializerMethodField()
    documents = DocumentCopySerializer(source="document_set", many=True, read_only=True)
    compliance_required_document_types = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "application_id",
            "application_status",
            "review_status",
            "application_comply",
            "application_completion",
            "application_endorsement",
<<<<<<< HEAD
            "submitted_by_username",
=======
            "applicant_type",
            "submitted_by_username",
            "applicant_display_name",
>>>>>>> eb68380 (for draftsman and authuority)
            "project",
            "comments",
            "documents",
            "compliance_required_document_types",
            "application_date",
        ]

    def get_submitted_by_username(self, obj):
        return obj.submitted_by.username if obj.submitted_by else ""

<<<<<<< HEAD
=======
    def get_applicant_display_name(self, obj):
        if getattr(obj, "applicant_type", None) == "Corporation" and obj.corp_name:
            return obj.corp_name.strip()
        parts = [obj.absoluteowner_first_name, obj.absoluteowner_last_name]
        name = " ".join(p for p in parts if p).strip()
        return name or (obj.submitted_by.username if obj.submitted_by else "")

>>>>>>> eb68380 (for draftsman and authuority)
    def get_comments(self, obj):
        recent_comments = obj.comment_set.order_by("-comment_timestamp")[:5]
        return CommentSerializer(recent_comments, many=True).data

    def get_compliance_required_document_types(self, obj):
        # Change: expose document requirements from the latest compliance comment.
        latest_compliance_comment = (
            obj.comment_set.filter(comment_type="for_compliance")
            .order_by("-comment_timestamp")
            .first()
        )
        if not latest_compliance_comment:
            return []
        try:
            payload = json.loads(latest_compliance_comment.comment_box)
            if isinstance(payload, dict) and isinstance(payload.get("required_document_types"), list):
                return payload["required_document_types"]
        except (json.JSONDecodeError, TypeError):
            return []
        return []


# For Application Submission
class ApplicationSubmissionSerializer(serializers.Serializer):
    APPLICANT_TYPE_CHOICES = ["Individual", "Corporation"]
    RIGHT_OVER_LAND_CHOICES = ["Owner", "Leased", "NotLot_Owner"]
    PROJECT_NATURE_CHOICES = [
        "New Development",
        "Expansion/Renovation",
        "Change of Use",
        "Others",
    ]
    PROJECT_TENURE_CHOICES = ["permanent", "temporary"]
    EXISTING_USE_CHOICES = [
        "Residential",
        "Commercial",
        "Institutional",
        "Industrial",
        "Agricultural",
        "Vacant/Idle",
        "Tenanted",
        "Not Tenanted",
        "Others",
    ]
    BARANGAY_CHOICES = [
        "Baybay",
        "Benigwayan",
        "Calatcat",
        "Lagtang",
        "Lanao",
        "Loguilo",
        "Lourdes",
        "Lumbo",
        "Molocboloc",
        "Poblacion",
        "Sampatulog",
        "Sungay",
        "Talaba",
        "Taparak",
        "Tugasnon",
        "Tula",
    ]

    REQUIRED_DOCUMENT_TYPES = [
        "lot_title",
        "survey_plan",
        "tax_dec",
        "tax_clear",
        "brgy_const_clear",
        "draw_plan",
        "app_fr_bldg_permit",
        "cost_est",
        "struc_analysis",
        "loc_clear_app_form",
    ]

    OPTIONAL_DOCUMENT_TYPES = [
        "deed_of_sale",
        "auth_letter",
        "letter_exception",
    ]

    applicant_type = serializers.ChoiceField(choices=APPLICANT_TYPE_CHOICES)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    middle_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    suffix = serializers.CharField(max_length=10, required=False, allow_blank=True)
    house_street = serializers.CharField(max_length=100)
    barangay = serializers.ChoiceField(choices=BARANGAY_CHOICES)
    right_over_land = serializers.ChoiceField(choices=RIGHT_OVER_LAND_CHOICES)
    corp_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    corp_address = serializers.CharField(max_length=200, required=False, allow_blank=True)
    corp_telephone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    absoluteowner_first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    absoluteowner_last_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    absoluteowner_middle_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    absoluteowner_suffix = serializers.CharField(max_length=10, required=False, allow_blank=True)

    project_title = serializers.CharField(max_length=150)
    project_type = serializers.CharField(max_length=50)
    project_nature = serializers.ChoiceField(choices=PROJECT_NATURE_CHOICES)
    project_tenure = serializers.ChoiceField(choices=PROJECT_TENURE_CHOICES)
    project_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    project_address = serializers.CharField(max_length=200)
    project_barangay = serializers.ChoiceField(choices=BARANGAY_CHOICES)
    area_lot = serializers.DecimalField(max_digits=10, decimal_places=2)
    area_improvement = serializers.DecimalField(max_digits=10, decimal_places=2)
    area_bldg = serializers.DecimalField(max_digits=10, decimal_places=2)
    existing_use = serializers.ChoiceField(choices=EXISTING_USE_CHOICES)

    selected_optional_documents = serializers.ListField(
        child=serializers.ChoiceField(choices=OPTIONAL_DOCUMENT_TYPES),
        required=False,
        default=list,
    )

    def validate(self, attrs):
        # Blocks duplicate active submissions until the previous one is completed.
        request = self.context["request"]
        has_active_application = Application.objects.filter(
            submitted_by=request.user,
            application_completion=False,
        ).exists()
        if has_active_application:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "You still have an active application. "
                        "You can submit a new one after the current application is completed."
                    )
                }
            )

        if attrs["applicant_type"] == "Corporation" and not attrs.get("corp_name"):
            raise serializers.ValidationError({"corp_name": "Corporation name is required."})

        if attrs["right_over_land"] != "Owner":
            if not attrs.get("absoluteowner_first_name") or not attrs.get("absoluteowner_last_name"):
                raise serializers.ValidationError(
                    {
                        "absoluteowner_first_name": "Absolute owner first and last name are required when applicant is not the lot owner.",
                        "absoluteowner_last_name": "Absolute owner first and last name are required when applicant is not the lot owner.",
                    }
                )

        selected_optional_documents = attrs.get("selected_optional_documents", [])
        if len(selected_optional_documents) != len(set(selected_optional_documents)):
            raise serializers.ValidationError(
                {"selected_optional_documents": "Optional document list contains duplicates."}
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        files = request.FILES

        selected_optional_documents = validated_data.pop("selected_optional_documents", [])
        expected_documents = self.REQUIRED_DOCUMENT_TYPES + selected_optional_documents

        missing_documents = [document_type for document_type in expected_documents if document_type not in files]
        if missing_documents:
            raise serializers.ValidationError(
                {"documents": f"Missing required uploads: {', '.join(missing_documents)}"}
            )

        valid_document_types = {choice[0] for choice in Document.DOCUMENT_TYPE_CHOICES}
        invalid_types = [document_type for document_type in files.keys() if document_type not in valid_document_types]
        if invalid_types:
            raise serializers.ValidationError(
                {"documents": f"Invalid document upload keys: {', '.join(invalid_types)}"}
            )

        for key, uploaded_file in files.items():
            content_type = (uploaded_file.content_type or "").lower()
            file_name = (uploaded_file.name or "").lower()
            if content_type != "application/pdf" and not file_name.endswith(".pdf"):
                raise serializers.ValidationError({"documents": f"{key} must be a PDF file."})

        with transaction.atomic():
            project = Project.objects.create(
                project_title=validated_data.pop("project_title"),
                project_type=validated_data.pop("project_type"),
                project_nature=validated_data.pop("project_nature"),
                project_tenure=validated_data.pop("project_tenure"),
                project_cost=validated_data.pop("project_cost"),
                project_address=validated_data.pop("project_address"),
                project_barangay=validated_data.pop("project_barangay"),
                area_lot=validated_data.pop("area_lot"),
                area_improvement=validated_data.pop("area_improvement"),
                area_bldg=validated_data.pop("area_bldg"),
                existing_use=validated_data.pop("existing_use"),
            )

            application = Application.objects.create(
                application_status="pending",
                review_status="initial_review",
                application_completion=False,
                submitted_by=request.user,
                project=project,
                applicant_type=validated_data["applicant_type"],
                corp_name=validated_data.get("corp_name"),
                corp_address=validated_data.get("corp_address"),
                corp_telephone=validated_data.get("corp_telephone"),
                right_over_land=validated_data["right_over_land"],
                authorized=validated_data["right_over_land"] != "Owner",
                absoluteowner_first_name=validated_data.get("absoluteowner_first_name") or validated_data["first_name"],
                absoluteowner_last_name=validated_data.get("absoluteowner_last_name") or validated_data["last_name"],
                absoluteowner_middle_name=validated_data.get("absoluteowner_middle_name") or validated_data.get("middle_name"),
                absoluteowner_suffix=validated_data.get("absoluteowner_suffix") or validated_data.get("suffix"),
            )

            for document_type in expected_documents:
                uploaded_file = files[document_type]
                Document.objects.create(
                    application=application,
                    document_type=document_type,
                    uploaded_document=uploaded_file.read(),
                    uploaded_document_name=uploaded_file.name,
                    uploaded_document_content_type=uploaded_file.content_type or "application/pdf",
                )

        return application