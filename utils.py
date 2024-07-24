from fastapi.responses import JSONResponse

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
