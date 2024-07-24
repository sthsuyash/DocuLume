from fastapi import APIRouter
from utils import create_response

router = APIRouter()


@router.get("/")
async def root():
    """
    Root endpoint to test the API.
    """
    return create_response("Welcome to the Question Answering RAG system!", 200)
