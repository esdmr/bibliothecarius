from datetime import timedelta
from typing import Any
from flask import make_response
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_current_user, create_access_token

from app import api
import schemas

blp = Blueprint("challenge", "challenge", url_prefix="/challenge")

@blp.route("/")
class Challenge(MethodView):
    @jwt_required(fresh=True)
    @blp.doc(security=[{"Bearer Auth": []}])
    @blp.response(204)
    @blp.alt_response(401)
    def get(self):
        pass

    @jwt_required(optional=True)
    @blp.doc(security=[{}, {"Bearer Auth": []}])
    @blp.arguments(schemas.login.one)
    @blp.response(200, schemas.jwt.one)
    @blp.alt_response(400)
    @blp.alt_response(404)
    @blp.alt_response(401)
    def post(self, data):
        identity = schemas.identity.one.load(get_current_user() or {})

        if not isinstance(identity, dict):
            identity = {}

        data = schemas.login.one.load(data)

        if not isinstance(data, dict):
            abort(400)

        account: schemas.librarian.model = schemas.librarian.query.filter_by(
            username=data["username"]
        ).one_or_404()

        if account.password == "" or not bcrypt.check_password_hash(
            account.password, data["password"]
        ):
            abort(401)

        token = create_access_token(
            schemas.identity.one.dump({**identity, "account": account}),
            fresh=timedelta(minutes=5),
        )
        return schemas.jwt.one.dump({"token": token})
