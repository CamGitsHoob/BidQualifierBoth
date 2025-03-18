import os
import time
from dotenv import load_dotenv

load_dotenv()

from pinecone import Pinecone, ServerlessSpec
from haystack_integrations.document_stores.pinecone import PineconeDocumentStore

# Retrieve your Pinecone API key and environment from environment variables.
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_ENV = os.environ.get("PINECONE_ENV")  # e.g., "us-west-2"
if not PINECONE_API_KEY or not PINECONE_ENV:
    raise ValueError("Pinecone API key or environment is not set. "
                     "Please set the PINECONE_API_KEY and PINECONE_ENV environment variables.")

pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index_name_base = "rfp-analysis"

def get_session_index_name(session_id):
    """Generate a unique index name for a session"""
    # Use only the first 8 characters of the UUID to keep the name short
    short_id = session_id[:8]
    return f"{index_name_base}-{short_id}"

def create_session_index(session_id):
    """Create a new index for a specific session"""
    index_name = get_session_index_name(session_id)
    
    # Ensure the index name is valid for Pinecone (max 45 chars)
    if len(index_name) > 45:
        # Truncate if necessary
        index_name = index_name[:45]
    
    # Check if the index already exists
    if index_name not in pc.list_indexes().names():
        # Create a new index
        pc.create_index(
            name=index_name,
            dimension=1536,  # OpenAI embedding dimension
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-west-2")
        )
    
    # Return the index
    return pc.Index(index_name)

def get_document_store(session_id=None):
    """Get or create a document store for a specific session"""
    if session_id:
        index = create_session_index(session_id)
        index_name = get_session_index_name(session_id)
        return PineconeDocumentStore(
            index=index_name,
        )
    else:
        # Default index for backward compatibility
        index_name = "rfp-analysis"
        if index_name not in pc.list_indexes().names():
            pc.create_index(
                name=index_name,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-west-2")
            )
        return PineconeDocumentStore(
            index=index_name,
        )

def reset_document_store(session_id=None):
    """Reset a document store for a specific session"""
    index_name = get_session_index_name(session_id) if session_id else "rfp-analysis"
    
    # Delete the index if it exists
    if index_name in pc.list_indexes().names():
        pc.delete_index(index_name)
    
    # Create a new index
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-west-2")
    )
    
    # Return a new document store
    from haystack_integrations.document_stores.pinecone import PineconeDocumentStore
    return PineconeDocumentStore(
        index=index_name,
    )

# Create a default document store
document_store = get_document_store()

# Create a Pinecone client instance using the new API
pc = Pinecone(api_key=PINECONE_API_KEY)

# Define your index name (must be lowercase and use hyphens) and embedding dimension.
index_name = "rfpuploads"
dimension = 1536

# Create a ServerlessSpec with your preferred cloud and region.
spec = ServerlessSpec(cloud="aws", region=PINECONE_ENV)

# List existing indexes and check if our index already exists.
existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]
if index_name not in existing_indexes:
    print(f"Index '{index_name}' not found. Creating index...")
    pc.create_index(name=index_name, dimension=dimension, metric="cosine", spec=spec)
else:
    print(f"Index '{index_name}' already exists.")

# Initialize the PineconeDocumentStore with the created index.
document_store = PineconeDocumentStore(
    index=index_name,
    metric="cosine"
)

print(f"Pinecone index '{index_name}' is ready and connected.")