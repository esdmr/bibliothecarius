from flask import redirect
from .flask import app
from . import models
from . import schemas
from . import account
from . import challenge
from . import api


@app.route("/")
def index():
    return redirect("https://esdmr.ir/bibliothecarius/")


if __name__ == "__main__":
    app.run(debug=True)
