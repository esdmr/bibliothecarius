from typing import Any
from flask import Flask, make_response
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from marshmallow import Schema
from flask_smorest import Blueprint, abort
from flask_sqlalchemy.model import Model

from app import api, db
import schemas


def create_blueprint[
    S: Schema, M: Model
](schema: schemas.Instances[S, M], url_prefix: str, is_admin_route: bool = False):
    blp = Blueprint(schema.name, schema.name, url_prefix=url_prefix)

    @blp.route("/")
    class Index(MethodView):
        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.arguments(schema.partial, location="query")
        @blp.response(200, schema.many)
        @blp.alt_response(401, schema=schemas.unauthorized.one)
        def get(self, query):
            query = schema.partial.load(query)

            if not isinstance(query, dict):
                query = {}

            data: list[schema.model] = schema.query.filter_by(**query).all()

            return schema.many.dump(data)

        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.arguments(schema.raw)
        @blp.response(201, schema.one)
        @blp.alt_response(401, schema=schemas.unauthorized.one)
        def post(self, new_data):
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
        @blp.alt_response(401, schema=schemas.unauthorized.one)
        @blp.alt_response(404)
        def get(self, id):
            item: schema.model = schema.query.filter_by(id=id).one_or_404()
            return schema.one.dump(item)

        @jwt_required(fresh=True)
        @blp.doc(security=[{"Bearer Auth": []}])
        @blp.arguments(schema.partial)
        @blp.response(200, schema.one)
        @blp.alt_response(401, schema=schemas.unauthorized.one)
        @blp.alt_response(404)
        def patch(self, update_data, id):
            update_data = schema.partial.load(update_data)

            if not isinstance(update_data, dict):
                update_data = {}

            item: schema.model = schema.query.filter_by(id=id).one_or_404()
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
        @blp.alt_response(401, schema=schemas.unauthorized.one)
        @blp.alt_response(404)
        def delete(self, id):
            row_count = schema.query.filter_by(id=id).delete()
            db.session.commit()
            if row_count < 1:
                abort(404)

    return blp


api.register_blueprint(create_blueprint(schemas.category, "/categories"))
api.register_blueprint(create_blueprint(schemas.book, "/books"))
api.register_blueprint(create_blueprint(schemas.author, "/authors"))
api.register_blueprint(create_blueprint(schemas.book_author, "/book_authors"))
api.register_blueprint(create_blueprint(schemas.publisher, "/publishers"))
api.register_blueprint(create_blueprint(schemas.book_copy, "/book_copies"))
api.register_blueprint(
    create_blueprint(schemas.librarian, "/librarians", is_admin_route=True)
)
