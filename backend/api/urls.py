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
]