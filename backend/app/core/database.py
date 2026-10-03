from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine_args = {}
if is_sqlite:
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_pre_ping"] = True

engine = create_engine(settings.DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import backend.app.models.user
    import backend.app.models.dataset
    import backend.app.models.model_entity
    import backend.app.models.inference
    import backend.app.models.evidence
    import backend.app.models.assurance
    import backend.app.models.audit
    Base.metadata.create_all(bind=engine)
