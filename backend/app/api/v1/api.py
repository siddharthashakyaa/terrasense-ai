from fastapi import APIRouter

from app.api.v1.endpoints import predict, history, fields, models, datasets, forecast, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(predict.router, tags=["Prediction"])
api_router.include_router(history.router, tags=["History"])
api_router.include_router(fields.router, tags=["Fields"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(datasets.router, tags=["Datasets"])
api_router.include_router(forecast.router, tags=["Forecast"])
