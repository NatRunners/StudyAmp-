import openai
from typing import Dict, List
import os
from dotenv import load_dotenv
import concurrent.futures

load_dotenv()


class LLM:
    def __init__(self, api_key: str):
        openai.api_key = os.getenv("OPENAI_API_KEY")

    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribes audio using OpenAI Whisper API.
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                response = openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )
            return response.text
        except Exception as e:
            raise Exception(f"Error transcribing audio: {e}")

    def chunk_transcript(self, transcript: str, max_tokens: int = 3000) -> List[str]:
        """
        Splits the transcript into smaller chunks to fit within the token limit.
        """
        words = transcript.split()
        chunks = []
        current_chunk = []

        for word in words:
            current_chunk.append(word)
            if len(" ".join(current_chunk)) > max_tokens:
                chunks.append(" ".join(current_chunk))
                current_chunk = []

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def generate_summaries(self, transcript: str) -> List[str]:
        """
        Generates summaries for each chunk of the transcript.
        """
        chunks = self.chunk_transcript(transcript)
        summaries = []

        def summarize_chunk(chunk):
            prompt = (
                "You are an AI assistant. Use the following transcript chunk "
                "to generate summarized notes in a clear and concise paragraph form.\n\n"
                f"Transcript Chunk: {chunk}\n\n"
                "Summarized Notes:\n"
            )
            try:
                response = openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": prompt}],
                )
                return response.choices[0].message.content
            except Exception as e:
                return f"Error in processing chunk: {e}"

        # Use ThreadPoolExecutor to process chunks concurrently
        max_threads = 4  # Adjust based on your system and API rate limits
        with concurrent.futures.ThreadPoolExecutor(max_threads) as executor:
            future_to_chunk = {executor.submit(summarize_chunk, chunk): chunk for chunk in chunks}
            for future in concurrent.futures.as_completed(future_to_chunk):
                try:
                    summaries.append(future.result())
                except Exception as e:
                    print(f"Error generating summary for a chunk: {e}")

        return summaries


    def generate_focus_insights(self, focus_data: Dict) -> str:
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
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error generating focus insights: {e}")
