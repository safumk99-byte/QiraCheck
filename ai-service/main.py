"""Local Quran-specific Arabic speech-to-text service; not a Tajweed grader."""
from __future__ import annotations
import os, tempfile
from pathlib import Path
from threading import Lock
from typing import Any
import av
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from huggingface_hub import hf_hub_download
from pydantic import BaseModel

MAX_AUDIO_BYTES=12*1024*1024
ALLOWED_SUFFIXES={".webm",".ogg",".wav",".mp3",".m4a",".mp4",".aac",".flac",".mpeg"}
MODEL_REPO=os.getenv("ASR_MODEL_REPO","Abdou/quran-asr-small")
MODEL_CACHE=os.getenv("ASR_MODEL_CACHE","") or None
NUM_THREADS=max(1,min(4,int(os.getenv("ASR_NUM_THREADS","2"))))
app=FastAPI(title="Quran Recitation Local ASR",version="0.2.0")
_recognizer:Any|None=None
_model_lock=Lock()

class HealthResponse(BaseModel):
    ok:bool
    model:str
    loaded:bool
    purpose:str="Quran-specific Arabic speech-to-text draft only; no independent tajweed grading"

def get_recognizer()->Any:
    global _recognizer
    if _recognizer is None:
        with _model_lock:
            if _recognizer is None:
                try:
                    import sherpa_onnx
                    model=hf_hub_download(repo_id=MODEL_REPO,filename="model.int8.onnx",cache_dir=MODEL_CACHE)
                    tokens=hf_hub_download(repo_id=MODEL_REPO,filename="tokens.txt",cache_dir=MODEL_CACHE)
                    _recognizer=sherpa_onnx.OfflineRecognizer.from_zipformer_ctc(model=model,tokens=tokens,num_threads=NUM_THREADS)
                except Exception as exc:
                    raise HTTPException(status_code=503,detail="Could not load the Quran ASR model. Check model download and ai-service requirements.") from exc
    return _recognizer

def decode_audio_16k_mono(path:str)->np.ndarray:
    chunks:list[np.ndarray]=[]
    try:
        with av.open(path) as container:
            if not container.streams.audio: raise ValueError("No audio stream")
            resampler=av.AudioResampler(format="fltp",layout="mono",rate=16000)
            for frame in container.decode(audio=0):
                converted=resampler.resample(frame)
                if converted is None: continue
                if not isinstance(converted,list): converted=[converted]
                for out in converted: chunks.append(out.to_ndarray().reshape(-1).astype(np.float32,copy=False))
            flushed=resampler.resample(None)
            if flushed is not None:
                if not isinstance(flushed,list): flushed=[flushed]
                for out in flushed: chunks.append(out.to_ndarray().reshape(-1).astype(np.float32,copy=False))
    except Exception as exc: raise ValueError("Could not decode audio. Record a new browser clip.") from exc
    if not chunks: raise ValueError("No audio samples found")
    samples=np.concatenate(chunks).astype(np.float32,copy=False)
    if samples.size<1600: raise ValueError("Audio is too short; record at least 0.1 seconds")
    return np.nan_to_num(samples,nan=0.0,posinf=0.0,neginf=0.0)

@app.get("/health",response_model=HealthResponse)
def health()->HealthResponse: return HealthResponse(ok=True,model=MODEL_REPO,loaded=_recognizer is not None)

@app.post("/transcribe")
async def transcribe(audio:UploadFile=File(...))->dict[str,str]:
    suffix=Path(audio.filename or "recitation.webm").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES: raise HTTPException(status_code=415,detail="Unsupported audio format.")
    data=await audio.read(MAX_AUDIO_BYTES+1)
    if not data: raise HTTPException(status_code=400,detail="Audio file is empty.")
    if len(data)>MAX_AUDIO_BYTES: raise HTTPException(status_code=413,detail="Audio is too large. Maximum size is 12 MB.")
    path=None
    try:
        with tempfile.NamedTemporaryFile(prefix="qira-",suffix=suffix,delete=False) as tmp: tmp.write(data);path=tmp.name
        waveform=decode_audio_16k_mono(path)
        recognizer=get_recognizer();stream=recognizer.create_stream();stream.accept_waveform(16000,waveform);recognizer.decode_stream(stream)
        text=" ".join(stream.result.text.replace("▁"," ").split())
        if not text: raise HTTPException(status_code=422,detail="No speech could be recognized.")
        return {"text":text[:5000],"model":MODEL_REPO,"language":"ar"}
    except HTTPException: raise
    except ValueError as exc: raise HTTPException(status_code=422,detail=str(exc)) from exc
    except Exception as exc: raise HTTPException(status_code=422,detail="Could not transcribe this clip. Try a clearer or shorter recording.") from exc
    finally:
        if path:
            try: os.unlink(path)
            except OSError: pass
        await audio.close()
