from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# use on signup before storing password
def hash_password(password: str):
    return pwd_context.hash(password)
# use on login to check password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)