"""Entry point for the grade-service FastAPI application."""
from fastapi import FastAPI

from database.session import Base, async_engine
from routes.grades import router as grades_router
from security.jwt import JWTMiddleware


def create_app() -> FastAPI:
    app = FastAPI(
        title="Grade Service",
        description="Service for managing student grades and calculating averages.",
        version="1.0.0",
    )

    # Register JWT verification middleware
    app.add_middleware(JWTMiddleware)

    # Include grade routes
    app.include_router(grades_router, prefix="/grades", tags=["grades"])

    # Create tables at startup (simple approach for demo purposes)
    @app.on_event("startup")
    async def on_startup() -> None:  # pragma: no cover - side effect
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    return app


app = create_app()


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Lightweight health endpoint for service monitoring."""
    return {"status": "ok"}

