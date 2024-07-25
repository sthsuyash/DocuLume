from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from services.pdf_service import process_pdf, ask_question_with_pdf
from utils import create_response

router = APIRouter()


@router.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)) -> JSONResponse:
    """
    Endpoint to upload a PDF file and process it into chunks for the vector store.

    Args:
        file (UploadFile): The PDF file to be uploaded.

    Returns:
        JSONResponse: Response indicating success or failure.
    """
    try:
        message = process_pdf(file)
        return create_response({
            "message": message,
            "filename": file.filename
        }, 200)
    except HTTPException as e:
        return create_response(e.detail, e.status_code)


@router.post("/ask_question")
async def ask_question_endpoint(request: Request) -> JSONResponse:
    """
    Endpoint to ask a question based on the uploaded documents.

    Args:
        request (Request): The request object containing the question.

    Returns:
        JSONResponse: Response containing the answer to the question.
    """
    try:
        data = await request.json()
        question = data.get("question")
        answer = ask_question_with_pdf(question)
        return create_response({"answer": answer}, 200)
    except HTTPException as e:
        return create_response(e.detail, e.status_code)
