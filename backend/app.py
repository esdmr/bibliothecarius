from os.path import dirname, join
from sys import path

venv_activate_this = join(dirname(__file__), ".venv", "bin", "activate_this.py")
exec(open(venv_activate_this).read(), {"__file__": venv_activate_this})

path.append(join(dirname(__file__), "src"))

from bibliothecarius_backend import app  # type: ignore
