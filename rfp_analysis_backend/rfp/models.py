from django.db import models

class RFPDocument(models.Model):
    id = models.AutoField(primary_key=True)
    file = models.FileField(upload_to="rfp_documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_text = models.TextField(blank=True)
    analysis_results = models.JSONField(default=dict)

    def __str__(self):
        return self.file.name
