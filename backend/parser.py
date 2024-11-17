from typing import List, Dict
from pydantic import BaseModel, Field, ValidationError

# Define the structure of the summary response
class SummaryAnalysis(BaseModel):
    topic: str = Field(..., title="Topic", description="The main topic of the audio segment.")
    summary: str = Field(..., title="Summary", description="A brief summary of the discussion in the audio.")
    key_points: List[str] = Field(..., title="Key Points", description="Key points covered in the audio segment.")

    class Config:
        schema_extra = {
            "example": {
                "topic": "Code Review and Rebase",
                "summary": "Two individuals are discussing a code review, specifically focusing on the changes after a rebase.",
                "key_points": [
                    "Code review in progress.",
                    "Concern raised about code appearance after rebasing.",
                    "Uncertainty regarding the correctness of the code post-rebase."
                ]
            }
        }

# Define the structure of the focus analysis response
class FocusAnalysis(BaseModel):
    topic: str = Field(..., title="Topic", description="The main topic of the audio segment.")
    summary: str = Field(..., title="Summary", description="A brief summary of the discussion in the audio.")
    key_points: List[str] = Field(..., title="Key Points", description="Key points covered in the audio segment.")
    focus_insights: str = Field(..., title="Focus Insights", description="Insights into focus changes or trends.")

    class Config:
        schema_extra = {
            "example": {
                "topic": "Code Review and Rebase",
                "summary": "Two individuals are discussing a code review, specifically focusing on the changes after a rebase.",
                "key_points": [
                    "Code review in progress.",
                    "Concern raised about code appearance after rebasing.",
                    "Uncertainty regarding the correctness of the code post-rebase."
                ],
                "focus_insights": "Focus dropped significantly when discussing rebasing, indicating potential confusion or complexity."
            }
        }

# Parsing functions
class PromptParser:
    @staticmethod
    def parse_summary_response(response: dict) -> SummaryAnalysis:
        """
        Parses and validates the structured summary response.

        Args:
            response (dict): The structured summary response.

        Returns:
            SummaryAnalysis: A validated summary analysis object.
        """
        try:
            return SummaryAnalysis(**response)
        except ValidationError as e:
            raise ValueError(f"Invalid summary response format: {e}")

    @staticmethod
    def parse_focus_analysis_response(response: dict) -> FocusAnalysis:
        """
        Parses and validates the structured focus analysis response.

        Args:
            response (dict): The structured focus analysis response.

        Returns:
            FocusAnalysis: A validated focus analysis object.
        """
        try:
            return FocusAnalysis(**response)
        except ValidationError as e:
            raise ValueError(f"Invalid focus analysis response format: {e}")
