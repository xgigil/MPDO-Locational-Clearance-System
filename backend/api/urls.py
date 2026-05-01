from django.urls import path
from . import views

# API URL patterns for the api app
urlpatterns = [
    # Used by frontend to submit a new application.
    path("user/applicant/applications/submit/", views.SubmitApplicationView.as_view(), name="submit_application",),
    # Used by frontend to fetch the latest copy and know if application submission must be disabled.
    path("user/applicant/applications/my-latest/", views.MyLatestApplicationView.as_view(), name="my_latest_application",),
    # Allows applicant to re-upload only the compliance-required documents.
    path("user/applicant/applications/<int:application_id>/resubmit-compliance/", views.ApplicantComplianceResubmitView.as_view(), name="resubmit_compliance",),
    # Used to view profile of a an applicant user, including their submitted applications.
    
    # path("user/applicant/<int:user_id>/", views.ApplicantProfileView.as_view(), name="applicant_profile",),
    

    # Internal account management and dashboard bootstrap endpoints.
    path("user/internal/create/", views.InternalUserCreateView.as_view(), name="internal_user_create"),
    path("user/internal/<int:user_id>/grant-admin/", views.GrantAdminPrivilegeView.as_view(), name="grant_admin_privilege",),
    # Used by frontend to fetch the profile information
    path("user/internal/profile/", views.InternalProfileView.as_view(), name="internal_profile"),
    # Role-based queue endpoint for internal dashboard components.
    path("user/internal/applications/queue/", views.InternalApplicationQueueView.as_view(), name="internal_application_queue"),
    # Role-based transition/upload actions.
    path("user/internal/applications/<int:application_id>/action/", views.InternalApplicationActionView.as_view(), name="internal_application_action"),
    # Streams uploaded PDF bytes for application copy and role queues.
    path("user/internal/documents/<int:document_id>/download/", views.DownloadApplicationDocumentView.as_view(), name="download_application_document"),

    # Authenticated user password change
    path("user/change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    
]