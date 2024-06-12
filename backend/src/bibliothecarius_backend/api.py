from flask.views import MethodView
from flask_jwt_extended import jwt_required
from marshmallow import Schema
from flask_smorest import Blueprint, abort
from flask_sqlalchemy.model import Model
from sqlalchemy.orm import InstrumentedAttribute

from .base import api, db
from . import schemas
from .account import require_account


def create_blueprint[
    S: Schema, M: Model
](
    schema: schemas.Instances[S, M],
    url_prefix: str,
    primary_key: InstrumentedAttribute,
    is_admin_route: bool = False,
):
    blp = Blueprint(schema.name, schema.name, url_prefix=url_prefix)

    @blp.route("/")
    class Index(MethodView):
        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.arguments(schema.partial, location="query")
        @blp.response(200, schema.many)
        @blp.alt_response(401)
        @blp.alt_response(403)
        @blp.alt_response(422)
        def get(self, query):
            if is_admin_route:
                require_account(admin_only=True)

            query = schema.partial.load(query)

            if not isinstance(query, dict):
                query = {}

            data: list[schema.model] = schema.query.filter_by(**query).all()

            return schema.many.dump(data)

        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.arguments(schema.raw)
        @blp.response(201, schema.one)
        @blp.alt_response(401)
        @blp.alt_response(403)
        @blp.alt_response(422)
        def post(self, new_data):
            require_account(admin_only=is_admin_route)
            new_data = schema.raw.load(new_data)
            item = schema.model(**new_data)
            db.session.add(item)
            db.session.commit()
            return schema.one.dump(item)

    @blp.route("/<id>")
    class ById(MethodView):
        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.response(200, schema.one)
        @blp.alt_response(401)
        @blp.alt_response(403)
        @blp.alt_response(422)
        @blp.alt_response(404)
        def get(self, id):
            if is_admin_route:
                require_account(admin_only=True)

            item: schema.model = schema.query.filter(primary_key == id).one_or_404()
            return schema.one.dump(item)

        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.arguments(schema.partial)
        @blp.response(200, schema.one)
        @blp.alt_response(401)
        @blp.alt_response(403)
        @blp.alt_response(422)
        @blp.alt_response(404)
        def patch(self, update_data, id):
            require_account(admin_only=is_admin_route)
            update_data = schema.partial.load(update_data)

            if not isinstance(update_data, dict):
                update_data = {}

            item: schema.model = schema.query.filter(primary_key == id).one_or_404()
            updated = False

            for i in schema.partial.fields.keys():
                if i in update_data:
                    if getattr(item, i) != update_data[i]:
                        setattr(item, i, update_data[i])
                        updated = True

            if updated:
                db.session.commit()

            return schema.one.dump(item)

        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.response(204)
        @blp.alt_response(401)
        @blp.alt_response(403)
        @blp.alt_response(422)
        @blp.alt_response(404)
        def delete(self, id):
            require_account(admin_only=is_admin_route)
            row_count = schema.query.filter(primary_key == id).delete()
            db.session.commit()
            if row_count < 1:
                abort(404)

    return blp


api.register_blueprint(
    create_blueprint(schemas.category, "/categories", schemas.category.model.id)
)
api.register_blueprint(create_blueprint(schemas.book, "/books", schemas.book.model.id))
api.register_blueprint(
    create_blueprint(schemas.author, "/authors", schemas.author.model.id)
)
api.register_blueprint(
    create_blueprint(schemas.book_author, "/book_authors", schemas.book_author.model.id)
)
api.register_blueprint(
    create_blueprint(schemas.publisher, "/publishers", schemas.publisher.model.id)
)
api.register_blueprint(
    create_blueprint(schemas.book_copy, "/book_copies", schemas.book_copy.model.id)
)
api.register_blueprint(
    create_blueprint(
        schemas.librarian,
        "/librarians",
        schemas.librarian.model.username,
        is_admin_route=True,
    )
)
