from haystack.document_stores import InMemoryDocumentStore
from haystack.dataclasses import Document

def get_document_store(doc_id):
    # For testing, delete after testing
    document_store = InMemoryDocumentStore()
    
    # Get the document content from your storage
    documents = [
        Document(
            content=your_stored_content,  # Get this from your database/storage
            metadata={"doc_id": doc_id}
        )
    ]
    
    # Write documents to the document store
    document_store.write_documents(documents)
    
    return document_store 