import os
import time
from dotenv import load_dotenv

load_dotenv()

from pinecone import Pinecone, ServerlessSpec
from haystack_integrations.document_stores.pinecone import PineconeDocumentStore


PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_ENV = os.environ.get("PINECONE_ENV") 
if not PINECONE_API_KEY or not PINECONE_ENV:
    raise ValueError("Pinecone API key or environment is not set. "
                     "Please set the PINECONE_API_KEY and PINECONE_ENV environment variables.")

def reset_document_store():
    """Delete and recreate the Pinecone index"""
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index_name = "rfpuploads"
    dimension = 1536
    spec = ServerlessSpec(cloud="aws", region=PINECONE_ENV)


    try:
        if index_name in [index_info["name"] for index_info in pc.list_indexes()]:
            print(f"Deleting existing index '{index_name}'...")
            pc.delete_index(index_name)

            time.sleep(5)
    except Exception as e:
        print(f"Error deleting index: {str(e)}")

    # Create new index
    print(f"Creating new index '{index_name}'...")
    pc.create_index(name=index_name, dimension=dimension, metric="cosine", spec=spec)


    while True:
        try:
            status = pc.describe_index(index_name).status
            if status.get('ready'):
                break
            print("Waiting for index to be ready...")
            time.sleep(2)
        except Exception as e:
            print(f"Error checking index status: {str(e)}")
            time.sleep(2)

    print(f"Index '{index_name}' is ready.")
    return PineconeDocumentStore(
        index=index_name,
        metric="cosine"
    )


pc = Pinecone(api_key=PINECONE_API_KEY)


index_name = "rfpuploads"
dimension = 1536


spec = ServerlessSpec(cloud="aws", region=PINECONE_ENV)


existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]
if index_name not in existing_indexes:
    print(f"Index '{index_name}' not found. Creating index...")
    pc.create_index(name=index_name, dimension=dimension, metric="cosine", spec=spec)
else:
    print(f"Index '{index_name}' already exists.")


document_store = PineconeDocumentStore(
    index=index_name,
    metric="cosine"
)

print(f"Pinecone index '{index_name}' is ready and connected.")