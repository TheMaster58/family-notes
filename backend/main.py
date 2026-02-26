from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
from database import engine, create_db_and_tables, get_session, Note
import datetime
import subprocess
import json
from fastapi import Request
import functools
import time

# Simple cache for Tailscale lookups: {ip: (device_name, expiry)}
TS_CACHE = {}
CACHE_TTL = 300  # 5 minutes


app = FastAPI(title="Family Notes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_device_name(ip: str) -> str:
    now = time.time()
    if ip in TS_CACHE:
        device, expiry = TS_CACHE[ip]
        if now < expiry:
            return device

    try:
        # Run tailscale whois --json <ip>
        res = subprocess.run(["tailscale", "whois", "--json", ip], capture_output=True, text=True, timeout=2)
        if res.returncode == 0 and res.stdout:
            data = json.loads(res.stdout)
            # Use hostname
            device = data.get("Node", {}).get("Hostinfo", {}).get("Hostname", "")
            TS_CACHE[ip] = (device, now + CACHE_TTL)
            return device
    except Exception as e:
        print(f"Tailscale lookup error: {e}")
    
    return f"Unknown ({ip})"

def get_current_user(
    request: Request,
    tailscale_user: Optional[str] = Header(None, alias="Tailscale-User-Name"),
    x_real_ip: Optional[str] = Header(None, alias="X-Real-IP")
):
    # 1. Use Tailscale headers if present
    if tailscale_user:
        return tailscale_user
    
    # 2. Check X-Real-IP (passed by Nginx)
    if x_real_ip:
        return get_device_name(x_real_ip)
    
    # 3. Fallback to client host if direct connection
    if request.client:
        return get_device_name(request.client.host)

    return "Guest"

@app.get("/notes", response_model=List[Note])
def read_notes(session: Session = Depends(get_session)):
    notes = session.exec(select(Note).order_by(Note.timestamp.desc())).all()
    return notes

@app.post("/notes", response_model=Note)
def create_note(note_data: Note, session: Session = Depends(get_session), user: str = Depends(get_current_user)):
    note_data.author = user
    note_data.timestamp = datetime.datetime.utcnow()
    session.add(note_data)
    session.commit()
    session.refresh(note_data)
    return note_data

@app.get("/")
def read_root():
    return {"message": "Family Notes API is running"}
