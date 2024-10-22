import os
from fastapi import UploadFile, HTTPException
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from utils import add_to_chroma

embeddings = OpenAIEmbeddings()

CHROMA_PATH = "chroma"
DATA_PATH = "pdf"


def process_pdf(file: UploadFile):
    """
    Processes a PDF file and stores the document chunks in a vector store.

    Args:
        file (UploadFile): The PDF file to be processed.

    Returns:
        str: Success message.
    """
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB file size limit

    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400, detail="Only PDF files are allowed."
        )

    # Read the file contents to check size
    file_content = file.file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail="File size exceeds the 10 MB limit."
        )

    file_path = os.path.join("pdf", file.filename)

    try:
        with open(file_path, "wb") as f:
            f.write(file_content)

        reader = PyPDFLoader(file_path)
        docs = reader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )
        splits = text_splitter.split_documents(docs)

        add_to_chroma(splits, Chroma, embeddings, CHROMA_PATH)

        return "File uploaded successfully."
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing file: {str(e)}"
        )


def ask_question_with_pdf(question: str) -> str:
    """
    Asks a question based on the uploaded PDF documents.

    Args:
        question (str): The question to ask.

    Returns:
        str: The answer to the question.
    """
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embeddings
    )

    # Search the db
    results = db.similarity_search_with_score(question, k=5)

    if not question:
        raise HTTPException(
            status_code=400, detail="Question field is required.")

    if not db:
        raise HTTPException(
            status_code=400, detail="No documents uploaded yet.")

    context_text = "\n\n---\n\n".join(
        [doc.page_content for doc, _score in results]
    )

    template = """Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    Use three sentences maximum and keep the answer as concise as possible.
    Always say "thanks for asking!" at the end of the answer.

    {context}

    Question: {question}

    Helpful Answer:"""
    prompt_template = ChatPromptTemplate.from_template(template)
    prompt = prompt_template.format(context=context_text, question=question)

    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
    )

    response_message = llm.invoke(prompt)

    response_text = response_message.content

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    formatted_response = {
        "response": response_text,
        "sources": sources
    }

    return formatted_response
