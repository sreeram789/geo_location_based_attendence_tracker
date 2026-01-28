from celery import Celery
from app.core.config import settings

celery_app = Celery("tasks", broker=settings.CELERY_BROKER_URL)
celery_app.conf.result_backend = settings.CELERY_RESULT_BACKEND

celery_app.autodiscover_tasks(["app.tasks"])

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls verification_task every 10 minutes
    sender.add_periodic_task(600.0, verification_task.s(), name='verify-location-every-10-mins')

@celery_app.task
def verification_task():
    # Logic to trigger location verification for all active users
    # This might involve sending a message via WebSocket to all connected clients
    pass
