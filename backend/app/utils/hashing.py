import hashlib
import bcrypt
from fastapi import HTTPException

# Prevent huge password DoS
MAX_PASSWORD_BYTES = 10_000

def _bcrypt_ready(password: str) -> bytes:
    if not password:
        raise HTTPException(status_code = 400, detail="Password cannot be empty")
    
    #convert string to bytes
    pw_bytes = password.encode("utf-8")

    if len(pw_bytes) > MAX_PASSWORD_BYTES:
        raise HTTPException(status_code=400, detail="Password too long")

    # fixed 32-byte digest -> safe for bcrypt (bcrypt has a 72-byte max)
    return hashlib.sha256(pw_bytes).digest()

# SIGNUP: hash before storing
def hash_password(password: str) -> str:
    if password < 8:
        raise HTTPException(status_code = 400, detail= "Password needs to be longer than 8 characters")
    ready = _bcrypt_ready(password)
    # produces secture stored hash and convert to string
    return bcrypt.hashpw(ready, bcrypt.gensalt()).decode("utf-8")

# LOGIN: verify against stored hash
def verify_password(plain_password: str, hashed_password: str) -> bool:
    ready = _bcrypt_ready(plain_password)
    return bcrypt.checkpw(ready, hashed_password.encode("utf-8"))