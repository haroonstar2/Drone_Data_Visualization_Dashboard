from sqlmodel import SQLModel, Field, Relationship, create_engine, Session
from typing import List, Optional

# Table Definitions

# Flight Plan (parent table)
class FlightPlan(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    description: str
    last_modified: str
    waypoints: List["Waypoint"] = Relationship(back_populates="plan")

# Waypoint (child table)
class Waypoint(SQLModel, table=True):
    id: str = Field(primary_key=True)
    latitude: float
    longitude: float
    altitude: float
    action: str
    hover_duration: Optional[int] = None
    order: int

    # Links this waypoint to a specific plan
    plan_id: str = Field(foreign_key="flightplan.id")
    plan: Optional[FlightPlan] = Relationship(back_populates="waypoints")


class Mission(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    date: str
    duration_seconds: int = 0

    logs: List["MissionLog"] = Relationship(back_populates="mission")

class MissionLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    timestamp: str
    level: str
    message: str

    mission_id: str = Field(foreign_key="mission.id")
    mission: Optional[Mission] = Relationship(back_populates="logs")

# Database setup
SQLITE_FILE_NAME = "mission_control.db"
sqlite_url = f"sqlite:///{SQLITE_FILE_NAME}"

# The engine responsible for communicating with the file
# connect_args check_same_thread=False is needed for SQLite with FastAPI
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    # Creates the .db file and tables if they don't exist
    SQLModel.metadata.create_all(engine)

def get_session():
    # Dependency for FastAPI to get a DB session
    with Session(engine) as session:
        yield session
