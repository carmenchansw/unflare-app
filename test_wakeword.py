import openwakeword
from openwakeword.model import Model
import pyaudio
import numpy as np

# Download and load pre-trained openWakeWord models (e.g., 'hey_jarvis', 'alexa')
openwakeword.utils.download_models()
owwModel = Model(inference_framework="onnx")

# Set up audio streaming from computer microphone
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1280

audio = pyaudio.PyAudio()
mic_stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

print("\n--- Listening for default wake words (e.g., 'hey jarvis', 'alexa'). Speak into your mic! ---\n")

while True:
    # Get audio chunk from microphone
    audio_data = np.frombuffer(mic_stream.read(CHUNK), dtype=np.int16)

    # Feed audio frame to openWakeWord
    prediction = owwModel.predict(audio_data)

    # Check detection scores
    for model_name, score in owwModel.prediction_buffer.items():
        if score[-1] > 0.5:  # Detection threshold (0.0 to 1.0)
            print(f"🔥 WAKE WORD DETECTED: {model_name} (Score: {score[-1]:.2f})")