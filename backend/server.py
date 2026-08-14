from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'freefire')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'rk212006')
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

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
        ca = u.get("created_at")
        if isinstance(ca, datetime):
            ca = ca.isoformat()
        result.append({
            "user_id": u["user_id"], "email": u.get("email"),
            "name": u.get("name"), "picture": u.get("picture"),
            "created_at": ca, "orders": oc,
        })
    return {"total_users": len(result), "total_orders": total_orders, "users": result}

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
