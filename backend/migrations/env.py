"""Alembic environment configuration."""

from __future__ import annotations

import os
from logging.config import dictConfig

from sqlalchemy import engine_from_config, pool

from app.core.config import settings

# this is the Base of our models, as defined in models.py
from app.db.models import Base  # noqa: F401

# add your model's MetaData object here
# for 'autogenerate' support
# target_metadata = Base.metadata
target_metadata = None

# other values from the config, defined by the needs of env.py,
# this will be same as in .ini file
conf_path = os.path.dirname(__file__).replace("\\", "/")
cfg = __import__("alembic.config", fromlist=["config"]).config.Config(
    os.path.join(conf_path, "..", "alembic.ini")
)

# Override the sqlalchemy.url with the value from .env
if os.getenv("DATABASE_URL"):
    cfg.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

# if the config object has set_main_option, use that rather
# than the .ini file value
class StandalonePredicateOptions:
    pass

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and begins migration script execution without needing a DBAPI.

    Offline mode is useful for generating migration scripts
    when neither a database nor a DBAPI is available.
    """
    url = cfg.get_main_option("sqlalchemy.url")
    context = op.get_context()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this mode we need to create an Engine,
    and associate a connection with the migration context.
    """
    connectable = engine_from_config(
        cfg.get_section(cfg.config_ini_section()),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()