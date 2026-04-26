from django.db import transaction
from rest_framework import serializers
from .models import Application, CustomUser, Applicant, Document, Project
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate


# Serializers accept JSON and convert it to a Python object, and vice versa to be used to communicate with other applications. They also validate the data.

class ApplicantSerializer(serializers.ModelSerializer):
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
        user = CustomUser.objects.create_user(**validated_data)

        if applicant_data:
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

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token), # type: ignore
        }


class DocumentCopySerializer(serializers.ModelSerializer):
    # Exposes a friendly label for the uploaded document type in the copy view.
    document_label = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["document_type", "document_label", "uploaded_document", "upload_timestamp"]

    def get_document_label(self, obj):
        return dict(Document.DOCUMENT_TYPE_CHOICES).get(obj.document_type, obj.document_type)


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
            if uploaded_file.content_type != "application/pdf":
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
                application_status="Pending",
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
                Document.objects.create(
                    application=application,
                    document_type=document_type,
                    uploaded_document=files[document_type],
                )

        return application