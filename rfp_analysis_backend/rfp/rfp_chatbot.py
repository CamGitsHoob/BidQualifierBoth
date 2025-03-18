import os
from pinecone import Pinecone  # Using the new Pinecone client pattern
from openai import OpenAI
from typing import Dict
import numpy as np
from pinecone_store import document_store  # Import the shared document store

class RFPChatbot:
    def __init__(self):
        self.document_store = document_store  # Use the same document store instance
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def get_response(self, question: str) -> Dict:
        try:
            print(f"Getting embedding for question: {question}")
            embedding_response = self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=question
            )
            query_embedding = list(embedding_response.data[0].embedding)
            print(f"Generated embedding dimension: {len(query_embedding)}")

            # Use Haystack's document store instead of direct Pinecone
            results = self.document_store.query_by_embedding(
                query_embedding=query_embedding,
                top_k=5,
                filters=None  # Add any filters if needed
            )
            print(f"Number of results: {len(results)}")
            
            if not results:
                return {
                    "answer": "I couldn't find any relevant information in the documents.",
                    "success": True,
                    "debug_info": {
                        "num_matches": 0,
                        "query_dimension": len(query_embedding)
                    }
                }

            context = "\n".join([doc.content for doc in results])

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert RFP analyst assistant. Answer questions about the RFP document using the provided context. Be concise and specific."},
                    {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}"}
                ],
                temperature=0.3,
                max_tokens=500
            )

            return {
                "answer": response.choices[0].message.content,
                "success": True,
                "debug_info": {
                    "num_matches": len(results),
                    "context_length": len(context)
                }
            }

        except Exception as e:
            print(f"Detailed error: {str(e)}")
            return {
                "answer": "Sorry, I encountered an error while processing your question.",
                "error": str(e),
                "success": False
            }
