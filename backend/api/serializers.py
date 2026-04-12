from django.contrib.auth.models import User
from rest_framework import serializers

# Serializers accept JSON and convert it to a Python object, and vice versa to be used to communicate with other applications. They also validate the data.

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email'] # Edit this to base on the database
        extra_kwargs = {
            "password": {"write_only": True} # No one can read the password 
        }
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data) # Create a user with the validated data
        return user