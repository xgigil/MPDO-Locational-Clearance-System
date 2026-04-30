from django.urls import path
from . import views

# API URL patterns for the api app
urlpatterns = [
    # Used by frontend to submit a new application.
    path("user/applicant/applications/submit/", views.SubmitApplicationView.as_view(), name="submit_application",),
    # Used by frontend to fetch the latest copy and know if application submission must be disabled.
    path("user/applicant/applications/my-latest/", views.MyLatestApplicationView.as_view(), name="my_latest_application",),
    # Used by frontend to track a specific application by ID.
    path(
        "user/applicant/applications/track/<int:application_id>/",
        views.TrackApplicationView.as_view(),
        name="track_application",
    ),
    # Used to view profile of a an applicant user, including their submitted applications.
    
    # path("user/applicant/<int:user_id>/", views.ApplicantProfileView.as_view(), name="applicant_profile",),
    

    # Internal account management and dashboard bootstrap endpoints.
    path("user/internal/create/", views.InternalUserCreateView.as_view(), name="internal_user_create"),
    path("user/internal/<int:user_id>/grant-admin/", views.GrantAdminPrivilegeView.as_view(), name="grant_admin_privilege",),
    # Used by frontend to fetch the profile information
    path("user/internal/profile/", views.InternalProfileView.as_view(), name="internal_profile"),
    
]