from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, WebSocket, WebSocketDisconnect, Depends
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import uuid
import aiofiles
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Constants ───
SPORTS = ["Tennis", "Football", "Futsal", "Basketball", "Volleyball", "Cyclisme", "Course à pied", "Badminton", "Padel", "Escalade", "Randonnée"]
LEVELS = ["Débutant", "Amateur", "Intermédiaire", "Avancé", "Expert"]

# ─── Pydantic Models ───
class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    age: Optional[int] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    favorite_sports: List[str] = []
    athletic_level: str = "Débutant"
    created_at: str = ""

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    favorite_sports: Optional[List[str]] = None
    athletic_level: Optional[str] = None

class ActivityCreate(BaseModel):
    sport: str
    title: str
    description: str
    location: str
    city: str
    date: str
    time: str
    max_participants: int = 10
    required_level: str = "Débutant"
    image_url: Optional[str] = None

class ActivityOut(BaseModel):
    activity_id: str
    creator_id: str
    creator_name: str = ""
    creator_picture: str = ""
    sport: str
    title: str
    description: str
    location: str
    city: str
    date: str
    time: str
    max_participants: int
    required_level: str
    image_url: str = ""
    participants: List[str] = []
    participant_count: int = 0
    status: str = "active"
    created_at: str = ""

class MessageOut(BaseModel):
    message_id: str
    activity_id: str
    user_id: str
    user_name: str
    user_picture: str
    content: str
    created_at: str

class RatingCreate(BaseModel):
    rated_id: str
    score: int
    comment: Optional[str] = None

class RatingOut(BaseModel):
    rating_id: str
    activity_id: str
    rater_id: str
    rater_name: str = ""
    rated_id: str
    rated_name: str = ""
    score: int
    comment: str = ""
    created_at: str = ""

# ─── Auth Helper ───
async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return user_doc

# ─── Auth Routes ───
from urllib.parse import urlencode
from fastapi.responses import RedirectResponse

@api_router.get("/auth/login/google")
async def login_google(request: Request, redirect: str = "/dashboard"):
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    
    # Infer base URL from the incoming request (useful if accessed via IP rather than localhost)
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", request.url.netloc)
    inferred_backend_url = f"{scheme}://{host}"
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")
    
    callback_uri = f"{inferred_backend_url}/api/auth/callback/google"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": callback_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": redirect,
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)

@api_router.get("/auth/callback/google")
async def callback_google(request: Request, code: str, state: str = "/dashboard"):
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", request.url.netloc)
    inferred_backend_url = f"{scheme}://{host}"
    
    # Infer frontend url from the backend domain but parsing to port 3000 (unless set via env)
    host_without_port = host.split(':')[0]
    inferred_frontend_url = os.environ.get("FRONTEND_URL", f"{scheme}://{host_without_port}:3000")
    FRONTEND_URL = inferred_frontend_url
    
    callback_uri = f"{inferred_backend_url}/api/auth/callback/google"
    
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": callback_uri
    }
    
    async with httpx.AsyncClient() as http_client:
        token_resp = await http_client.post("https://oauth2.googleapis.com/token", data=data)
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google token")
        
        access_token = token_resp.json().get("access_token")
        
        user_info_resp = await http_client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user profile")
            
        user_info = user_info_resp.json()
        
    email = user_info.get("email")
    name = user_info.get("name", "")
    picture = user_info.get("picture", "")
    session_token = str(uuid.uuid4())
    
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "age": None,
            "city": None,
            "bio": None,
            "favorite_sports": [],
            "athletic_level": "Beginner",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    frontend_redirect_url = f"{FRONTEND_URL}{state}"
    response = RedirectResponse(url=frontend_redirect_url)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600
    )
    return response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ─── User Routes ───
@api_router.put("/users/profile")
async def update_profile(update: UserProfileUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

@api_router.post("/users/upload-photo")
async def upload_profile_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{user['user_id']}_profile.{ext}"
    filepath = UPLOAD_DIR / filename
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    photo_url = f"/api/uploads/{filename}"
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"picture": photo_url}})
    return {"picture": photo_url}

@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

# ─── Activity Routes ───
@api_router.post("/activities")
async def create_activity(activity: ActivityCreate, user: dict = Depends(get_current_user)):
    activity_id = f"act_{uuid.uuid4().hex[:12]}"
    doc = {
        "activity_id": activity_id,
        "creator_id": user["user_id"],
        "creator_name": user.get("name", ""),
        "creator_picture": user.get("picture", ""),
        "sport": activity.sport,
        "title": activity.title,
        "description": activity.description,
        "location": activity.location,
        "city": activity.city,
        "date": activity.date,
        "time": activity.time,
        "max_participants": activity.max_participants,
        "required_level": activity.required_level,
        "image_url": activity.image_url or "",
        "participants": [user["user_id"]],
        "participant_count": 1,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.activities.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/activities")
async def list_activities(
    sport: Optional[str] = None,
    city: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = "active",
    page: int = 1,
    limit: int = 12
):
    query = {}
    if sport:
        query["sport"] = sport
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if date:
        query["date"] = date
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    total = await db.activities.count_documents(query)
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "activities": activities,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total > 0 else 1
    }

@api_router.get("/activities/{activity_id}")
async def get_activity(activity_id: str):
    doc = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Activity not found")
    participant_ids = doc.get("participants", [])
    participants = []
    if participant_ids:
        participants = await db.users.find({"user_id": {"$in": participant_ids}}, {"_id": 0}).to_list(100)
    doc["participants_details"] = participants
    return doc

@api_router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, activity: ActivityCreate, user: dict = Depends(get_current_user)):
    existing = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")
    if existing["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = activity.model_dump()
    await db.activities.update_one({"activity_id": activity_id}, {"$set": update_data})
    updated = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    return updated

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, user: dict = Depends(get_current_user)):
    existing = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")
    if existing["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.activities.delete_one({"activity_id": activity_id})
    await db.messages.delete_many({"activity_id": activity_id})
    return {"message": "Activity deleted"}

# ─── Participant Routes ───
@api_router.post("/activities/{activity_id}/join")
async def join_activity(activity_id: str, user: dict = Depends(get_current_user)):
    activity = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if user["user_id"] in activity.get("participants", []):
        raise HTTPException(status_code=400, detail="Already joined")
    if activity.get("participant_count", 0) >= activity.get("max_participants", 10):
        raise HTTPException(status_code=400, detail="Activity is full")
    await db.activities.update_one(
        {"activity_id": activity_id},
        {"$push": {"participants": user["user_id"]}, "$inc": {"participant_count": 1}}
    )
    return {"message": "Joined successfully"}

@api_router.delete("/activities/{activity_id}/leave")
async def leave_activity(activity_id: str, user: dict = Depends(get_current_user)):
    activity = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if user["user_id"] not in activity.get("participants", []):
        raise HTTPException(status_code=400, detail="Not a participant")
    if activity["creator_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Creator cannot leave")
    await db.activities.update_one(
        {"activity_id": activity_id},
        {"$pull": {"participants": user["user_id"]}, "$inc": {"participant_count": -1}}
    )
    return {"message": "Left successfully"}

@api_router.get("/activities/{activity_id}/participants")
async def get_participants(activity_id: str):
    activity = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    participant_ids = activity.get("participants", [])
    if not participant_ids:
        return []
    participants = await db.users.find({"user_id": {"$in": participant_ids}}, {"_id": 0}).to_list(100)
    return participants

# ─── Chat / Messages Routes ───
@api_router.get("/activities/{activity_id}/messages")
async def get_messages(activity_id: str, limit: int = 50):
    messages = await db.messages.find(
        {"activity_id": activity_id}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    messages.reverse()
    return messages

@api_router.post("/activities/{activity_id}/messages")
async def post_message(activity_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content required")
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "activity_id": activity_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_picture": user.get("picture", ""),
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    # Broadcast to WebSocket connections
    if activity_id in ws_connections:
        dead = []
        for ws in ws_connections[activity_id]:
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            ws_connections[activity_id].discard(ws)
    return msg

# ─── Rating Routes ───
@api_router.post("/activities/{activity_id}/rate")
async def rate_player(activity_id: str, rating: RatingCreate, user: dict = Depends(get_current_user)):
    activity = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if user["user_id"] not in activity.get("participants", []):
        raise HTTPException(status_code=403, detail="Only participants can rate")
    if rating.rated_id not in activity.get("participants", []):
        raise HTTPException(status_code=400, detail="Rated user not a participant")
    if rating.rated_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")
    if rating.score < 1 or rating.score > 5:
        raise HTTPException(status_code=400, detail="Score must be 1-5")
    existing = await db.ratings.find_one({
        "activity_id": activity_id,
        "rater_id": user["user_id"],
        "rated_id": rating.rated_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already rated this player")
    rated_user = await db.users.find_one({"user_id": rating.rated_id}, {"_id": 0})
    doc = {
        "rating_id": f"rat_{uuid.uuid4().hex[:12]}",
        "activity_id": activity_id,
        "rater_id": user["user_id"],
        "rater_name": user.get("name", ""),
        "rated_id": rating.rated_id,
        "rated_name": rated_user.get("name", "") if rated_user else "",
        "score": rating.score,
        "comment": rating.comment or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ratings.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/activities/{activity_id}/ratings")
async def get_ratings(activity_id: str):
    ratings = await db.ratings.find({"activity_id": activity_id}, {"_id": 0}).to_list(100)
    return ratings

@api_router.get("/users/{user_id}/ratings")
async def get_user_ratings(user_id: str):
    ratings = await db.ratings.find({"rated_id": user_id}, {"_id": 0}).to_list(100)
    if not ratings:
        return {"average": 0, "count": 0, "ratings": []}
    avg = sum(r["score"] for r in ratings) / len(ratings)
    return {"average": round(avg, 1), "count": len(ratings), "ratings": ratings}

# ─── File Upload Route ───
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = UPLOAD_DIR / filename
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    return {"url": f"/api/uploads/{filename}"}

# ─── Utility Routes ───
@api_router.get("/sports")
async def get_sports():
    return {"sports": SPORTS}

@api_router.get("/levels")
async def get_levels():
    return {"levels": LEVELS}

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    created = await db.activities.find(
        {"creator_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    joined = await db.activities.find(
        {"participants": user["user_id"], "creator_id": {"$ne": user["user_id"]}}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    ratings_data = await db.ratings.find({"rated_id": user["user_id"]}, {"_id": 0}).to_list(100)
    avg_rating = round(sum(r["score"] for r in ratings_data) / len(ratings_data), 1) if ratings_data else 0
    return {
        "created_activities": created,
        "joined_activities": joined,
        "total_created": len(created),
        "total_joined": len(joined),
        "average_rating": avg_rating,
        "total_ratings": len(ratings_data)
    }

# ─── WebSocket for Real-time Chat ───
ws_connections: dict[str, set] = {}

@app.websocket("/api/ws/{activity_id}")
async def websocket_endpoint(websocket: WebSocket, activity_id: str):
    await websocket.accept()
    if activity_id not in ws_connections:
        ws_connections[activity_id] = set()
    ws_connections[activity_id].add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_data = json.loads(data)
                msg = {
                    "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                    "activity_id": activity_id,
                    "user_id": msg_data.get("user_id", ""),
                    "user_name": msg_data.get("user_name", ""),
                    "user_picture": msg_data.get("user_picture", ""),
                    "content": msg_data.get("content", ""),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.messages.insert_one(msg)
                msg.pop("_id", None)
                dead = []
                for ws in ws_connections[activity_id]:
                    try:
                        await ws.send_json(msg)
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    ws_connections[activity_id].discard(ws)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_connections[activity_id].discard(websocket)
        if not ws_connections[activity_id]:
            del ws_connections[activity_id]

# ─── Serve uploads ───
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)         