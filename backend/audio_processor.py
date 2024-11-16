import json
import google.generativeai as genai
from pydub import AudioSegment
import io
import os
from typing import List, Dict
import tempfile
import subprocess
from fastapi import HTTPException
import logging
import time
import shutil
from winmagic import magic
import magic
import uuid
from dotenv import load_dotenv
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class AudioProcessor:
    def __init__(self):
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.model = genai.GenerativeModel('gemini-1.5-flash')  # Updated to use audio-capable model

        # Verify ffmpeg installation
        try:
            ffmpeg_path = shutil.which('ffmpeg')
            if not ffmpeg_path:
                raise RuntimeError("FFmpeg not found in system PATH")
            logger.info(f"Found FFmpeg at: {ffmpeg_path}")
            
            # Test FFmpeg capabilities
            version = subprocess.run(['ffmpeg', '-version'], 
                                  capture_output=True, text=True, check=True)
            logger.info(f"FFmpeg version info: {version.stdout.splitlines()[0]}")
        except Exception as e:
            logger.error(f"FFmpeg initialization error: {e}")
            raise

        self.temp_dir = os.path.join(tempfile.gettempdir(), 'studyamp_audio')
        os.makedirs(self.temp_dir, exist_ok=True)
        logger.info(f"Created temp directory at: {self.temp_dir}")

    def _create_temp_file(self, suffix: str) -> tuple[str, str]:
        """Create a temporary file with unique name and proper permissions."""
        unique_id = str(uuid.uuid4())[:8]
        filename = f"audio_{unique_id}{suffix}"
        filepath = os.path.join(self.temp_dir, filename)
        return filename, filepath

    async def process_audio(self, audio_file: bytes, timestamps_json: str) -> List[str]:
        start_time = time.time()
        temp_files = []  # Track temporary files for cleanup
        
        try:
            timestamps = json.loads(timestamps_json)
            logger.info(f"Processing {len(timestamps)} low attention periods")
            
            # Save and validate input file
            input_filename, input_path = self._create_temp_file('.webm')
            try:
                with open(input_path, 'wb') as f:
                    audio_content = audio_file.read()
                    f.write(audio_content)
                temp_files.append(input_path)
                logger.info(f"Saved input file: {input_path}")
            except Exception as e:
                logger.error(f"Error saving input file: {e}")
                raise HTTPException(status_code=500, detail="Failed to save audio file")
            
            # Verify file type and size
            file_type = magic.from_file(input_path, mime=True)
            file_size = os.path.getsize(input_path)
            logger.info(f"Input file: type={file_type}, size={file_size/1024:.2f}KB")
            
            if file_size == 0:
                raise ValueError("Input file is empty")
            
            # Allow both audio/webm and video/webm (since browser might send either)
            if not (file_type.startswith('audio/') or file_type.startswith('video/')):
                raise ValueError(f"Invalid file type: {file_type}")

            # Create output file
            output_filename, output_path = self._create_temp_file('.mp3')
            temp_files.append(output_path)

            try:
                # Extract audio from WebM and convert to MP3
                logger.info("Starting FFmpeg conversion")
                result = subprocess.run([
                    'ffmpeg',
                    '-y',              # Overwrite output
                    '-i', input_path,  # Input
                    '-vn',            # No video
                    '-acodec', 'libmp3lame',  # MP3 codec
                    '-ar', '44100',   # Sample rate
                    '-ac', '2',       # Stereo
                    '-b:a', '192k',   # Bitrate
                    output_path  # Output
                ], capture_output=True, text=True, check=True, timeout=30)
                
                logger.info(f"FFmpeg stdout: {result.stdout}")
                if result.stderr:
                    logger.info(f"FFmpeg stderr: {result.stderr}")

                # Verify output file
                if not os.path.exists(output_path):
                    raise FileNotFoundError("Output file not created")
                
                output_size = os.path.getsize(output_path)
                if output_size == 0:
                    raise ValueError("Output file is empty")
                
                logger.info(f"Conversion successful. Output size: {output_size/1024:.2f}KB")

                # Load and validate converted audio
                audio = AudioSegment.from_mp3(output_path)
                if len(audio) == 0:
                    raise ValueError("Converted audio is empty")
                
                logger.info(f"Audio loaded successfully: {len(audio)/1000:.2f}s, {audio.frame_rate}Hz")

                # Process segments
                segments = self._extract_segments(audio, timestamps)
                if not segments:
                    return ["No valid audio segments found for analysis."]

                summaries = await self._get_summaries(segments)
                return summaries

            except subprocess.TimeoutExpired:
                logger.error("FFmpeg conversion timed out")
                raise HTTPException(status_code=500, detail="Audio conversion timed out")
            except subprocess.CalledProcessError as e:
                logger.error(f"FFmpeg error: {e.stderr}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Audio conversion failed: {e.stderr}"
                )

        except Exception as e:
            logger.error(f"Processing error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        
        finally:
            # Cleanup temporary files
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.chmod(temp_file, 0o666)  # Ensure we have permission to delete
                        os.unlink(temp_file)
                        logger.info(f"Cleaned up: {temp_file}")
                except Exception as e:
                    logger.warning(f"Failed to cleanup {temp_file}: {e}")

    def _extract_segments(self, audio: AudioSegment, timestamps: List[Dict]) -> List[AudioSegment]:
        segments = []
        audio_length_ms = len(audio)
        
        if audio_length_ms == 0:
            return []

        for period in timestamps:
            start_ms = int(period['timestamp'] * 1000)
            # Calculate start and end of the segment
            segment_start = max(0, start_ms - 15000)
            segment_end = min(audio_length_ms, start_ms + 15000)
            
            # Ensure segment is within audio bounds
            if segment_start < segment_end:
                segment = audio[segment_start:segment_end]
                segments.append(segment)
        
        # Handle case where audio is less than 30 seconds
        if audio_length_ms < 30000:
            segments = [audio]
        
        return segments

    async def _get_summaries(self, segments: List[AudioSegment]) -> List[str]:
        summaries = []
        for i, segment in enumerate(segments):
            try:
                logger.info(f"Processing segment {i+1}/{len(segments)}")
                segment_start = time.time()
                
                filename, filepath = self._create_temp_file('.mp3')
                try:
                    logger.info(f"Exporting segment {i+1} to {filepath}")
                    segment.export(
                        filepath,
                        format='mp3',
                        parameters=["-acodec", "libmp3lame", "-q:a", "2"]
                    )
                    
                    if os.path.getsize(filepath) == 0:
                        raise ValueError(f"Exported segment {i+1} is empty")

                    logger.info(f"Uploading segment {i+1} to Gemini")
                    audio_file = genai.upload_file(filepath)
                    
                    logger.info(f"Getting analysis for segment {i+1}")
                    try:
                        response = self.model.generate_content([
                            audio_file,
                            "Summarize this audio segment from a focused study session. "
                            "Provide insights on the content discussed and filter out any noticeable distractions or background noises. "
                            "This will help the user understand content they may have missed due to low attention."
                        ])
                        # Handle response directly
                        response.resolve()  # Ensure generation is complete
                        summaries.append(response.text)
                        logger.info(f"Successfully got analysis for segment {i+1}")
                    except Exception as e:
                        logger.error(f"Gemini API error: {str(e)}")
                        summaries.append(f"Error analyzing segment {i + 1}: API error")
                    
                    logger.info(f"Segment {i+1} processed in {time.time() - segment_start:.2f}s")

                finally:
                    try:
                        if os.path.exists(filepath):
                            os.chmod(filepath, 0o666)
                            os.unlink(filepath)
                            logger.info(f"Cleaned up segment file: {filepath}")
                    except Exception as e:
                        logger.warning(f"Failed to cleanup segment file {filepath}: {e}")

            except Exception as e:
                logger.error(f"Error processing segment {i+1}: {str(e)}")
                summaries.append(f"Could not analyze segment {i + 1}: {str(e)}")
        
        return summaries if summaries else ["No audio segments could be analyzed"]

    def _transcribe_audio(self, segment: AudioSegment) -> str:
        # Remove this method as it's no longer needed
        pass