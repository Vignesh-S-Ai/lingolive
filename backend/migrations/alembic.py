"""Alembic command entry point."""

from alembic import command
from alembic.config import Config

# Point to the alembic.ini in the backend directory
config = Config("../alembic.ini")

# Set the script location to the migrations folder relative to this file
config.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "migrations"))

import os

if __name__ == "__main__":
    import sys
    # Run the specified alembic command
    command.upgrade(config, "head" if len(sys.argv) < 2 else sys.argv[1])