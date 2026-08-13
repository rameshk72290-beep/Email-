from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import List, Optional
import base64
import hashlib
import json
import logging
import os
import secrets
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
mongo_url = os.environ["MONGO_URL"]
db = AsyncIOMotorClient(mongo_url)[os.environ["DB_NAME"]]
app = FastAPI(title="Gmail Command Center")
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
GOOGLE_REDIRECT_URI = os.environ["GOOGLE_REDIRECT_URI"]
FRONTEND_URL = os.environ["FRONTEND_URL"]
ADMIN_USERNAME = os.environ["ADMIN_USERNAME"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ADMIN_TOKEN_SECRET = os.environ["ADMIN_TOKEN_SECRET"]
SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
]


class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    avatar: Optional[str] = None
    status: str = "active"
    unread_count: int = 0
    spam_count: int = 0
    total_emails: int = 0
    linked_at: datetime


class AdminLogin(BaseModel):
    username: str
    password: str


class EmailItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    account_email: str
    sender: str
    sender_email: str
    subject: str
    snippet: str
    category: str
    is_spam: bool = False
    date: datetime


class BulkAction(BaseModel):
    email_ids: List[str]


def config():
    return {"web": {"client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET, "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token"}}


def admin_token() -> str:
    raw = f"{ADMIN_USERNAME}:{ADMIN_TOKEN_SECRET}".encode()
    return base64.urlsafe_b64encode(hashlib.sha256(raw).digest()).decode()


def require_admin(request: Request):
    if request.headers.get("Authorization") != f"Bearer {admin_token()}":
        raise HTTPException(status_code=401, detail="Owner permission required")


def encode_credentials(credentials: Credentials) -> dict:
    return {"token": credentials.token, "refresh_token": credentials.refresh_token, "token_uri": credentials.token_uri, "client_id": credentials.client_id, "client_secret": credentials.client_secret, "scopes": credentials.scopes, "expiry": credentials.expiry.isoformat() if credentials.expiry else None}


def decode_credentials(data: dict) -> Credentials:
    expiry = datetime.fromisoformat(data["expiry"]) if data.get("expiry") else None
    credentials = Credentials(token=data.get("token"), refresh_token=data.get("refresh_token"), token_uri=data.get("token_uri"), client_id=data.get("client_id"), client_secret=data.get("client_secret"), scopes=data.get("scopes"), expiry=expiry)
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(GoogleRequest())
    return credentials


def header_value(headers, name: str) -> str:
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return header.get("value", "")
    return ""


async def gmail_service(account_email: str):
    account = await db.accounts.find_one({"email": account_email}, {"_id": 0})
    if not account or not account.get("credentials"):
        raise HTTPException(status_code=404, detail="Gmail account is not connected")
    credentials = decode_credentials(account["credentials"])
    if credentials.token != account["credentials"].get("token"):
        await db.accounts.update_one({"email": account_email}, {"$set": {"credentials": encode_credentials(credentials)}})
    return build("gmail", "v1", credentials=credentials)


@api.get("/oauth/gmail/start")
async def gmail_start():
    state = secrets.token_urlsafe(32)
    flow = Flow.from_client_config(config(), scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI)
    url, _ = flow.authorization_url(access_type="offline", prompt="consent", include_granted_scopes="true", state=state)
    await db.oauth_states.insert_one({"_id": state, "created_at": datetime.now(timezone.utc)})
    return {"authorization_url": url}


@api.get("/oauth/gmail/callback")
async def gmail_callback(code: str, state: str):
    state_doc = await db.oauth_states.find_one({"_id": state})
    if not state_doc:
        raise HTTPException(status_code=400, detail="OAuth state expired or invalid")
    await db.oauth_states.delete_one({"_id": state})
    flow = Flow.from_client_config(config(), scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI, state=state)
    flow.fetch_token(code=code)
    credentials = flow.credentials
    service = build("gmail", "v1", credentials=credentials)
    profile = service.users().getProfile(userId="me").execute()
    email = profile["emailAddress"].lower()
    existing = await db.accounts.find_one({"email": email}, {"_id": 0})
    if existing:
        return RedirectResponse(f"{FRONTEND_URL}/?oauth=duplicate&email={email}")
    account = {"id": str(uuid.uuid4()), "email": email, "name": email.split("@")[0], "avatar": None, "status": "active", "unread_count": 0, "spam_count": 0, "total_emails": profile.get("messagesTotal", 0), "linked_at": datetime.now(timezone.utc), "credentials": encode_credentials(credentials)}
    await db.accounts.insert_one(account)
    return RedirectResponse(f"{FRONTEND_URL}/?oauth=success&email={email}")


@api.get("/accounts", response_model=List[Account])
async def accounts():
    docs = await db.accounts.find({}, {"_id": 0, "credentials": 0}).sort("linked_at", -1).to_list(100)
    return docs


@api.delete("/accounts/{account_id}")
async def unlink(account_id: str, request: Request):
    require_admin(request)
    result = await db.accounts.delete_one({"id": account_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"success": True}


@api.get("/emails", response_model=List[EmailItem])
async def emails(request: Request, account_email: Optional[str] = None, category: Optional[str] = None, search: Optional[str] = Query(default=None, max_length=120)):
    require_admin(request)
    account_docs = await db.accounts.find({}, {"_id": 0}).to_list(100)
    selected = [a for a in account_docs if not account_email or account_email == "all" or a["email"] == account_email]
    output = []
    for account in selected:
        try:
            service = await gmail_service(account["email"])
            query = "in:anywhere -in:trash"
            if category == "Spam": query = "in:spam"
            elif category == "Promotions": query = "category:promotions"
            elif category == "Primary": query = "category:primary"
            if search: query += f" {search}"
            listed = service.users().messages().list(userId="me", q=query, maxResults=50).execute().get("messages", [])
            for item in listed:
                detail = service.users().messages().get(userId="me", id=item["id"], format="metadata", metadataHeaders=["From", "Subject", "Date"]).execute()
                headers = detail.get("payload", {}).get("headers", [])
                sender_raw = header_value(headers, "From") or "Unknown sender"
                sender_email = sender_raw.split("<")[-1].replace(">", "").strip()
                category_name = "Spam" if "SPAM" in detail.get("labelIds", []) else "Inbox"
                if category and category != "All" and category_name != category: continue
                output.append(EmailItem(id=item["id"], account_email=account["email"], sender=sender_raw.split("<")[0].strip() or sender_email, sender_email=sender_email, subject=header_value(headers, "Subject") or "(no subject)", snippet=detail.get("snippet", ""), category=category_name, is_spam=category_name == "Spam", date=parse_date(header_value(headers, "Date"))))
        except Exception as exc:
            logger.warning("Could not read %s: %s", account["email"], exc)
    return output


def parse_date(value: str) -> datetime:
    try:
        parsed = parsedate_to_datetime(value)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError, IndexError):
        return datetime.now(timezone.utc)


@api.post("/emails/trash")
async def trash(payload: BulkAction, request: Request):
    require_admin(request)
    changed = 0
    for email_id in payload.email_ids:
        account_email = email_id.split("::", 1)[0] if "::" in email_id else None
        gmail_id = email_id.split("::", 1)[-1]
        if not account_email: continue
        service = await gmail_service(account_email)
        service.users().messages().trash(userId="me", id=gmail_id).execute()
        changed += 1
    return {"success": True, "modified_count": changed, "message": f"Moved {changed} email(s) to Trash."}


@api.post("/admin/login")
async def admin_login(payload: AdminLogin):
    if secrets.compare_digest(payload.username, ADMIN_USERNAME) and secrets.compare_digest(payload.password, ADMIN_PASSWORD):
        return {"success": True, "token": admin_token(), "role": "owner"}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Owner credentials")


@api.get("/health")
async def health():
    return {"status": "ok", "gmail_oauth_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)}


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ["CORS_ORIGINS"].split(","), allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown():
    db.client.close()