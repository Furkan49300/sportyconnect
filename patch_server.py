old_str = """@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = resp.json()
    email = data.get("email")
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token", str(uuid.uuid4()))
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
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc"""

new_str = """from urllib.parse import urlencode
from fastapi.responses import RedirectResponse

@api_router.get("/auth/login/google")
async def login_google(redirect: str = "/dashboard"):
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")
    
    callback_uri = f"{BACKEND_URL}/api/auth/callback/google"
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
async def callback_google(code: str, state: str = "/dashboard"):
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    
    callback_uri = f"{BACKEND_URL}/api/auth/callback/google"
    
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
    
    # Optional URL safety: avoid returning inside backend domain if state is fully qualified by mistake
    frontend_redirect_url = f"{FRONTEND_URL}{state}"
    
    response = RedirectResponse(url=frontend_redirect_url)
    # The frontend is mostly on localhost:3000 via CORS, so Set-Cookie must be loose enough.
    # We use samesite=lax and Path=/ for cross-origin or local requests (or None if https).
    is_secure = FRONTEND_URL.startswith("https")
    samesite_policy = "none" if is_secure else "lax"
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=is_secure,
        samesite=samesite_policy,
        path="/",
        max_age=7 * 24 * 3600
    )
    return response"""

with open("backend/server.py", "r") as f:
    code = f.read()

code = code.replace(old_str, new_str)

with open("backend/server.py", "w") as f:
    f.write(code)

print("Backend patched")
