import os
from fastapi import UploadFile, HTTPException
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from utils import format_docs

embeddings = OpenAIEmbeddings()
vectorstore = None


def process_pdf(file: UploadFile):
    """
    Processes a PDF file and stores the document chunks in a vector store.

    Args:
        file (UploadFile): The PDF file to be processed.

    Returns:
        str: Success message.
    """
    global vectorstore
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400, detail="Only PDF files are allowed.")

    file_path = os.path.join("pdf", file.filename)

    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        reader = PyPDFLoader(file_path)
        docs = reader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)

        vectorstore = Chroma.from_documents(
            documents=splits, embedding=embeddings)
        return "File uploaded successfully."
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing file: {str(e)}")


def ask_question_with_pdf(question: str) -> str:
    """
    Asks a question based on the uploaded PDF documents.

    Args:
        question (str): The question to ask.

    Returns:
        str: The answer to the question.
    """
    global vectorstore
    if not question:
        raise HTTPException(
            status_code=400, detail="Question field is required.")

    if not vectorstore:
        raise HTTPException(
            status_code=400, detail="No documents uploaded yet.")

    retriever = vectorstore.as_retriever()
    template = """Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    Use three sentences maximum and keep the answer as concise as possible.
    Always say "thanks for asking!" at the end of the answer.

    {context}

    Question: {question}

    Helpful Answer:"""
    prompt = ChatPromptTemplate.from_template(template)
    llm = ChatOpenAI()
    output_parser = StrOutputParser()

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | output_parser
    )

    return rag_chain.invoke(question)
