from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import base64
import warnings
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'freefire')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'rk212006')
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GMAIL_REDIRECT_URI = os.environ.get('GMAIL_REDIRECT_URI', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
# Search query used to find Garena / Free Fire recharge confirmation emails
GARENA_QUERY = 'Garena OR "Free Fire" OR diamond OR diamonds OR recharge OR "top up" OR codashop'

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Models ----------------
class Package(BaseModel):
    id: str
    name: str
    image: str
    price: float
    originalPrice: float
    tag: Optional[str] = ""

class Settings(BaseModel):
    productImage: str
    title: str
    rating: str
    ratingCount: Optional[str] = ""
    soldCount: str

class AdminLogin(BaseModel):
    username: str
    password: str

class OrderCreate(BaseModel):
    package_name: str
    uid: str
    quantity: int = 1
    total: float

# ---------------- Defaults (seed) ----------------
DEFAULT_PACKAGES = [
    {"id": "p1", "name": "EVO VAULT - one of the EVO Guns", "image": "https://img.lootbar.com/file/6a704cea477ed821a12c6eafKcFumR3d03?fop=imageView/2/w/340/h/340", "price": 11.25, "originalPrice": 12.5, "tag": "Hot"},
    {"id": "p2", "name": "BOOYAH PASS 50 Level Package", "image": "https://img.lootbar.com/file/6846ac3a4103a2e741d4df29vLW0rcHG03?fop=imageView/2/w/340/h/340", "price": 6.17, "originalPrice": 6.85, "tag": ""},
    {"id": "p3", "name": "100+10 Diamonds", "image": "https://img.lootbar.com/file/66dad2385bcd5dcccf249149UCmGWzPC03?fop=imageView/2/w/340/h/340", "price": 0.82, "originalPrice": 0.91, "tag": ""},
    {"id": "p4", "name": "310+31 Diamonds", "image": "https://img.lootbar.com/file/66dad319243d93be37a0c68bsOGJhFpw03?fop=imageView/2/w/340/h/340", "price": 2.3, "originalPrice": 2.55, "tag": ""},
    {"id": "p5", "name": "520+52 Diamonds", "image": "https://img.lootbar.com/file/66dad38a511befc0cea111c95pbxbPTi03?fop=imageView/2/w/340/h/340", "price": 3.87, "originalPrice": 4.3, "tag": "Popular"},
    {"id": "p6", "name": "1060+106 Diamonds", "image": "https://img.lootbar.com/file/66dad3cce4fffe79f93965924i0X7hAw03?fop=imageView/2/w/340/h/340", "price": 7.38, "originalPrice": 8.2, "tag": ""},
    {"id": "p7", "name": "2180+218 Diamonds", "image": "https://img.lootbar.com/file/66dad40d6d022e25d4932829egCbaMN703?fop=imageView/2/w/340/h/340", "price": 14.67, "originalPrice": 16.3, "tag": ""},
    {"id": "p8", "name": "5600+560 Diamonds", "image": "https://img.lootbar.com/file/66dad44b8ce4cfd72a97ee68tMW0piBg03?fop=imageView/2/w/340/h/340", "price": 35.1, "originalPrice": 39.0, "tag": "Best Value"},
]
DEFAULT_SETTINGS = {
    "_key": "main",
    "productImage": "https://img.lootbar.com/file/6a3e1c094f9de0e50fdbb275k9gzzrFk03",
    "title": "Free Fire Top Up",
    "rating": "5.0",
    "ratingCount": "40,068",
    "soldCount": "100k+ Sold",
}

# ---------------- Auth helpers ----------------
async def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def verify_admin(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Admin token required")
    sess = await db.admin_sessions.find_one({"admin_token": x_admin_token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    exp = sess["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Admin session expired")
    return True

# ---------------- Public routes ----------------
@api_router.get("/")
async def root():
    return {"message": "LootBar FF Clone API"}

@api_router.get("/packages", response_model=List[Package])
async def get_packages():
    docs = await db.packages.find({}, {"_id": 0}).sort("order", 1).to_list(1000)
    if not docs:
        for i, p in enumerate(DEFAULT_PACKAGES):
            await db.packages.insert_one({**p, "order": i})
        docs = DEFAULT_PACKAGES
    return [Package(**{k: d[k] for k in Package.model_fields}) for d in docs]

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    doc = await db.settings.find_one({"_key": "main"}, {"_id": 0})
    if not doc:
        await db.settings.insert_one(dict(DEFAULT_SETTINGS))
        doc = DEFAULT_SETTINGS
    return Settings(**{k: doc.get(k, "") for k in Settings.model_fields})

# ---------------- Admin routes ----------------
@api_router.post("/admin/login")
async def admin_login(body: AdminLogin):
    if body.username != ADMIN_USERNAME or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = f"admin_{uuid.uuid4().hex}"
    await db.admin_sessions.insert_one({
        "admin_token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
    })
    return {"admin_token": token}

@api_router.put("/admin/packages")
async def update_packages(packages: List[Package], _: bool = Depends(verify_admin)):
    await db.packages.delete_many({})
    for i, p in enumerate(packages):
        await db.packages.insert_one({**p.model_dump(), "order": i})
    return {"status": "ok", "count": len(packages)}

@api_router.put("/admin/settings")
async def update_settings(settings: Settings, _: bool = Depends(verify_admin)):
    await db.settings.update_one({"_key": "main"}, {"$set": {**settings.model_dump(), "_key": "main"}}, upsert=True)
    return {"status": "ok"}

# ---------------- Client Google Auth ----------------
@api_router.post("/auth/session")
async def auth_session(response: Response, x_session_id: Optional[str] = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="X-Session-ID required")
    async with httpx.AsyncClient() as hc:
        r = await hc.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": x_session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name"), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name"),
            "picture": data.get("picture"), "created_at": datetime.now(timezone.utc),
        })
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True,
                        secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return {"user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture")}

@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user.get("name"), "picture": user.get("picture")}

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"status": "ok"}

# ---------------- Orders ----------------
@api_router.post("/orders")
async def create_order(body: OrderCreate, user=Depends(get_current_user)):
    order = {
        "order_id": f"ord_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "package_name": body.package_name, "uid": body.uid,
        "quantity": body.quantity, "total": body.total,
        "created_at": datetime.now(timezone.utc),
    }
    await db.orders.insert_one(dict(order))
    order.pop("_id", None)
    order["created_at"] = order["created_at"].isoformat()
    return order

@api_router.get("/orders/me")
async def my_orders(user=Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs

# ---------------- Admin: users insight ----------------
@api_router.get("/admin/users")
async def admin_users(_: bool = Depends(verify_admin)):
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    total_orders = await db.orders.count_documents({})
    result = []
    for u in users:
        oc = await db.orders.count_documents({"user_id": u["user_id"]})
        gm = await db.gmail_tokens.find_one({"user_id": u["user_id"]}, {"_id": 0})
        ca = u.get("created_at")
        if isinstance(ca, datetime):
            ca = ca.isoformat()
        result.append({
            "user_id": u["user_id"], "email": u.get("email"),
            "name": u.get("name"), "picture": u.get("picture"),
            "created_at": ca, "orders": oc,
            "gmail_connected": bool(gm),
            "gmail_email": gm.get("connected_email") if gm else None,
        })
    return {"total_users": len(result), "total_orders": total_orders, "users": result}

# ---------------- Gmail helpers ----------------
def _flow():
    return Flow.from_client_config(
        {"web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }},
        scopes=GMAIL_SCOPES,
        redirect_uri=GMAIL_REDIRECT_URI,
    )

async def _get_gmail_creds(user_id: str):
    token = await db.gmail_tokens.find_one({"user_id": user_id}, {"_id": 0})
    if not token:
        return None
    creds = Credentials(
        token=token.get("access_token"),
        refresh_token=token.get("refresh_token"),
        token_uri=token.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=GMAIL_SCOPES,
    )
    expires = token.get("expires_at")
    needs_refresh = True
    if isinstance(expires, datetime):
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        needs_refresh = datetime.now(timezone.utc) >= expires
    if needs_refresh and creds.refresh_token:
        creds.refresh(GoogleRequest())
        await db.gmail_tokens.update_one(
            {"user_id": user_id},
            {"$set": {"access_token": creds.token,
                      "expires_at": datetime.now(timezone.utc) + timedelta(seconds=3500)}},
        )
    return creds

def _header(headers, name):
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return h.get("value", "")
    return ""

# ---------------- Gmail: client connect flow ----------------
@api_router.get("/gmail/status")
async def gmail_status(user=Depends(get_current_user)):
    token = await db.gmail_tokens.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"connected": bool(token), "email": token.get("connected_email") if token else None}

@api_router.get("/oauth/gmail/login")
async def gmail_login(user=Depends(get_current_user)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google credentials not configured")
    flow = _flow()
    url, state = flow.authorization_url(access_type="offline", prompt="consent", include_granted_scopes="true")
    await db.gmail_states.insert_one({
        "state": state, "user_id": user["user_id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    })
    return {"auth_url": url}

@api_router.get("/oauth/gmail/callback")
async def gmail_callback(code: str = "", state: str = ""):
    st = await db.gmail_states.find_one({"state": state}, {"_id": 0})
    if not st:
        return RedirectResponse(f"{FRONTEND_URL}/?gmail=error")
    user_id = st["user_id"]
    await db.gmail_states.delete_many({"state": state})
    flow = _flow()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        flow.fetch_token(code=code)
    creds = flow.credentials
    # fetch connected email
    connected_email = None
    try:
        service = build("gmail", "v1", credentials=creds)
        profile = service.users().getProfile(userId="me").execute()
        connected_email = profile.get("emailAddress")
    except Exception:
        pass
    await db.gmail_tokens.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=3500),
            "connected_email": connected_email,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return RedirectResponse(f"{FRONTEND_URL}/?gmail=connected")

@api_router.post("/gmail/disconnect")
async def gmail_disconnect(user=Depends(get_current_user)):
    await db.gmail_tokens.delete_many({"user_id": user["user_id"]})
    return {"status": "ok"}

# ---------------- Admin: view a user's Garena confirmation emails ----------------
@api_router.get("/admin/gmail/messages")
async def admin_gmail_messages(user_id: str, _: bool = Depends(verify_admin)):
    creds = await _get_gmail_creds(user_id)
    if not creds:
        raise HTTPException(status_code=404, detail="This user has not connected Gmail")
    cleared = await db.gmail_cleared.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    cleared_ids = {c["message_id"] for c in cleared}
    service = build("gmail", "v1", credentials=creds)
    listing = service.users().messages().list(userId="me", q=GARENA_QUERY, maxResults=20).execute()
    msgs = listing.get("messages", [])
    result = []
    for m in msgs:
        if m["id"] in cleared_ids:
            continue
        full = service.users().messages().get(
            userId="me", id=m["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()
        headers = full.get("payload", {}).get("headers", [])
        result.append({
            "id": m["id"],
            "subject": _header(headers, "Subject"),
            "from": _header(headers, "From"),
            "date": _header(headers, "Date"),
            "snippet": full.get("snippet", ""),
        })
    return {"messages": result, "count": len(result)}

@api_router.post("/admin/gmail/clear")
async def admin_gmail_clear(body: dict, _: bool = Depends(verify_admin)):
    user_id = body.get("user_id")
    message_id = body.get("message_id")
    if not user_id or not message_id:
        raise HTTPException(status_code=400, detail="user_id and message_id required")
    await db.gmail_cleared.update_one(
        {"user_id": user_id, "message_id": message_id},
        {"$set": {"user_id": user_id, "message_id": message_id, "cleared_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"status": "ok"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
