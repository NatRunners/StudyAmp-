from ragbot.agent import RAGBotAgent
import os
from dotenv import load_dotenv

# Load environment variables

# API Key for OpenAI
api_key = os.getenv("OPENAI_API_KEY")

# Instantiate the agent
agent = RAGBotAgent(api_key)

# Audio file path and focus data
# audio_path = "audio/lecture_audio.mp3"
audio_path = "audio/harvard.wav"
focus_data = {
    "0-5 mins": 80,
    "5-10 mins": 65,
    "10-15 mins": 45,
    "15-20 mins": 30,
}

# Process the audio and focus data
result = agent.process_audio_and_focus(audio_path, focus_data)

# Print the result
print(result)
