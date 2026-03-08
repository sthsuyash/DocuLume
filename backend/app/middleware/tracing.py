"""OpenTelemetry distributed tracing middleware."""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from fastapi import FastAPI
from app.config import settings


def setup_tracing(app: FastAPI) -> None:
    """Configure OpenTelemetry tracing for the application."""

    # Create resource with service information
    resource = Resource(attributes={
        SERVICE_NAME: settings.app_name,
        SERVICE_VERSION: settings.app_version,
        "environment": settings.environment,
    })

    # Set up tracer provider
    provider = TracerProvider(resource=resource)

    # Configure OTLP exporter (sends to Jaeger/Zipkin/etc)
    otlp_exporter = OTLPSpanExporter(
        endpoint=settings.otel_exporter_endpoint or "http://localhost:4317",
        insecure=True  # Use TLS in production
    )

    # Add batch processor for better performance
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

    # Set as global tracer
    trace.set_tracer_provider(provider)

    # Auto-instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # Auto-instrument SQLAlchemy
    SQLAlchemyInstrumentor().instrument()

    # Auto-instrument Redis
    RedisInstrumentor().instrument()


def get_tracer(name: str = __name__):
    """Get a tracer instance for manual instrumentation."""
    return trace.get_tracer(name)


# Decorator for custom span creation
def traced(span_name: str = None):
    """Decorator to create custom spans for functions."""
    def decorator(func):
        import functools
        from inspect import iscoroutinefunction

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or f"{func.__module__}.{func.__name__}"

            with tracer.start_as_current_span(name) as span:
                # Add function arguments as attributes
                span.set_attribute("function.args_count", len(args))
                span.set_attribute("function.kwargs_count", len(kwargs))

                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("function.success", True)
                    return result
                except Exception as e:
                    span.set_attribute("function.success", False)
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or f"{func.__module__}.{func.__name__}"

            with tracer.start_as_current_span(name) as span:
                span.set_attribute("function.args_count", len(args))
                span.set_attribute("function.kwargs_count", len(kwargs))

                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("function.success", True)
                    return result
                except Exception as e:
                    span.set_attribute("function.success", False)
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise

        return async_wrapper if iscoroutinefunction(func) else sync_wrapper

    return decorator


# Example usage in services
class TracedOperation:
    """Context manager for traced operations."""

    def __init__(self, operation_name: str, attributes: dict = None):
        self.operation_name = operation_name
        self.attributes = attributes or {}
        self.span = None

    def __enter__(self):
        tracer = get_tracer()
        self.span = tracer.start_span(self.operation_name)

        # Set custom attributes
        for key, value in self.attributes.items():
            self.span.set_attribute(key, value)

        return self.span

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.span.set_attribute("error", True)
            self.span.set_attribute("error.type", exc_type.__name__)
            self.span.set_attribute("error.message", str(exc_val))
            self.span.record_exception(exc_val)

        self.span.end()
        return False
