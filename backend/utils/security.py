import base64
import json
import time
import hashlib

SECRET = "REPLACE_THIS_WITH_A_RANDOM_SECRET"

def generate_token(data, exp=1800):
    payload = {
        "exp": int(time.time()) + exp,
        "data": data
    }
    b = json.dumps(payload).encode()
    sig = hashlib.sha256(b + SECRET.encode()).hexdigest()
    token = base64.urlsafe_b64encode(b).decode() + "." + sig
    return token

def verify_token(token):
    try:
        b64, sig = token.rsplit('.', 1)
        b = base64.urlsafe_b64decode(b64.encode())
        payload = json.loads(b)
        if hashlib.sha256(b + SECRET.encode()).hexdigest() != sig:
            return None
        if payload["exp"] < time.time():
            return None
        return payload["data"]
    except Exception:
        return None