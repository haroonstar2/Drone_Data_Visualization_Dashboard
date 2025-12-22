# Run using fastapi dev *name*
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Allows the frontend to make requests to the backend
from contextlib import asynccontextmanager

from .database import create_db_and_tables
from .routers import commands, settings, plans, missions, telemetry

import os

# Default port for Vite. Change if needed
VITE_PORT = int(os.environ.get("VITE_PORT", 5173)) 

# Lifespan context handles startup and shutdown automatically
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create the database tables
    create_db_and_tables()
    print("Startup: Database tables created/verified.")
    yield # Let the server run continuously unless stopped

    # Shutdown logic should go here 

# Initialize backend router
app = FastAPI(lifespan=lifespan)

# List of origins that are allowed to make requests
origins = [
    f"http://localhost:{VITE_PORT}",
    f"http://127.0.0.1:{VITE_PORT}"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # List of allowed origins
    allow_credentials=True,      # Allow cookies/auth headers
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST)
    allow_headers=["*"],         # Allow all headers
)

# Include routers
app.include_router(commands)
app.include_router(settings)
app.include_router(plans)
app.include_router(missions)
app.include_router(telemetry)
