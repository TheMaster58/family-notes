from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
from database import engine, create_db_and_tables, get_session, Note
import datetime

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

def get_current_user(tailscale_user: Optional[str] = Header(None, alias="Tailscale-User-Name")):
    # For local development without Tailscale, we can fallback to a default
    if not tailscale_user:
        return "Guest"
    return tailscale_user

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
