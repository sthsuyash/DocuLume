import os
import shutil
from langchain.schema.document import Document
from fastapi.responses import JSONResponse
import chromadb


def format_docs(docs):
    """
    Formats the document chunks into a single string.

    Args:
        docs (list): List of document chunks.

    Returns:
        str: Concatenated string of document contents.
    """
    return "\n".join(doc.page_content for doc in docs)


def create_response(message, status_code):
    """
    Creates a standardized JSON response.

    Args:
        message (str or dict): The message or data to include in the response.
        status_code (int): The HTTP status code for the response.

    Returns:
        JSONResponse: Standardized JSON response.
    """
    return JSONResponse(
        content={
            "status": "success" if status_code == 200 else "error",
            "data": message if isinstance(message, dict) else {"message": message},
        },
        status_code=status_code,
    )


def add_to_chroma(
        chunks: list[Document],
        Chroma,
        embeddings,
        CHROMA_PATH="chroma",
) -> None:
    """
    Adds document chunks to the Chroma database.

    Args:
        chunks (list[Document]): List of document chunks.
        Chroma (class): The Chroma class
        embeddings (class): The embeddings class
        CHROMA_PATH (str): The path to the database directory.
    """

    persistent_client = chromadb.PersistentClient(CHROMA_PATH)

    db = Chroma(
        client = persistent_client,
        # persist_directory=CHROMA_PATH, 
        embedding_function=embeddings
    )

    # Calculate Page IDs.
    chunks_with_ids = calculate_chunk_ids(chunks)

    # Add or Update the documents.
    existing_items = db.get(include=[])  # IDs are always included by default
    existing_ids = set(existing_items["ids"])
    print(f"Number of existing documents in DB: {len(existing_ids)}")

    # Only add documents that don't exist in the DB.
    new_chunks = []
    for chunk in chunks_with_ids:
        if chunk.metadata["id"] not in existing_ids:
            new_chunks.append(chunk)

    if len(new_chunks):
        print(f"Adding new documents: {len(new_chunks)}")
        new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
        db.add_documents(new_chunks, ids=new_chunk_ids)
    else:
        print("✅ No new documents to add")


def calculate_chunk_ids(chunks: list) -> list:
    """
    Calculates unique IDs for each chunk based on the source and page number.
    Format = {Page Source}:{Page Number}:{Chunk Index}

    Args:
        chunks (list): List of document chunks.

    Returns:
        list: List of document chunks with unique IDs.
    """

    last_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        current_page_id = f"{source}:{page}"

        # If the page ID is the same as the last one, increment the index.
        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0

        # Calculate the chunk ID.
        chunk_id = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id

        # Add it to the page meta-data.
        chunk.metadata["id"] = chunk_id

    return chunks


def clear_database(CHROMA_PATH="chroma") -> None:
    """
    Clears the database directory.

    Args:
        CHROMA_PATH (str): The path to the database directory.
    """
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
