from llm import LLM
from ragbot.parsers import parse_focus_data, parse_transcript
from typing import Dict

class RAGBotAgent:
    def __init__(self, api_key: str):
        self.llm = LLM(api_key)

    def process_audio_and_focus(self, audio_path: str, focus_data: Dict) -> str:
        """
        Main entry point for processing audio and focus data.
        """
        # Step 1: Transcribe audio
        transcript = self.llm.transcribe_audio(audio_path)
        
        # Step 2: Parse transcript
        parsed_transcript = parse_transcript(transcript)
        
        # Step 3: Parse focus data
        parsed_focus_data = parse_focus_data(focus_data)
        
        # Step 4: Generate summaries for the transcript in chunks
        summaries = self.llm.generate_summaries(parsed_transcript)
        combined_summary = " ".join(summaries)  # Combine into paragraphs
        
        # Step 5: Generate focus insights
        focus_insights = self.llm.generate_focus_insights(parsed_focus_data)
        
        # Step 6: Combine all outputs
        final_output = f"{combined_summary}\n\nFocus Insights:\n\n{focus_insights}"
        
        return final_output
