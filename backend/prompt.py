class PromptGenerator:
    @staticmethod
    def generate_summary_prompt():

        # prompt = """List a few popular cookie recipes in JSON format.

        # Use this JSON schema:

        # Recipe = {'recipe_name': str, 'ingredients': list[str]}
        # Return: list[Recipe]"""

        #use above prompt as template
        
        prompt = """
        Based on the analysis of the audio segment, provide a summary of the discussion and key points covered.
        Include any important details or insights that would be relevant to the user's request.

        Use this JSON schema:

        Audio_Sum = {'topic': str, 'summary': str, 'key_points': list[str]}
        Return: Audio_Sum
        """

        return prompt
        
        

    @staticmethod
    def generate_focus_analysis_prompt() -> str:
        
        focus_analysis_prompt = '''
        User Request: {query}

        Audio Segment Analysis:
        Topic: {topic}
        Summary: {summary}
        Key Points:
        - {key_points}
        - {key_points}
        - {key_points}
        - {key_points}

        Based on the analysis of the audio segment and focus data provided, analyze the key points covered during the specified time intervals.
        Highlight any significant changes or trends in the discussion over time and provide insights into the focus areas identified.

        '''

        return focus_analysis_prompt