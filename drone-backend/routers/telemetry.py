from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..simulator import run_telemetry_loop

router = APIRouter()

@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to real-time stream.")
    try:
        await run_telemetry_loop(websocket)
    except WebSocketDisconnect:
        print("Client disconnected from stream.")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        try:
            await websocket.close()
        except:
            pass
