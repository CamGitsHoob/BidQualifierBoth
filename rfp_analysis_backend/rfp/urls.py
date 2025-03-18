from django.urls import path
from . import views

urlpatterns = [
    path('api/v1/rfp/upload_pdf/', views.upload_pdf, name='upload_pdf'),
    path('api/v1/rfp/analyze/', views.analyze_rfp, name='analyze_rfp'),
    path('api/v1/rfp/chat/', views.chat_with_rfp, name='chat_with_rfp'),
    path('api/v1/rfp/matrix/', views.generate_bid_matrix, name='generate_bid_matrix'),
    path('api/v1/rfp/download/', views.download_matrix, name='download_matrix'),
    path('api/v1/rfp/compare-indexes/', views.compare_indexes, name='compare-indexes'),
    path('api/v1/rfp/download-report/', views.download_report, name='download_report'),
]