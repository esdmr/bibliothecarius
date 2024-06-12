from os.path import dirname, join
from sys import path

path.append(join(dirname(__file__), ".."))

from bibliothecarius_backend import app  # type: ignore

app.run(debug=True)
