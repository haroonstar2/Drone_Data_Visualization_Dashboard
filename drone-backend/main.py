from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello from your new FastAPI Backend!"}

@app.get("/api/status")
async def get_status():
    return {
        "status": "OK",
        "droneConnected": True,
        "backend_language": "Python"
    }