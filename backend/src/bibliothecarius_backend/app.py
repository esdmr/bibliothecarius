from copy import deepcopy
from functools import wraps
from random import randbytes
from typing import Any, override
from flask import Flask
from os import environ
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required
from flask_smorest import Api, Blueprint
from flask_simple_captcha import CAPTCHA as Captcha

app = Flask(__name__)
app.config["API_TITLE"] = "Bibliothecarius"
app.config["API_VERSION"] = "v1"
app.config["OPENAPI_VERSION"] = "3.0.2"
app.config["OPENAPI_URL_PREFIX"] = "/"
app.config["OPENAPI_JSON_PATH"] = "openapi.json"

app.config["OPENAPI_REDOC_PATH"] = "/redoc"
app.config["OPENAPI_REDOC_URL"] = (
    "https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"
)

app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger"
app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

app.config["OPENAPI_RAPIDOC_PATH"] = "/rapidoc"
app.config["OPENAPI_RAPIDOC_URL"] = (
    "https://cdn.jsdelivr.net/npm/rapidoc/dist/rapidoc-min.js"
)

app.config["SQLALCHEMY_DATABASE_URI"] = environ["DATABASE_URI"]
app.config["JWT_SECRET_KEY"] = environ["JWT_SECRET_KEY"]

app.config["API_SPEC_OPTIONS"] = {
    "components": {
        "securitySchemes": {
            "Bearer Auth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
        }
    },
}

app.config["ADMIN_PASSWORD"] = environ["ADMIN_PASSWORD"]

simple_captcha = Captcha(
    config={
        "SECRET_CAPTCHA_KEY": environ["CAPTCHA_SECRET_KEY"],
        "CAPTCHA_LENGTH": 6,
        "CAPTCHA_DIGITS": False,
        "EXPIRE_SECONDS": 120,
    }
)

app = simple_captcha.init_app(app)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
api = Api(app)
