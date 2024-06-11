from .flask import app
from . import models
from . import schemas
from . import account
from . import challenge
from . import api

if __name__ == "__main__":
    app.run(debug=True)
