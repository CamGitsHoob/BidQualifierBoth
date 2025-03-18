from django.urls import path
from . import views

urlpatterns = [
    path('upload_pdf/', views.upload_pdf, name='upload_pdf'),
    path('analyze/', views.analyze_rfp, name='analyze_rfp'),
    path('chat/', views.chat_with_rfp, name='chat_with_rfp'),
    path('matrix/', views.generate_bid_matrix, name='generate_bid_matrix'),
    path('download/', views.download_matrix, name='download_matrix'),
    path('compare-indexes/', views.compare_indexes, name='compare-indexes'),
    path('download-report/', views.download_report, name='download_report'),
]