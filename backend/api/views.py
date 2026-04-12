from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all() # List of all the objects to create a new to make sure the username is unique
    serializer_class = User # What kind of data we need to accept to make a new user
    permission_classes = [AllowAny] # Allow anyone to create a user, even if they are not authenticated