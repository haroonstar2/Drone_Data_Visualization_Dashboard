from fastapi import APIRouter
from ..models import CommandWrapper
import uuid, datetime

router = APIRouter()

# COMMAND: Sends an immediate instruction to the backend
@router.post("/api/v1/command")
async def post_commands(wrapper : CommandWrapper):

    command_data = wrapper.command
    # Generate a server-side ID for this command
    command_id = str(uuid.uuid4())

    command_name = command_data.name
    hover_duration = command_data.hover_duration

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    message = f"Received {command_name} successfully"
    print(f"Processing COMMAND: {command_name}, ID: {command_id}")

    return {
        "type": "COMMAND_RESPONSE",
        "status": "success",
        "message": message,
        "timestamp": date_string,
        "command_id": command_id,
        "data": command_data.model_dump(by_alias=True)
    }
