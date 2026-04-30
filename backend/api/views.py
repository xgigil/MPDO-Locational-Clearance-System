from django.shortcuts import render
from django.contrib.auth.models import Group
import json
from django.http import HttpResponse, Http404
from rest_framework import generics
from .serializers import (
    ApplicationCopySerializer,
    ApplicationSubmissionSerializer,
    InternalUserCreateSerializer,
    InternalUserSummarySerializer,
    UserSerializer,
    UserTokenObtainPairSerializer,
)
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework import status
from .models import Admin as CustomAdmin
from .models import Application, CustomUser, Document, Personnel
import logging
from rest_framework_simplejwt.views import TokenObtainPairView

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
        request_data = request.data.copy()
        # Normalize optional-documents payload from multipart forms.
        # Supports:
        # 1) repeated keys: selected_optional_documents=deed_of_sale&selected_optional_documents=auth_letter
        # 2) JSON string form: selected_optional_documents='["deed_of_sale"]'
        raw_optional_documents = request_data.getlist("selected_optional_documents")
        normalized_optional_documents = []
        if raw_optional_documents:
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

        request_data.setlist("selected_optional_documents", normalized_optional_documents)

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


class TrackApplicationView(generics.GenericAPIView):
    """
    Applicant-only tracking endpoint.
    Ensures users can only track their own submitted applications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, application_id, *args, **kwargs):
        app = (
            Application.objects.filter(application_id=application_id, submitted_by=request.user)
            .select_related("project")
            .prefetch_related("document_set")
            .first()
        )
        if not app:
            return Response(
                {"found": False, "detail": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serialized = ApplicationCopySerializer(app, context={"request": request}).data
        return Response(
            {
                "found": True,
                "application_id": app.application_id,
                "application_status": app.application_status,
                "review_status": app.review_status,
                "application": serialized,
            },
            status=status.HTTP_200_OK,
        )


