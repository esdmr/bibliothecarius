from datetime import timedelta
from typing import Any, cast
from flask import make_response
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_current_user, create_access_token

from app import api, simple_captcha
import schemas

blp = Blueprint("challenge", "challenge", url_prefix="/challenge")


@blp.route("/")
class Challenge(MethodView):
    @jwt_required(fresh=True)
    @blp.doc(security=[{"Bearer Auth": []}])
    @blp.response(204)
    @blp.alt_response(422, schema=schemas.jwt_invalid.one)
    @blp.alt_response(401)
    def get(self):
        pass

    @jwt_required(optional=True)
    @blp.doc(security=[{}, {"Bearer Auth": []}])
    @blp.arguments(schemas.challenge_response_message.one)
    @blp.response(200, schemas.challenge_request_message.one)
    @blp.alt_response(422, schema=schemas.jwt_invalid.one)
    @blp.alt_response(400)
    @blp.alt_response(401)
    def post(self, data):
        identity = schemas.identity.one.load(get_current_user() or {})

        if not isinstance(identity, dict):
            identity = {}

        data = schemas.challenge_response_message.one.load(data)

        if not isinstance(data, dict):
            abort(400)

        response = data.get("response", None)

        if not response:
            captcha: Any = simple_captcha.create()
            mime_type = (
                "image/png" if simple_captcha.img_format == "PNG" else "image/jpeg"
            )

            return schemas.challenge_request_message.one.dump(
                {
                    "request": {
                        "hash": captcha["hash"],
                        "image": f"data:{mime_type};base64,{captcha['img']}",
                    }
                }
            )

        if not simple_captcha.verify(response["text"], response["hash"]):
            abort(401)

        return schemas.challenge_request_message.one.dump(
            {
                "token": create_access_token(
                    schemas.identity.one.dump(identity),
                    fresh=timedelta(minutes=5),
                )
            }
        )


api.register_blueprint(blp)
