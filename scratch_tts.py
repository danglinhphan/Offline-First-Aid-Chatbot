import os
import sherpa_onnx

import ctypes
from ctypes import wintypes

def get_short_path_name(long_name_path):
    if os.name != 'nt':
        return long_name_path
    try:
        _GetShortPathNameW = ctypes.windll.kernel32.GetShortPathNameW
        _GetShortPathNameW.argtypes = [wintypes.LPCWSTR, wintypes.LPWSTR, wintypes.DWORD]
        _GetShortPathNameW.restype = wintypes.DWORD
        buf = ctypes.create_unicode_buffer(1024)
        abs_path = os.path.abspath(long_name_path)
        length = _GetShortPathNameW(abs_path, buf, 1024)
        if length > 0:
            return buf.value
    except Exception:
        pass
    return long_name_path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
tts_dir = get_short_path_name(os.path.join(MODELS_DIR, "speech", "vits-vi"))

model_path = ""
lexicon = os.path.join(tts_dir, "lexicon.txt")
tokens = os.path.join(tts_dir, "tokens.txt")
data_dir = tts_dir

for f in os.listdir(tts_dir):
    if f.endswith(".onnx"):
        model_path = os.path.join(tts_dir, f)
        break

print("model_path:", model_path)
print("tokens exists:", os.path.exists(tokens))
print("data_dir exists:", os.path.exists(data_dir))
print("data_dir path:", data_dir)

vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
    model=model_path,
    lexicon="",
    tokens=tokens,
    data_dir=data_dir,
    noise_scale=0.667,
    noise_scale_w=0.8,
    length_scale=1.0,
)
print("Attributes of vits_config:")
for attr in dir(vits_config):
    if not attr.startswith("__"):
        print(f"  {attr}: {getattr(vits_config, attr)}")

model_config = sherpa_onnx.OfflineTtsModelConfig(
    vits=vits_config,
    num_threads=4,
    debug=True,
)
config = sherpa_onnx.OfflineTtsConfig(
    model=model_config,
    rule_fsts="",
    max_num_sentences=1,
)

print("Initializing OfflineTts...")
try:
    tts = sherpa_onnx.OfflineTts(config)
    print("Success!")
except Exception as e:
    print("Error:", e)
