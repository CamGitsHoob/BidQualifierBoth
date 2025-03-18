from haystack.dataclasses import Document
from haystack_integrations.document_stores.pinecone import PineconeDocumentStore
from django.conf import settings
import time

def reset_document_store():
    """Initialize and return a PineconeDocumentStore with correct configuration"""
    document_store = PineconeDocumentStore(
        api_key=settings.PINECONE_API_KEY,
        environment=settings.PINECONE_ENVIRONMENT,
        index_name="rfpuploads",
        dimension=1536,  # OpenAI's dimension
        metric="cosine"
    )
    return document_store

def prepare_document_metadata(doc):
    """Clean metadata to ensure compatibility with Pinecone"""
    try:
        if hasattr(doc, 'metadata') and doc.metadata:
            # Convert _split_overlap to string if present
            cleaned_metadata = doc.metadata.copy()
            if '_split_overlap' in cleaned_metadata:
                cleaned_metadata['split_overlap_str'] = str(cleaned_metadata['_split_overlap'])
                del cleaned_metadata['_split_overlap']
            return cleaned_metadata
    except AttributeError:
        pass
    
    # Return empty dict if no metadata or error
    return {}

def write_documents_with_retry(document_store, documents, max_retries=3):
    """Write documents with retry logic and verification"""
    for attempt in range(max_retries):
        try:
            # Clean metadata for each document
            cleaned_docs = []
            for doc in documents:
                cleaned_metadata = prepare_document_metadata(doc)
                # Create new Document with empty metadata if none exists
                cleaned_docs.append(Document(
                    content=doc.content,
                    embedding=doc.embedding,
                    metadata=cleaned_metadata or {}
                ))
            
            # Write documents
            document_store.write_documents(cleaned_docs)
            
            # Verify write was successful
            time.sleep(1)  # Give Pinecone time to index
            count = document_store.count_documents()
            
            if count > 0:
                print(f"Successfully wrote {count} documents")
                return True
                
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
    
    return False 