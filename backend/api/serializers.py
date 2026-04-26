from rest_framework import serializers
from .models import CustomUser, Applicant
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