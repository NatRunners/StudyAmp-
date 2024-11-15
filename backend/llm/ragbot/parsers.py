from pydantic import BaseModel, Field, Extra
from typing import List, Optional

class LectureSummary(BaseModel):
    """Model to store summarized notes from lecture audio."""
    topic: str = Field(..., title="Lecture Topic")
    summarized_notes: List[str] = Field(..., title="Summarized Notes")
    key_points: List[str] = Field(..., title="Key Points")
    duration: Optional[str] = Field(None, title="Lecture Duration")
    timestamped_notes: List[str] = Field(..., title="Timestamped Notes")

class FocusAnalysis(BaseModel):
    """Model to track and analyze focus during the lecture."""
    lost_focus_timestamps: List[str] = Field(..., title="Lost Focus Timestamps")
    focus_loss_duration: str = Field(..., title="Total Focus Loss Duration")
    focus_loss_impact: Optional[str] = Field(None, title="Impact of Focus Loss")

class EngagementMetrics(BaseModel):
    """Model to evaluate engagement metrics."""
    overall_engagement_score: int = Field(..., title="Engagement Score (0-100)")
    peak_focus_times: List[str] = Field(..., title="Peak Focus Timestamps")
    distracted_phases: List[str] = Field(..., title="Distracted Phases")

class RagbotAnalysis(BaseModel):
    """Comprehensive Ragbot output combining various analyses."""
    lecture_summary: LectureSummary = Field(..., title="Lecture Summary")
    focus_analysis: FocusAnalysis = Field(..., title="Focus Analysis")
    engagement_metrics: EngagementMetrics = Field(..., title="Engagement Metrics")
    improvement_suggestions: Optional[List[str]] = Field(None, title="Suggestions to Improve Focus")
