AIM:
I want to create an application that will run on a raspberrypi connected to my home wifi.

I can access it through telnet using tailscale from anywhere on earth.

This can be a website to store my notes, collective notes for other family members, reminders for me or any other member of the family or for everyone in the family.

Roadmap:

Phase 1: The Foundation (The "Bones")

App runs on port 8000

Nginx reverse proxy on port 80

Systemd service to auto-start app

SQLite DB file stored locally

Authentication by IP: Instead of annoying passwords, use the Tailscale Header to identify users. If the request comes from "Dad's Phone," the app automatically knows it's you.

The "Global Wall": A single, shared markdown-based note page where anyone can type anything.

Tech stack:
FastAPI + SQLite + Simple React