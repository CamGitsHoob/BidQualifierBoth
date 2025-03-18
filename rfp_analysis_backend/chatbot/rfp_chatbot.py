import os
from dotenv import load_dotenv
load_dotenv()  # load environment variables immediately

from haystack import Document
from haystack.components.embedders import OpenAIDocumentEmbedder
from haystack.utils import Secret
from rfp_analysis_backend.pinecone_store import document_store
from haystack_integrations.components.retrievers.pinecone import PineconeEmbeddingRetriever

def answer_query(query_text):
    # Retrieve your OpenAI API key from the environment.
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY is not set.")

    # Instantiate the OpenAIDocumentEmbedder with the model that returns 1536-dimensional embeddings.
    embedder = OpenAIDocumentEmbedder(
        api_key=Secret.from_token(openai_api_key),
        model="text-embedding-ada-002"
    )

    # Wrap the query text in a Document object and compute its embedding.
    query_doc = Document(content=query_text)
    embedding_result = embedder.run([query_doc])
    query_embedding = embedding_result["documents"][0].embedding

    # Create the PineconeEmbeddingRetriever using the document store.
    retriever = PineconeEmbeddingRetriever(document_store=document_store)

    # Query the Pinecone document store using the query embedding.
    retriever_result = retriever.run(query_embedding=query_embedding, top_k=3)

    # Extract and return the list of documents from the retriever result.
    results = retriever_result.get("documents", [])
    return results

if __name__ == "__main__":
    query = "What are the main requirements of the RFP?"
    results = answer_query(query)
    for res in results:
        print(f"ID: {res.id}, Score: {res.score}, Content: {res.content}")