import os
from pinecone import Pinecone  # Using the new Pinecone client pattern
from openai import OpenAI
from typing import Dict
import numpy as np

class RFPChatbot:
    def __init__(self):
        # Initialize Pinecone with new syntax
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = pc.Index("rfpuploads")
        
        # Initialize OpenAI
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def get_response(self, question: str) -> Dict:
        try:
            # Get embedding for the question
            print(f"Getting embedding for question: {question}")
            embedding_response = self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=question
            )
            query_embedding = list(embedding_response.data[0].embedding)  # Convert to list
            print(f"Generated embedding dimension: {len(query_embedding)}")

            # Query Pinecone with default namespace
            print("Querying Pinecone...")
            query_response = self.index.query(
                vector=query_embedding,
                top_k=5,
                include_metadata=True,
                namespace="default"  # Explicitly query the default namespace
            )
            print(f"Raw Pinecone response: {query_response}")

            # Extract relevant text from matches
            matches = query_response.matches
            print(f"Number of matches: {len(matches)}")
            
            if not matches:
                return {
                    "answer": "I couldn't find any relevant information in the documents. Please try rephrasing your question.",
                    "success": True,
                    "debug_info": {
                        "num_matches": 0,
                        "query_dimension": len(query_embedding)
                    }
                }

            # Extract context from matches
            context = "\n".join([match.metadata.get('content', '') for match in matches])

            # Generate response
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
                    "num_matches": len(matches),
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
