"""FastAPI application factory and configuration."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router
from app.config import settings
from app.middleware import RequestLoggingMiddleware


def configure_logging() -> None:
    """Configure application logging."""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def configure_sentry() -> None:
    """Configure Sentry error tracking."""
    if settings.ENABLE_SENTRY and settings.SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                StarletteIntegration(transaction_style="url"),
                FastApiIntegration(transaction_style="url"),
            ],
        )
        logger = logging.getLogger(__name__)
        logger.info(f"Sentry initialized for environment: {settings.SENTRY_ENVIRONMENT}")


def configure_metrics(app: FastAPI) -> None:
    """Configure Prometheus metrics."""
    if settings.ENABLE_METRICS:
        from prometheus_fastapi_instrumentator import Instrumentator

        # Initialize instrumentator
        instrumentator = Instrumentator(
            should_group_status_codes=True,
            should_ignore_untemplated=False,
            should_respect_env_var=True,
            should_instrument_requests_inprogress=True,
            excluded_handlers=["/metrics"],
            inprogress_name="http_requests_inprogress",
            inprogress_labels=True,
        )

        # Instrument the app
        instrumentator.instrument(app)

        # Expose metrics endpoint
        instrumentator.expose(app, endpoint="/metrics", include_in_schema=True, tags=["monitoring"])

        logger = logging.getLogger(__name__)
        logger.info("Prometheus metrics enabled at /metrics")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    configure_logging()
    logger = logging.getLogger(__name__)
    logger.info(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    logger.info(f"CORS enabled for origins: {settings.CORS_ORIGINS}")

    # Initialize Sentry
    configure_sentry()

    yield

    # Shutdown
    logger.info("Shutting down application")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        lifespan=lifespan,
    )

    # Add request logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom validation error handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors with consistent JSON response."""
        errors = exc.errors()
        error_details = []
        for error in errors:
            loc = " -> ".join(str(l) for l in error["loc"])
            error_details.append(f"{loc}: {error['msg']}")

        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": error_details,
            },
        )

    # Include API routes
    app.include_router(router)

    # Configure Prometheus metrics
    configure_metrics(app)

    return app


# Application instance
app = create_app()
