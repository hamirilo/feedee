import asyncio
import sys
import getpass
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

async def main():
    print("=== Create Superuser ===")
    try:
        username = input("Username: ").strip()
        if not username:
            print("Error: Username is required.")
            sys.exit(1)
            
        email = input("Email address: ").strip()
        if not email:
            print("Error: Email is required.")
            sys.exit(1)
            
        password = getpass.getpass("Password: ")
        if not password:
            print("Error: Password is required.")
            sys.exit(1)
            
        password_confirm = getpass.getpass("Password (again): ")
        if password != password_confirm:
            print("Error: Passwords do not match.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nAborted.")
        sys.exit(1)
        
    async with AsyncSessionLocal() as session:
        # Check if username or email already exists
        result = await session.execute(
            select(User).where((User.username == username) | (User.email == email))
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            print("Error: A user with this username or email already exists.")
            sys.exit(1)
            
        new_user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_superuser=True
        )
        session.add(new_user)
        await session.commit()
        print(f"Superuser '{username}' created successfully.")

if __name__ == "__main__":
    asyncio.run(main())
