old_str = """@api_router.get("/auth/login/google")
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
    }"""

new_str = """@api_router.get("/auth/login/google")
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
    }"""

old_str2 = """@api_router.get("/auth/callback/google")
async def callback_google(code: str, state: str = "/dashboard"):
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    
    callback_uri = f"{BACKEND_URL}/api/auth/callback/google" """

old_str2 = old_str2.strip()

new_str2 = """@api_router.get("/auth/callback/google")
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
    
    callback_uri = f"{inferred_backend_url}/api/auth/callback/google" """
new_str2 = new_str2.strip()

with open("backend/server.py", "r") as f:
    c = f.read()

c = c.replace(old_str, new_str)
c = c.replace(old_str2, new_str2)

with open("backend/server.py", "w") as f:
    f.write(c)
