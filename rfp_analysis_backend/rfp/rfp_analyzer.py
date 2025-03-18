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
            # Define the query template
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
                    "overview": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "key_differentiators": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "risks_and_challenges": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "recommended_approach": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "resource_needs": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "competitive_landscape": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "introduction/background": {
                    "introduction": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "background": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "bid_summary": {
                    "client_name": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "rfp_number": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "services_required": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "client_contact": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "email": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "incumbent": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "key_dates": {
                    "start_date": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "submission_deadline": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "clarifications_deadline": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "issuance_of_response_to_bidder_questions": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "instruction_to_clarification_question": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "fully_executed_agreement": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "site_visit_date": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "contract_award_date": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "method_of_submission": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "submission_instructions": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "work_portfolio": {
                    "experience": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "case_studies": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "case_studies_specifications": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "integration_requirements": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "other_requirements": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "references": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "requirements": {
                    "confidentiality": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "compliances": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "security": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "foreign_workers_limitations": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "notary": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "on_site_requirements": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "resumes_required": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "registration_requirements": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "contract_length": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "other_requirements": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "submission_details": {
                    "method": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "instructions": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "checklist": {
                    "insurances": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "resumes": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "business_registrations": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "commercials": {
                    "budget": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "contract_length": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "price_quality_ratio": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "website_details": {
                    "web_address": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "current_cms": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "preferred_cms": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                },
                "flags": {
                    "workload_summary": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "total_wordcount": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "targets_provided": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "design_required": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "media_plan": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "pricing_summary": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    },
                    "notes": {
                        "value": "",
                        "confidence": 0.0,
                        "is_interpreted": false
                    }
                }
            }

            For each field:
            1. Set "value" to the extracted information from the RFP
            2. Set "confidence" to a value between 0.0 and 1.0 indicating your confidence in the extraction
            3. Set "is_interpreted" to true if you had to interpret or infer the information rather than directly extract it
            
            If information is explicitly stated in the RFP, set confidence high (0.8-1.0) and is_interpreted to false.
            If information is implied but not explicitly stated, provide your best interpretation, set confidence lower (0.4-0.7), and set is_interpreted to true.
            If you're making an educated guess based on context, set confidence even lower (0.1-0.3) and set is_interpreted to true.
            If information is completely absent, leave value as empty string, set confidence to 0.0, and is_interpreted to false.
            
            For example:
            - If the RFP clearly states "Budget: $500,000", set {"value": "$500,000", "confidence": 1.0, "is_interpreted": false}
            - If the RFP mentions "work must be completed within 12 months" but doesn't explicitly state contract length, set {"value": "12 months", "confidence": 0.6, "is_interpreted": true}
            - If there's no mention of the incumbent, leave as {"value": "", "confidence": 0.0, "is_interpreted": false}
            """

            # First, get the embedding for our query text
            embed_pipeline = Pipeline()
            embed_pipeline.add_component(
                "text_embedder",
                OpenAITextEmbedder(
                    api_key=Secret.from_token(os.getenv("OPENAI_API_KEY")),
                    model="text-embedding-ada-002"
                )
            )
            
            # Get the embedding
            embed_result = embed_pipeline.run({
                "text_embedder": {
                    "text": text
                }
            })
            if not embed_result.get("text_embedder", {}).get("embedding"):
                print("No embedding generated")
                return {}
            
            # Extract the embedding vector
            query_embedding = embed_result["text_embedder"]["embedding"]

            # Now use this embedding to query Pinecone
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
            # Extract values from the new nested structure
            def get_value(section, key):
                if section in rfp_info and key in rfp_info[section]:
                    item = rfp_info[section][key]
                    if isinstance(item, dict) and "value" in item:
                        return item["value"]
                    return item  # For backward compatibility
                return "Not specified"
            
            matrix = {
                "sections": [
                    {
                        "name": "Project Overview",
                        "items": [
                            {
                                "category": "Budget",
                                "requirement": get_value("commercials", "budget"),
                                "priority": "High",
                                "status": "To Review",
                                "notes": "Compare with past successful bids in this range"
                            },
                            {
                                "category": "Deadline",
                                "requirement": get_value("key_dates", "submission_deadline"),
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