# Router package for backend
from .commands import router as commands
from .settings import router as settings
from .plans import router as plans
from .missions import router as missions
from .telemetry import router as telemetry

__all__ = ["commands","settings","plans","missions","telemetry"]
