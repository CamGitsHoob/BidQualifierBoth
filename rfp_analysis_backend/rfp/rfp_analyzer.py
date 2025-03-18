from typing import Dict, Any
import os
import json
from dotenv import load_dotenv
from asgiref.sync import async_to_sync
from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from haystack.components.embedders import OpenAITextEmbedder
from haystack.components.generators import OpenAIGenerator
from haystack_integrations.components.retrievers.pinecone import PineconeEmbeddingRetriever
from haystack.utils import Secret
from pinecone_store import document_store

load_dotenv()

class RFPAnalyzer:
    def __init__(self, vector_store):
        self.vector_store = vector_store

    async def analyze_rfp(self, text: str, pdf_path=None) -> Dict[str, Any]:
        """
        Build a pipeline to extract key RFP information and format it as JSON.
        """
        try:
            query_template = """
            System: You are an expert RFP analyzer. Extract information from the RFP and return it ONLY as a valid JSON object. Do not include any additional text.
            First, analyze the entire document and provide a strategic summary that includes:
            - The core opportunity and its strategic value
            - Key differentiators needed to win
            - Major risks or challenges to consider
            - Recommended approach or win themes
            - Resource implications
            - Any competitive insights
            
            For the introduction and background sections:
            - Look for any opening paragraphs that describe the project overview
            - Identify any background context about the organization
            - Include historical information or previous related projects
            - Capture the overall purpose and goals

            Documents:
            {% for doc in documents %}
                {{ doc.content }}
            {% endfor %}

            Question: {{ query }}

            Return a JSON object with exactly this structure:

            {
                "strategic_summary": {
                    "overview": "High-level summary of the opportunity",
                    "key_differentiators": "What's needed to win this bid",
                    "risks_and_challenges": "Major considerations and potential issues",
                    "recommended_approach": "Suggested strategy and win themes",
                    "resource_needs": "Key personnel or capabilities required",
                    "competitive_landscape": "Market context and competitive insights"
                },

                "introduction/background": {
                    "introduction": "",
                    "background": ""
                },
                "bid_summary": {
                    "client_name": "",
                    "rfp_number": "",
                    "services_required": "",
                    "client_contact": "",
                    "email": "",
                    "incumbent": ""
                },
                "key_dates": {
                    "start_date": "",
                    "submission_deadline": "",
                    "clarifications_deadline": "",
                    "issuance_of_response_to_bidder_questions": "",
                    "instruction_to_clarification_question": "",
                    "fully_executed_agreement": "",
                    "site_visit_date": "",
                    "contract_award_date": "",
                    "method_of_submission": "",
                    "submission_instructions": ""
                },
                "work_portfolio": {
                    "experience": "",
                    "case_studies": "",
                    "case_studies_specifications": "",
                    "integration_requirements": "",
                    "other_requirements": "",
                    "references": ""
                },
                "requirements": {
                    "confidentiality": "",
                    "compliances": "",
                    "security": "",
                    "foreign_workers_limitations": "",
                    "notary": "",
                    "on_site_requirements": "",
                    "resumes_required": "",
                    "registration_requirements": "",
                    "contract_length": "",
                    "other_requirements": ""
                },
                "submission_details": {
                    "method": "",
                    "instructions": ""
                },
                "checklist": {
                    "insurances": "",
                    "resumes": "",
                    "business_registrations": ""
                },
                "commercials": {
                    "budget": "",
                    "contract_length": "",
                    "price_quality_ratio": ""
                },
                "website_details": {
                    "web_address": "",
                    "current_cms": "",
                    "preferred_cms": ""
                },
                "flags": {
                    "workload_summary": "",
                    "total_wordcount": "",
                    "targets_provided": "",
                    "design_required": "",
                    "media_plan": "",
                    "pricing_summary": "",
                    "notes": ""
                }
                "further_details": {
                    "Undergraduate": "",
                    "Postgraduate": "",
                    "Research: "",
                    "Qualifications": "",
                    "Apprenticeships": "",
                    "International": "",
                    "Digital": "",
                    "Creative": "",
                    "Media": "",
                    "Offline": "",

                }
            }
            """
            embed_pipeline = Pipeline()
            embed_pipeline.add_component(
                "text_embedder",
                OpenAITextEmbedder(
                    api_key=Secret.from_token(os.getenv("OPENAI_API_KEY")),
                    model="text-embedding-ada-002"
                )
            )
            
            embed_result = embed_pipeline.run({
                "text_embedder": {
                    "text": text
                }
            })
            if not embed_result.get("text_embedder", {}).get("embedding"):
                print("No embedding generated")
                return {}
            
            query_embedding = embed_result["text_embedder"]["embedding"]

            query_pipeline = Pipeline()
            query_pipeline.add_component(
                "retriever",
                PineconeEmbeddingRetriever(document_store=self.vector_store)
            )
            query_pipeline.add_component("prompt_builder", PromptBuilder(template=query_template))
            query_pipeline.add_component(
                "llm",
                OpenAIGenerator(
                    api_key=Secret.from_token(os.getenv("OPENAI_API_KEY")),
                    model="gpt-4o"
                )
            )

            # Connect the components
            query_pipeline.connect("retriever.documents", "prompt_builder.documents")
            query_pipeline.connect("prompt_builder.prompt", "llm.prompt")

            # Run the retrieval and LLM pipeline
            result = query_pipeline.run({
                "retriever": {"query_embedding": query_embedding},
                "prompt_builder": {
                    "query": "Extract all key information from this RFP document."
                }
            })

            # Add debug prints
            print("Full result:", result)
            print("LLM result:", result.get("llm", {}))
            print("Raw reply:", result.get("llm", {}).get("replies", []))

            if isinstance(result.get("llm", {}).get("replies"), list) and result["llm"]["replies"]:
                raw_reply = result["llm"]["replies"][0]
                print("Raw reply content:", raw_reply)
                # Strip out the markdown code block markers
                cleaned_reply = raw_reply.replace("```json", "").replace("```", "").strip()
                try:
                    parsed_reply = json.loads(cleaned_reply)
                    return parsed_reply
                except Exception as parse_error:
                    print(f"Failed to parse LLM reply as JSON: {parse_error}")
                    return {}
            return {}

        except Exception as e:
            print(f"Error in analyze_rfp: {str(e)}")
            return {}

    async def generate_bid_matrix(self, rfp_info: Dict) -> Dict[str, Any]:
        """Generate a detailed bid matrix from RFP information"""
        try:
            matrix = {
                "sections": [
                    {
                        "name": "Project Overview",
                        "items": [
                            {
                                "category": "Budget",
                                "requirement": rfp_info.get("commercials", {}).get("budget", "Not specified"),
                                "priority": "High",
                                "status": "To Review",
                                "notes": "Compare with past successful bids in this range"
                            },
                            {
                                "category": "Deadline",
                                "requirement": rfp_info.get("key_dates", {}).get("submission_deadline", "Not specified"),
                                "priority": "High",
                                "status": "To Review",
                                "notes": "Assess resource availability for timeline"
                            }
                        ]
                    },
                    {
                        "name": "Technical Requirements",
                        "items": [
                            {
                                "category": "Requirement",
                                "requirement": req,
                                "priority": "Medium",
                                "status": "To Review",
                                "notes": "Evaluate against technical capabilities"
                            } for req in rfp_info.get("technical_requirements", [])
                        ]
                    },
                    {
                        "name": "Required Skills",
                        "items": [
                            {
                                "category": "Skill",
                                "requirement": skill,
                                "priority": "High",
                                "status": "To Review",
                                "notes": "Check team availability and expertise"
                            } for skill in rfp_info.get("skills_needed", [])
                        ]
                    }
                ]
            }
            return matrix
        except Exception as e:
            print(f"Error generating bid matrix: {str(e)}")
            raise Exception(f"Failed to generate bid matrix: {str(e)}")