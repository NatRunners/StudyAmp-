def get_summary_prompt(transcript: str, focus_data: dict) -> str:
    """
    Generates the prompt for the summarization task.
    """
    return (
        "You are an AI assistant. Based on the following transcript and focus data, "
        "generate summarized notes and actionable insights for focus improvement.\n\n"
        f"Transcript: {transcript}\n\n"
        f"Focus Data: {focus_data}\n\n"
        "Summarized Notes:\n"
    )
