from langchain.prompts import PromptTemplate
from langchain.output_parsers import OutputFixingParser, PydanticOutputParser
from llm import LLMModels
from .parsers import RagbotAnalysis, LectureSummary, FocusAnalysis, EngagementMetrics
from .prompt import ragbot_summary_prompt, engagement_metrics_prompt, focus_analysis_prompt, lecture_summary_prompt, improvement_suggestions_prompt
import json
from typing import List, Dict
import re


class RagbotSummaryPrompt(PromptTemplate):
    def __init__(self, data: Dict):
        self.data = data
        self.llm = LLMModels.get_openai_model()
        self.prompt = ragbot_summary_prompt

    def get_prompt(self):
        return self.prompt.format(**self.data)
    
    def get_response(self, response: str):
        return self.llm.get_response(self.get_prompt(), response)
    
    def parse_response(self, response: str):
        return PydanticOutputParser(RagbotAnalysis).parse(response)
    

class EngagementMetricsPrompt(PromptTemplate):
    def __init__(self, data: Dict):
        self.data = data
        self.llm = LLMModels.get_openai_model()
        self.prompt = engagement_metrics_prompt

    def get_prompt(self):
        return self.prompt.format(**self.data)
    
    def get_response(self, response: str):
        return self.llm.get_response(self.get_prompt(), response)
    
    def parse_response(self, response: str):
        return PydanticOutputParser(EngagementMetrics).parse(response)
    

class FocusAnalysisPrompt(PromptTemplate):
    def __init__(self, data: Dict):
        self.data = data
        self.llm = LLMModels.get_openai_model()
        self.prompt = focus_analysis_prompt

    def get_prompt(self):
        return self.prompt.format(**self.data)
    
    def get_response(self, response: str):
        return self.llm.get_response(self.get_prompt(), response)
    
    def parse_response(self, response: str):
        return PydanticOutputParser(FocusAnalysis).parse(response)
    

class LectureSummaryPrompt(PromptTemplate):
    def __init__(self, data: Dict):
        self.data = data
        self.llm = LLMModels.get_openai_model()
        self.prompt = lecture_summary_prompt

    def get_prompt(self):
        return self.prompt.format(**self.data)
    
    def get_response(self, response: str):
        return self.llm.get_response(self.get_prompt(), response)
    
    def parse_response(self, response: str):
        return PydanticOutputParser(LectureSummary).parse(response)
    

class ImprovementSuggestionsPrompt(PromptTemplate):
    def __init__(self, data: Dict):
        self.data = data
        self.llm = LLMModels.get_openai_model()
        self.prompt = improvement_suggestions_prompt

    def get_prompt(self):
        return self.prompt.format(**self.data)
    
    def get_response(self, response: str):
        return self.llm.get_response(self.get_prompt(), response)
    
    def parse_response(self, response: str):
        return OutputFixingParser().parse(response)
    

def get_ragbot_summary(data: Dict) -> RagbotAnalysis:
    prompt = RagbotSummaryPrompt(data)
    response = prompt.get_response("")
    return prompt.parse_response(response)


def get_engagement_metrics(data: Dict) -> EngagementMetrics:
    prompt = EngagementMetricsPrompt(data)
    response = prompt.get_response("")
    return prompt.parse_response(response)


def get_focus_analysis(data: Dict) -> FocusAnalysis:
    prompt = FocusAnalysisPrompt(data)
    response = prompt.get_response("")
    return prompt.parse_response(response)


def get_lecture_summary(data: Dict) -> LectureSummary:
    prompt = LectureSummaryPrompt(data)
    response = prompt.get_response("")
    return prompt.parse_response(response)


def get_improvement_suggestions(data: Dict) -> List[str]:
    prompt = ImprovementSuggestionsPrompt(data)
    response = prompt.get_response("")
    return prompt.parse_response(response)


def get_ragbot_analysis(data: Dict) -> RagbotAnalysis:
    ragbot_summary = get_ragbot_summary(data)
    engagement_metrics = get_engagement_metrics(data)
    focus_analysis = get_focus_analysis(data)
    lecture_summary = get_lecture_summary(data)
    improvement_suggestions = get_improvement_suggestions(data)
    return RagbotAnalysis(lecture_summary=lecture_summary, focus_analysis=focus_analysis, engagement_metrics=engagement_metrics, improvement_suggestions=improvement_suggestions)


def get_ragbot_analysis_json(data: Dict) -> str:
    ragbot_analysis = get_ragbot_analysis(data)
    return ragbot_analysis.json()

