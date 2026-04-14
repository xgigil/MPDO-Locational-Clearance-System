from django.shortcuts import render
from django.contrib.auth.models import Group
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from .models import Admin as CustomAdmin
from .models import CustomUser, Personnel

# Custom permissions
class isAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.groups.filter(name="Admin").exists() # Check if the user is authenticated and belongs to the Admin group

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all() # List of all the objects to create a new to make sure the username is unique
    serializer_class = UserSerializer # What kind of data we need to accept to make a new user
    permission_classes = [AllowAny] # Allow anyone to create a user, even if they are not authenticated
    
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
        
        Personnel.objects.create(
            user=user,
            personnel_role=self.request.data.get("personnel_role", "") # Get the personnel_role from the request data, default to an empty string if not provided # pyright: ignore[reportAttributeAccessIssue]
        )