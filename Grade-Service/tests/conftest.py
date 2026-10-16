import os
import tempfile

_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_db.close()
os.environ["JWT_SECRET"] = "test-secret-test-secret-test-secret-32"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///" + _db.name.replace("\\", "/")
