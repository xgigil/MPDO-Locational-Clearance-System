from django.urls import path
from . import views

# API URL patterns for the api app
urlpatterns = [
    # Used by frontend to submit a new application.
    path("applications/submit/", views.SubmitApplicationView.as_view(), name="submit_application",),
    # Used by frontend to fetch the latest copy and know if application submission must be disabled.
    path("applications/my-latest/", views.MyLatestApplicationView.as_view(), name="my_latest_application",),
    # Streams a PDF directly from database-backed document storage.
    path(
        "applications/documents/<int:document_id>/download/",
        views.DownloadApplicationDocumentView.as_view(),
        name="download_application_document",
    ),
    # Internal account management and dashboard bootstrap endpoints.
    path("internal/users/create/", views.InternalUserCreateView.as_view(), name="internal_user_create"),
    path("internal/profile/", views.InternalProfileView.as_view(), name="internal_profile"),
    path(
        "internal/users/<int:user_id>/grant-admin/",
        views.GrantAdminPrivilegeView.as_view(),
        name="grant_admin_privilege",
    ),
]