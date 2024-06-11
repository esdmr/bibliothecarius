from datetime import timedelta
from typing import Any
from flask import make_response
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_current_user, create_access_token

from app import api, bcrypt
import schemas


blp = Blueprint("account", "account", url_prefix="/account")


def require_account(admin_only=False):
    identity = schemas.identity.one.load(get_current_user() or {})

    if not isinstance(identity, dict):
        identity = {}

    account = identity.get("account", None)

    if not account:
        abort(401, Exception("Not logged in"))

    if admin_only and not account.get("admin", False):
        abort(403, Exception("Not an admin"))

    return account


@blp.route("/")
class Account(MethodView):
    @jwt_required()
    @blp.doc(security=[{"Bearer Auth": []}])
    @blp.response(200, schemas.librarian.one)
    @blp.alt_response(422)
    @blp.alt_response(401)
    def get(self):
        return schemas.librarian.one.dump(require_account())

    @jwt_required(optional=True)
    @blp.doc(security=[{}, {"Bearer Auth": []}])
    @blp.arguments(schemas.login.one)
    @blp.response(200, schemas.jwt.one)
    @blp.alt_response(422)
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

        return schemas.jwt.one.dump(
            {
                "token": create_access_token(
                    schemas.identity.one.dump({**identity, "account": account}),
                )
            }
        )


api.register_blueprint(blp)
