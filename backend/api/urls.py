from django.urls import path
from . import views

# API URL patterns for the api app
urlpatterns = [
    path(
        "applications/submit/",
        views.SubmitApplicationView.as_view(),
        name="submit_application",
    ),
    path(
        "applications/my-latest/",
        views.MyLatestApplicationView.as_view(),
        name="my_latest_application",
    ),
]