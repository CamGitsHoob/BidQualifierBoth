# Generated by Django 5.1.6 on 2025-02-07 10:06

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='RFPDocument',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('file', models.FileField(upload_to='rfp_documents/')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('extracted_text', models.TextField(blank=True)),
                ('analysis_results', models.JSONField(default=dict)),
            ],
        ),
    ]
