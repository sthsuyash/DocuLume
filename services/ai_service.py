from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough


def ask_ai_question(question: str) -> str:
    """
    Asks a question directly to the AI without using the RAG system.

    Args:
        question (str): The question to ask.

    Returns:
        str: The answer to the question.
    """
    llm = ChatOpenAI()
    prompt = ChatPromptTemplate.from_template("{question}\nAnswer:")
    output_parser = StrOutputParser()

    ai_chain = (
        {"question": RunnablePassthrough()}
        | prompt
        | llm
        | output_parser
    )

    return ai_chain.invoke(question)
