from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from services.ai_service import ask_ai_question
from utils import create_response

router = APIRouter()


@router.post("/ask")
async def ask_ai_question_endpoint(request: Request) -> JSONResponse:
    """
    Endpoint to ask a question directly to the AI without using the RAG system.

    Args:
        request (Request): The request object containing the question.

    Returns:
        JSONResponse: Response containing the answer to the question.
    """
    try:
        data = await request.json()
        question = data.get("question")
        answer = ask_ai_question(question)
        return create_response({"answer": answer}, 200)
    except Exception as e:
        return create_response(f"Error answering question: {str(e)}", 500)
