# Question Answering RAG System

This project is a REST API for a Question Answering system using Retrieval-Augmented Generation (RAG) with OpenAI's language models. The system processes PDF documents, splits them into chunks, stores them in a vector store and allows users to ask questions based on the uploaded documents.

A RAG(Retrieval-Augmented Generation) model is a transformer-based model that combines the benefits of retrieval-based and generation-based models. It uses a retriever to find relevant passages from a large corpus of documents and then generates an answer based on the retrieved passages.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Using Docker](#using-docker)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Root Endpoint](#root-endpoint)
  - [Upload PDF](#upload-pdf)
  - [Ask Question](#ask-question)
- [Postman Collection](#postman-collection)
- [Project Structure](#project-structure)
- [License](#license)

## Features

- Upload PDF files and process them into document chunks.
- Store document chunks in a vector store for efficient retrieval.
- Ask questions based on the uploaded documents using a RAG approach.
- Consistent JSON response format for all endpoints.

## Requirements

- Python
- FastAPI
- Uvicorn
- PyPDF2
- Langchain libraries

## Using Docker

You can also run the project using Docker. Refer to the [Docker documentation](README.Docker.md) for more information.

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/sthsuyash/chat-pdf.git
   cd chat-pdf
   ```

2. Create a virtual environment:

   - For Windows:

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate
   ```

   - For MacOS/Linux:

   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the required dependencies:

   ```sh
   pip install -r requirements.txt
   ```

4. Rename the `.env.example` file to `.env` and update the environment variables.

## Usage

1. Start the FastAPI server:

   ```sh
   uvicorn main:app --reload
   ```

2. The API will be available at `http://127.0.0.1:8000`.

## API Endpoints

### Root Endpoint

- **GET /**

  - Description: Root endpoint to test the API.
  - Response:

    ```json
    {
      "status": "success",
      "data": {
        "message": "Welcome to the Question Answering RAG system!"
      }
    }
    ```

### Upload PDF

- **POST /upload_pdf**

  - Description: Upload a PDF file and process it into chunks for the vector store.
  - Request:
    - File: A PDF file.
  - Response:

    - Success:

      ```json
      {
        "status": "success",
        "data": {
          "message": "File uploaded successfully."
        }
      }
      ```

    - Error:

      ```json
      {
        "status": "error",
        "data": {
          "message": "Error processing file: <error_message>"
        }
      }
      ```

### Ask Question

- **POST /ask_question**

  - Description: Ask a question based on the uploaded documents.
  - Request:

    - JSON body:

      ```json
      {
        "question": "Your question here"
      }
      ```

  - Response:

    - Success:

      ```json
      {
        "status": "success",
        "data": {
          "answer": "The answer to your question."
        }
      }
      ```

    - Error:

      ```json
      {
        "status": "error",
        "data": {
          "message": "Error answering question: <error_message>"
        }
      }
      ```

## Postman Collection

You can import the Postman collection to test the API endpoints. The collection is available [here](RAG%20System.postman_collection.json).

## Project Structure

```readme
.
├── pdf/                # Directory to store uploaded PDF files
├── main.py             # Main FastAPI application
├── routes/             # Directory containing API route definitions
│   ├── __init__.py
│   ├── ai.py           # Route for AI operations
│   ├── base.py         # Base route for the API
│   ├── chat.py         # Route for chat operations using pdf
├── services/           # Directory containing service classes
│   ├── __init__.py
│   ├── ai_service.py   # Service class for AI operations
│   ├── pdf_service.py  # Service class for PDF operations
├── utils.py            # Utility functions for the application
├── requirements.txt    # Project dependencies
├── .env.example        # Example environment variables
├── .env                # Environment variables
├── Dockerfile          # Dockerfile for building the project
├── docker-compose.yml  # Docker Compose configuration
├── .gitignore          # Files and directories to be ignored by Git
├── .dockerignore       # Files and directories to be ignored by Docker
├── README.Docker.md    # Documentation for running the project in Docker
└── README.md           # Project documentation
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
