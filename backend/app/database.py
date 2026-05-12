from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URL, DB_NAME

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.scans.create_index("user_id")
    await db.scans.create_index("created_at")
    print(f"Connected to MongoDB: {DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
