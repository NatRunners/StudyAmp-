import os
import sys
from langchain.llms import OpenAI


class LLMModels:
    @staticmethod
    def get_openai_model():
        api_key = os.getenv("OPENAI_API_KEY")
        return OpenAI(api_key=api_key)