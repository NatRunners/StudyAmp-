import google.generativeai as genai
import os
from dotenv import load_dotenv
import pathlib as Pathlib

load_dotenv()


class LLM:
    def __init__(self, api_key: str):
        """
        Initialize the LLM class with an API key.
        """
        self.api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name="gemini-1.5-flash")


    def summarize_audio(self, audio_file_path: str) -> str:
        """
        Directly processes audio using Gemini API and generates a summary.
        """

        
        prompt = "Summarize the following lecture in a structured manner with headings and paragraphs. Avoid using bullet points or special characters such as stars (*). Instead, format the text as plain sentences with clear separations along with notes to help the user understand the key points.\n\n"

        try:


            response = self.model.generate_content([
                prompt,
                {
                    "mime_type": "audio/mp3",
                    "data": Pathlib.Path(audio_file_path).read_bytes()
                }
            ])
            # response = self.model.generate_content([prompt, audio_file_path])

            # print(response.text)
            return response.text
        except Exception as e:
            raise Exception(f"Error summarizing audio: {e}")

    def generate_focus_insights(self, focus_data: dict) -> str:
        """
        Generates actionable insights based on the focus data.
        """
        prompt = (
            "You are an AI assistant. Use the following focus data to generate actionable insights "
            "for improving focus during future lectures or meetings.\n\n"
            f"Focus Data: {focus_data}\n\n"
            "Actionable Insights:\n"
        )
        try:
            response = self.model.generate_content([prompt])
            return response.text
        except Exception as e:
            raise Exception(f"Error generating focus insights: {e}")
