from os.path import dirname, join
from sys import path

path.append(join(dirname(__file__), "src"))

from bibliothecarius_backend import app  # type: ignore
