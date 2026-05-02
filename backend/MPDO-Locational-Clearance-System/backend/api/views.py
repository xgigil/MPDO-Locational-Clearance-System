from django.contrib.auth.models import Group
import json
from django.http import HttpResponse, Http404
from django.db.models import Q
from rest_framework import generics
from .serializers import ApplicationCopySerializer, InternalApplicationQueueSerializer, ApplicationSubmissionSerializer, InternalUserCreateSerializer, InternalUserSummarySerializer, UserSerializer, UserTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework import status
from .models import Admin as CustomAdmin
from .models import Application, CustomUser, Document, Personnel, Comment, Report
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import ChangePasswordSerializer
from rest_framework.permissions import IsAuthenticated

# Custom permissions
class isAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.groups.filter(name="Admin").exists() # Check if the user is authenticated and belongs to the Admin group

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all() # List of all the objects to create a new to make sure the username is unique
    serializer_class = UserSerializer # What kind of data we need to accept to make a new user
    permission_classes = [AllowAny] # Allow anyone to create a user, even if they are not authenticated
    
    def create(self, request, *args, **kwargs):
        print("Incoming data:", request.data)  # Log the incoming data
        return super().create(request, *args, **kwargs)

class CreateAdminView(generics.CreateAPIView):
    queryset = CustomUser.objects.all() # List of all the objects to create a new to make sure the username is unique
    serializer_class = UserSerializer # What kind of data we need to accept to make a new user
    permission_classes = [isAdmin] # Only admin users can create an admin and personnel account
    
    def perform_create(self, serializer):
        user = serializer.save() # Save the user first to get the user instance
        user.is_staff = True # Set the user as staff to access the admin site
        user.save() # Save the user again to update the is_staff field

        admin_group, created = Group.objects.get_or_create(name="Admin") # Get or create the Admin group
        user.groups.add(admin_group) # Add the user to the Admin group
        
        CustomAdmin.objects.create(admin=user) # Create a CustomAdmin instance for the user to link it to the admin model

class CreatePersonnelView(generics.CreateAPIView):
    queryset = CustomUser.objects.all() # List of all the objects to create a new to make sure the username is unique
    serializer_class = UserSerializer # What kind of data we need to accept to make a new user
    permission_classes = [isAdmin] # Only admin users can create an admin and personnel account
    
    def perform_create(self, serializer):
        user = serializer.save() # Save the user first to get the user instance
        user.is_staff = True # Set the user as staff to access the admin site
        user.save() # Save the user again to update the is_staff field

        personnel_group, created = Group.objects.get_or_create(name="Personnel") # Get or create the Personnel group
        user.groups.add(personnel_group) # Add the user to the Personnel group
        
        requested_roles = self.request.data.get("personnel_roles", []) # pyright: ignore[reportAttributeAccessIssue]
        if isinstance(requested_roles, str):
            requested_roles = [requested_roles]

        # Use the model's own role list for consistency across admin + API.
        valid_roles = {choice[0] for choice in Personnel.PERSONNEL_ROLE_CHOICES}
        filtered_roles = [role for role in requested_roles if role in valid_roles]
        Personnel.objects.create(personnel=user, personnel_roles=filtered_roles)
        

class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer


class InternalUserCreateView(generics.CreateAPIView):
    """
    Admin-only endpoint for creating internal users.
    Users can be created as personnel, admin, or both.
    """
    queryset = CustomUser.objects.all()
    serializer_class = InternalUserCreateSerializer
    permission_classes = [isAdmin]


class InternalProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = InternalUserSummarySerializer(request.user)
        data = serializer.data
        data["is_internal"] = bool(data["is_admin"] or data["is_personnel"])
        return Response(data, status=status.HTTP_200_OK)


class GrantAdminPrivilegeView(generics.GenericAPIView):
    permission_classes = [isAdmin]

    def post(self, request, user_id, *args, **kwargs):
        user = CustomUser.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Grant Django staff/admin group and keep custom Admin model in sync.
        user.is_staff = True
        user.save(update_fields=["is_staff"])
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        user.groups.add(admin_group)
        CustomAdmin.objects.get_or_create(admin=user)

        return Response(
            {"detail": "Admin privileges granted.", "user_id": user.id},
            status=status.HTTP_200_OK,
        )


class SubmitApplicationView(generics.GenericAPIView):
    serializer_class = ApplicationSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Build a serializer payload without deep-copying uploaded file streams.
        serializer_field_names = set(self.get_serializer().fields.keys())
        request_data = {}
        for field_name in serializer_field_names:
            if field_name == "selected_optional_documents":
                continue
            if hasattr(request.data, "getlist"):
                values = request.data.getlist(field_name)
                if not values:
                    continue
                request_data[field_name] = values if len(values) > 1 else values[0]
            elif field_name in request.data:
                request_data[field_name] = request.data.get(field_name)

        # Normalize optional-documents payload from multipart forms.
        # Supports:
        # 1) repeated keys: selected_optional_documents=deed_of_sale&selected_optional_documents=auth_letter
        # 2) JSON string form: selected_optional_documents='["deed_of_sale"]'
        raw_optional_documents = (
            request.data.getlist("selected_optional_documents")
            if hasattr(request.data, "getlist")
            else request.data.get("selected_optional_documents", [])
        )
        normalized_optional_documents = []
        if raw_optional_documents:
            if isinstance(raw_optional_documents, str):
                raw_optional_documents = [raw_optional_documents]
            if len(raw_optional_documents) == 1:
                raw_value = raw_optional_documents[0]
                if isinstance(raw_value, str):
                    stripped_value = raw_value.strip()
                    if stripped_value.startswith("["):
                        try:
                            parsed_value = json.loads(stripped_value)
                            if isinstance(parsed_value, list):
                                normalized_optional_documents = parsed_value
                        except json.JSONDecodeError:
                            normalized_optional_documents = []
                    else:
                        normalized_optional_documents = [raw_value]
            else:
                normalized_optional_documents = raw_optional_documents

        request_data["selected_optional_documents"] = normalized_optional_documents

        serializer = self.get_serializer(data=request_data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        application_copy = ApplicationCopySerializer(
            application,
            context={"request": request},
        ).data

        return Response(
            {
                "message": "Application submitted successfully.",
                "application_id": application.application_id,
                "application_status": application.application_status,
                "review_status": application.review_status,
                # Returned so frontend can immediately render a read-only copy after submit.
                "application_copy": application_copy,
            },
            status=status.HTTP_201_CREATED,
        )


class MyLatestApplicationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Used by frontend to fetch the latest copy and know if submit must be disabled.
        latest_application = (
            Application.objects.filter(submitted_by=request.user)
            .select_related("project")
            .prefetch_related("document_set")
            .order_by("-application_date")
            .first()
        )
        if not latest_application:
            return Response({"has_application": False}, status=status.HTTP_200_OK)

        serialized_application = ApplicationCopySerializer(
            latest_application,
            context={"request": request},
        ).data
        return Response(
            {
                "has_application": True,
                "can_create_application": latest_application.application_completion,
                "application": serialized_application,
            },
            status=status.HTTP_200_OK,
        )


class ApplicantComplianceResubmitView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, application_id, *args, **kwargs):
        application = Application.objects.filter(
            application_id=application_id,
            submitted_by=request.user,
        ).first()
        if not application:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        if application.application_status != "notice_to_comply":
            return Response(
                {"detail": "Resubmission is only allowed when application status is notice_to_comply."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latest_compliance_comment = (
            application.comment_set.filter(comment_type="for_compliance")
            .order_by("-comment_timestamp")
            .first()
        )
        if not latest_compliance_comment:
            return Response(
                {"detail": "No compliance requirements found for this application."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            compliance_payload = json.loads(latest_compliance_comment.comment_box)
        except json.JSONDecodeError:
            compliance_payload = {}

        required_document_types = compliance_payload.get("required_document_types", [])
        if not isinstance(required_document_types, list) or not required_document_types:
            return Response(
                {"detail": "Compliance requirements are invalid or empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_document_types = list(request.FILES.keys())
        invalid_uploads = [
            document_type for document_type in uploaded_document_types
            if document_type not in required_document_types
        ]
        if invalid_uploads:
            return Response(
                {"detail": f"Only required documents can be uploaded: {', '.join(invalid_uploads)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        missing_required_documents = [
            document_type for document_type in required_document_types
            if document_type not in request.FILES
        ]
        if missing_required_documents:
            return Response(
                {"detail": f"Missing required compliance uploads: {', '.join(missing_required_documents)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for document_type in required_document_types:
            uploaded_file = request.FILES[document_type]
            content_type = (uploaded_file.content_type or "").lower()
            file_name = (uploaded_file.name or "").lower()
            if content_type != "application/pdf" and not file_name.endswith(".pdf"):
                return Response(
                    {"detail": f"{document_type} must be a PDF file."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Change: replace only the required document types selected by Record Staff.
        for document_type in required_document_types:
            uploaded_file = request.FILES[document_type]
            existing_document = (
                Document.objects.filter(application=application, document_type=document_type)
                .order_by("-upload_timestamp")
                .first()
            )
            if existing_document:
                existing_document.uploaded_document = uploaded_file.read()
                existing_document.uploaded_document_name = uploaded_file.name
                existing_document.uploaded_document_content_type = uploaded_file.content_type or "application/pdf"
                existing_document.save(
                    update_fields=[
                        "uploaded_document",
                        "uploaded_document_name",
                        "uploaded_document_content_type",
                    ]
                )
            else:
                Document.objects.create(
                    application=application,
                    document_type=document_type,
                    uploaded_document=uploaded_file.read(),
                    uploaded_document_name=uploaded_file.name,
                    uploaded_document_content_type=uploaded_file.content_type or "application/pdf",
                )

        application.application_status = "pending"
        application.application_comply = False
        application.save(update_fields=["application_status", "application_comply"])

        serialized_application = ApplicationCopySerializer(application, context={"request": request}).data
        return Response(
            {
                "message": "Compliance documents resubmitted successfully.",
                "application": serialized_application,
            },
            status=status.HTTP_200_OK,
        )


class InternalApplicationQueueView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Role-aware queue source used by each role-specific dashboard component.
        role = request.query_params.get("role")
        queryset = (
            Application.objects.select_related("project", "submitted_by")
            .prefetch_related("document_set", "comment_set")
            .order_by("-application_date")
        )

        if role == Personnel.ROLE_RECORD_STAFF:
            # Change: Record Staff sees intake statuses + final decision only after review completion.
            queryset = queryset.filter(
                (
                    Q(application_status__in=["pending", "notice_to_comply", "upload_payment"])
                ) | (
                    Q(application_status__in=["accepted", "rejected"]) & Q(review_status="review_complete")
                )
            )
        elif role == Personnel.ROLE_GIS_SPECIALIST:
            queryset = queryset.filter(review_status="gis_review")
        elif role == Personnel.ROLE_DRONE_SPECIALIST:
            queryset = queryset.filter(review_status="drone_review")
        elif role == Personnel.ROLE_SITE_INSPECTOR:
            queryset = queryset.filter(review_status="site_review")
        elif role == Personnel.ROLE_DRAFTSMAN:
            queryset = queryset.filter(review_status="drafting_review")
        elif role == Personnel.ROLE_APPROVING_AUTHORITY:
            queryset = queryset.filter(review_status="approving_authority_review")
        else:
            return Response({"detail": "Invalid role filter."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InternalApplicationQueueSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class InternalApplicationActionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, application_id, *args, **kwargs):
        application = Application.objects.filter(application_id=application_id).first()
        if not application:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get("role")
        action = request.data.get("action")
        comment_text = request.data.get("comment", "").strip()
        report_type = request.data.get("report_type")
        report_file = request.FILES.get("report_file")

        if not role or not action:
            return Response({"detail": "role and action are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Keep role access strict so a user can only use actions from their assigned roles.
        assigned_roles = request.user.personnel.personnel_roles if hasattr(request.user, "personnel") else []
        if role not in assigned_roles and not request.user.groups.filter(name="Admin").exists():
            return Response({"detail": "You are not assigned to this role."}, status=status.HTTP_403_FORBIDDEN)

        if action == "request_compliance" and role == Personnel.ROLE_RECORD_STAFF:
            # Change: record which document types must be re-submitted by applicant.
            if hasattr(request.data, "getlist"):
                required_document_types = request.data.getlist("required_document_types")
            else:
                required_document_types = request.data.get("required_document_types", [])

            if isinstance(required_document_types, str):
                maybe_json = required_document_types
                if maybe_json.strip().startswith("["):
                    try:
                        parsed = json.loads(maybe_json)
                        required_document_types = parsed if isinstance(parsed, list) else []
                    except json.JSONDecodeError:
                        required_document_types = []
                else:
                    required_document_types = [required_document_types]

            valid_types = {choice[0] for choice in Document.DOCUMENT_TYPE_CHOICES if choice[0] != "report_document"}
            filtered_required_document_types = [
                document_type for document_type in required_document_types if document_type in valid_types
            ]
            if not filtered_required_document_types:
                return Response(
                    {"detail": "At least one required_document_type must be selected."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            application.application_status = "notice_to_comply"
            application.review_status = "initial_review"
            application.application_comply = True
            application.save(update_fields=["application_status", "review_status", "application_comply"])
            Comment.objects.create(
                comment_type="for_compliance",
                application=application,
                comment_box=json.dumps(
                    {
                        "message": comment_text,
                        "required_document_types": filtered_required_document_types,
                    }
                ),
            )
        elif action == "send_for_payment" and role == Personnel.ROLE_RECORD_STAFF:
            # Change: explicit for_payment notice to applicant before payment upload stage.
            Comment.objects.create(
                comment_type="for_payment",
                application=application,
                comment_box=comment_text or "Application documents are complete. Proceed with payment.",
            )
            application.application_status = "upload_payment"
            application.application_comply = False
            application.save(update_fields=["application_status", "application_comply"])
        elif action == "mark_under_review" and role == Personnel.ROLE_RECORD_STAFF:
            has_payment_proof = application.document_set.filter(document_type="proof_payment").exists()
            if not has_payment_proof:
                return Response(
                    {"detail": "Proof of payment is required before moving to under review."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            application.application_status = "under_review"
            application.review_status = "gis_review"
            application.save(update_fields=["application_status", "review_status"])
        elif action == "upload_payment_proof" and role == Personnel.ROLE_RECORD_STAFF:
            # Change: payment upload is now handled by Record Staff.
            payment_file = request.FILES.get("report_file")
            if not payment_file:
                return Response(
                    {"detail": "report_file is required for payment upload."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Change: enforce one proof-of-payment document per application.
            if application.document_set.filter(document_type="proof_payment").exists():
                return Response(
                    {"detail": "Proof of payment is already uploaded for this application."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            Document.objects.create(
                application=application,
                document_type="proof_payment",
                uploaded_document=payment_file.read(),
                uploaded_document_name=payment_file.name,
                uploaded_document_content_type=payment_file.content_type or "application/pdf",
            )
            application.application_status = "upload_payment"
            application.save(update_fields=["application_status"])
        elif action == "record_staff_release_accepted" and role == Personnel.ROLE_RECORD_STAFF:
            # Change: acceptance notice can only be released after final approval.
            if application.application_status != "accepted":
                return Response(
                    {"detail": "Acceptance notice can only be released after status is accepted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            application.application_completion = True
            application.save(update_fields=["application_completion"])
        elif action == "record_staff_release_rejected" and role == Personnel.ROLE_RECORD_STAFF:
            # Change: rejection notice can only be released after final rejection.
            if application.application_status != "rejected":
                return Response(
                    {"detail": "Rejection notice can only be released after status is rejected."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            application.application_completion = True
            application.save(update_fields=["application_completion"])
        elif action in {"upload_gis", "upload_drone", "upload_site", "upload_draftsman_report", "upload_approving_report"}:
            if not report_file or not report_type:
                return Response(
                    {"detail": "report_file and report_type are required for upload actions."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            uploaded_document = Document.objects.create(
                application=application,
                document_type="report_document",
                uploaded_document=report_file.read(),
                uploaded_document_name=report_file.name,
                uploaded_document_content_type=report_file.content_type or "application/pdf",
            )
            Report.objects.create(
                report_type=report_type,
                document=uploaded_document,
                application=application,
            )
            if action == "upload_gis" and role == Personnel.ROLE_GIS_SPECIALIST:
                requires_drone = str(request.data.get("requires_drone", "false")).lower() == "true"
                application.review_status = "drone_review" if requires_drone else "site_review"
                application.save(update_fields=["review_status"])
                if requires_drone and comment_text:
                    Comment.objects.create(
                        comment_type="for_drone",
                        application=application,
                        comment_box=comment_text,
                    )
            elif action == "upload_drone" and role == Personnel.ROLE_DRONE_SPECIALIST:
                application.review_status = "site_review"
                application.save(update_fields=["review_status"])
            elif action == "upload_site" and role == Personnel.ROLE_SITE_INSPECTOR:
                application.review_status = "drafting_review"
                application.save(update_fields=["review_status"])
            elif action == "upload_draftsman_report" and role == Personnel.ROLE_DRAFTSMAN:
                is_endorsed = str(request.data.get("is_endorsed", "false")).lower() == "true"
                application.application_endorsement = is_endorsed
                application.review_status = "approving_authority_review"
                application.save(update_fields=["application_endorsement", "review_status"])
            elif action == "upload_approving_report" and role == Personnel.ROLE_APPROVING_AUTHORITY:
                application.application_status = "accepted"
                application.review_status = "review_complete"
                application.save(update_fields=["application_status", "review_status"])
        elif action == "reject_application" and role == Personnel.ROLE_APPROVING_AUTHORITY:
            application.application_status = "rejected"
            application.review_status = "review_complete"
            application.save(update_fields=["application_status", "review_status"])
            if comment_text:
                Comment.objects.create(
                    comment_type="for_rejected",
                    application=application,
                    comment_box=comment_text,
                )
        else:
            return Response({"detail": "Unsupported role/action combination."}, status=status.HTTP_400_BAD_REQUEST)

        refreshed = InternalApplicationQueueSerializer(application, context={"request": request}).data
        return Response(refreshed, status=status.HTTP_200_OK)


class DownloadApplicationDocumentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id, *args, **kwargs):
        document = Document.objects.filter(document_id=document_id).first()
        if not document:
            raise Http404("Document not found.")

        response = HttpResponse(
            bytes(document.uploaded_document),
            content_type=document.uploaded_document_content_type or "application/pdf",
        )
        safe_name = document.uploaded_document_name or f"document_{document.document_id}.pdf"
        response["Content-Disposition"] = f'inline; filename="{safe_name}"'
        return response


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        new_password = serializer.validated_data["new_password"]
        request.user.set_password(new_password)
        request.user.save()
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


