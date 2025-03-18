import requests
import json

url = "http://localhost:8000/api/rfp/analyze/"
data = {
    "rfp_text": "Request for Proposal (RFP)\nCompany: TechCorp Solutions\nBudget: $500,000\nDeadline: December 31, 2024\n\nWe are seeking proposals for implementing an enterprise-wide CRM solution.\nKey requirements include Salesforce integration, data migration, and staff training."
}

response = requests.post(
    url, 
    json=data,
    headers={"Content-Type": "application/json"}
)

print(f"Status code: {response.status_code}")
print(f"Response: {response.text}") 