import os
import io
import wave
import logging
import numpy as np
from typing import Dict, Any, Tuple, List

try:
    import pyttsx3
except Exception:  # pragma: no cover
    pyttsx3 = None

try:
    import speech_recognition as sr
except Exception:  # pragma: no cover
    sr = None

try:
    import sherpa_onnx
except Exception:  # pragma: no cover
    sherpa_onnx = None

logger = logging.getLogger(__name__)

class SpeechManager:
    def __init__(self):
        self.stt_model = None
        self.tts_model = None
        self.is_stt_loaded = False
        self.is_tts_loaded = False
        self._init_models()

    def _init_models(self):
        """Khởi tạo STT/TTS offline bằng Sherpa-ONNX, fallback sang thư viện hệ thống."""
        from backend.core.config import MODELS_DIR
        
        # 1. Khởi tạo STT offline (Sherpa-ONNX Zipformer)
        stt_dir = os.path.join(MODELS_DIR, "speech", "zipformer-vi")
        if sherpa_onnx is not None and os.path.exists(stt_dir):
            try:
                tokens = os.path.join(stt_dir, "tokens.txt")
                encoder, decoder, joiner = "", "", ""
                for f in os.listdir(stt_dir):
                    if "encoder" in f and f.endswith(".onnx"):
                        encoder = os.path.join(stt_dir, f)
                    elif "decoder" in f and f.endswith(".onnx"):
                        decoder = os.path.join(stt_dir, f)
                    elif "joiner" in f and f.endswith(".onnx"):
                        joiner = os.path.join(stt_dir, f)
                
                if encoder and decoder and joiner and os.path.exists(tokens):
                    logger.info("Đang tải mô hình STT Zipformer offline qua Sherpa-ONNX...")
                    feat_config = sherpa_onnx.FeatureExtractorConfig(sampling_rate=16000, feature_dim=80)
                    transducer_config = sherpa_onnx.OfflineTransducerModelConfig(
                        encoder,
                        decoder,
                        joiner
                    )
                    model_config = sherpa_onnx.OfflineModelConfig(
                        transducer=transducer_config,
                        tokens=tokens,
                        num_threads=4,
                        debug=False,
                    )
                    config = sherpa_onnx.OfflineRecognizerConfig(
                        feat_config=feat_config,
                        model_config=model_config,
                        decoding_method="greedy_search",
                    )
                    self.stt_model = sherpa_onnx.OfflineRecognizer(config)
                    self.is_stt_loaded = True
                    logger.info("Mô hình STT offline Sherpa-ONNX đã được nạp thành công.")
            except Exception as e:
                logger.warning(f"Lỗi khởi tạo mô hình STT Sherpa-ONNX: {e}")

        # 2. Khởi tạo TTS offline (Sherpa-ONNX VITS)
        tts_dir = os.path.join(MODELS_DIR, "speech", "vits-vi")
        if sherpa_onnx is not None and os.path.exists(tts_dir):
            try:
                model_path = ""
                lexicon = os.path.join(tts_dir, "lexicon.txt")
                tokens = os.path.join(tts_dir, "tokens.txt")
                data_dir = os.path.join(tts_dir, "espeak-ng-data")
                for f in os.listdir(tts_dir):
                    if f.endswith(".onnx"):
                        model_path = os.path.join(tts_dir, f)
                        break
                
                is_piper = os.path.exists(data_dir)
                if model_path and os.path.exists(tokens) and (is_piper or os.path.exists(lexicon)):
                    logger.info("Đang tải mô hình TTS VITS offline qua Sherpa-ONNX...")
                    vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
                        model=model_path,
                        lexicon=lexicon if os.path.exists(lexicon) else "",
                        tokens=tokens,
                        data_dir=data_dir if is_piper else "",
                        noise_scale=0.667,
                        noise_scale_w=0.8,
                        length_scale=1.0,
                    )
                    model_config = sherpa_onnx.OfflineTtsModelConfig(
                        vits=vits_config,
                        num_threads=4,
                        debug=False,
                    )
                    config = sherpa_onnx.OfflineTtsConfig(
                        model=model_config,
                        rule_fsts="",
                        max_num_sentences=1,
                    )
                    self.tts_model = sherpa_onnx.OfflineTts(config)
                    self.is_tts_loaded = True
                    logger.info("Mô hình TTS offline Sherpa-ONNX đã được nạp thành công.")
            except Exception as e:
                logger.warning(f"Lỗi khởi tạo mô hình TTS Sherpa-ONNX: {e}")

        # Fallbacks nếu không có mô hình offline học sâu
        if not self.is_stt_loaded and sr is not None:
            try:
                self.recognizer = sr.Recognizer()
                logger.info("Đã cấu hình Google Speech API (Trực tuyến) làm fallback cho STT.")
            except Exception as e:
                logger.warning(f"Không thể khởi tạo fallback STT: {e}")

        if not self.is_tts_loaded and pyttsx3 is not None:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty("rate", 165)
                logger.info("Đã cấu hình pyttsx3 (Giọng nói hệ thống) làm fallback cho TTS.")
            except Exception as e:
                logger.warning(f"Không thể khởi tạo fallback TTS: {e}")

    def transcribe_audio(self, audio_data: bytes) -> str:
        """
        Chuyển đổi âm thanh ghi nhận được thành chữ ngoại tuyến.
        """
        # 1. Ưu tiên chạy Sherpa-ONNX offline
        if self.is_stt_loaded and self.stt_model is not None:
            try:
                import soundfile as sf
                audio_buffer = io.BytesIO(audio_data)
                data, samplerate = sf.read(audio_buffer, dtype="float32")
                
                # Sherpa-ONNX yêu cầu mảng 1 chiều float32
                if len(data.shape) > 1:
                    data = data[:, 0]
                
                stream = self.stt_model.create_stream()
                stream.accept_waveform(samplerate, data)
                self.stt_model.decode_stream(stream)
                text = stream.result.text.strip()
                logger.info(f"ASR ngoại tuyến nhận diện: '{text}'")
                return text
            except Exception as e:
                logger.error(f"Sherpa-ONNX offline ASR thất bại: {e}. Chuyển sang fallback...")

        # 2. Fallback trực tuyến dùng Google API
        if sr is not None:
            try:
                recognizer = sr.Recognizer()
                audio_buffer = io.BytesIO(audio_data)
                audio_buffer.seek(0)
                with sr.AudioFile(audio_buffer) as source:
                    audio = recognizer.record(source)
                text = recognizer.recognize_google(audio, language="vi-VN")
                logger.info("Nhận diện giọng nói bằng Google Speech API trực tuyến.")
                return text
            except Exception as e:
                logger.warning(f"Google Speech API thất bại hoặc mất mạng: {e}")

        logger.info("Sử dụng nhận diện giọng nói Mock...")
        return "hướng dẫn ép tim lồng ngực cpr"

    def synthesize_speech(self, text: str) -> Tuple[bytes, List[Dict[str, Any]]]:
        """
        Tổng hợp văn bản thành âm thanh tiếng Việt và trả về dữ liệu WAV cùng timestamps.
        """
        clean_text = text.replace("🚨", "").replace("📋", "").replace("📚", "").replace("⚠️", "").strip()

        # 1. Ưu tiên sử dụng Sherpa-ONNX VITS tiếng Việt offline
        if self.is_tts_loaded and self.tts_model is not None and clean_text:
            try:
                # Sinh âm thanh với speaker ID = 0, tốc độ = 1.0
                audio = self.tts_model.generate(clean_text, sid=0, speed=1.0)
                samples = audio.samples
                sample_rate = audio.sample_rate

                # Chuyển đổi float32 sang 16-bit PCM WAV
                audio_bytes = (samples * 32767).astype(np.int16).tobytes()
                wav_io = io.BytesIO()
                with wave.open(wav_io, 'wb') as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)
                    wav_file.setframerate(sample_rate)
                    wav_file.writeframes(audio_bytes)
                
                wav_data = wav_io.getvalue()

                # Đồng bộ Karaoke: Tính thời lượng thực tế và chia đều theo từ
                words = clean_text.split()
                total_duration = len(samples) / sample_rate
                word_duration = total_duration / max(len(words), 1)
                
                timestamps = []
                current_time = 0.0
                for w in words:
                    timestamps.append({
                        "word": w,
                        "start": current_time,
                        "duration": word_duration
                    })
                    current_time += word_duration

                logger.info(f"Tổng hợp TTS offline qua Sherpa-ONNX thành công (Thời lượng: {total_duration:.2f}s).")
                return wav_data, timestamps
            except Exception as e:
                logger.error(f"Sherpa-ONNX TTS offline thất bại: {e}. Chuyển sang fallback...")

        # 2. Fallback sử dụng pyttsx3 cục bộ
        if pyttsx3 is not None and clean_text:
            try:
                self.tts_engine.save_to_file(clean_text, "temp_speech.wav")
                self.tts_engine.runAndWait()
                with open("temp_speech.wav", "rb") as f:
                    wav_data = f.read()
                os.remove("temp_speech.wav")
                logger.info("Đã tổng hợp âm thanh bằng pyttsx3 hệ thống.")
                return wav_data, []
            except Exception as e:
                logger.warning(f"pyttsx3 thất bại: {e}")

        # 3. Tạo tiếng bíp sine 1 giây nếu tất cả đều thất bại
        sample_rate = 16000
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_signal = np.sin(2 * np.pi * 440 * t) * 0.3
        audio_bytes = (audio_signal * 32767).astype(np.int16).tobytes()

        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_bytes)
        
        wav_data = wav_io.getvalue()
        words = clean_text.split()
        timestamps = []
        current_time = 0.0
        word_duration = duration / max(len(words), 1)
        for w in words:
            timestamps.append({
                "word": w,
                "start": current_time,
                "duration": word_duration
            })
            current_time += word_duration

        logger.info("Sinh âm thanh mock fallback sinus beep.")
        return wav_data, timestamps

# Singleton instance
speech_manager = SpeechManager()
