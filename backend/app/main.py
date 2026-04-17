# Main FastAPI application entry point
from fastapi import FastAPI

app = FastAPI(title="CrowdControl API")

@app.get("/")
def read_root():
    return {"message": "Welcome to CrowdControl API"}
