from flask import redirect
from .base import app
from . import models
from . import schemas
from . import account
from . import challenge
from . import api


@app.route("/")
def index():
    return redirect("https://esdmr.ir/bibliothecarius/")
