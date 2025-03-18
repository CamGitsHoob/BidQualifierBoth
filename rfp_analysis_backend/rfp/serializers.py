from rest_framework import serializers
from .models import RFPDocument

class RFPDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFPDocument
        fields = "__all__"
