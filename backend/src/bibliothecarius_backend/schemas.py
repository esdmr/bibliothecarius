from typing import Type, cast, Any
from marshmallow import Schema, fields
from flask_sqlalchemy.model import Model
from . import models
from .base import jwt as jwt_manager


def id_field() -> fields.Integer:
    return fields.Integer(dump_only=True, required=True)


class Instances[S: Schema, M: Model]:
    def __init__(self, Target: Type[S], model: Type[M] = Model):
        name = Target.__name__.removesuffix("Schema")

        class Raw(Target):
            pass

        Raw.__name__ = name + "RawSchema"

        class Partial(Target):
            pass

        Partial.__name__ = name + "PartialSchema"

        self.name = name
        self.Target = Target
        self.model = model
        self.one = Target()
        self.many = Target(many=True)

        self.foreign_keys = {
            k for k, v in self.one.fields.items() if isinstance(v, fields.Nested)
        }

        self.raw = cast(S, Raw(exclude=self.foreign_keys))
        self.partial = cast(S, Partial(exclude=self.foreign_keys, partial=True))

    @property
    def query(self):
        return self.model.query


class CategorySchema(Schema):
    id = id_field()
    name = fields.String(required=True)


category = Instances(CategorySchema, models.Category)
category.model


class BookSchema(Schema):
    id = id_field()
    title = fields.String(required=True)
    description = fields.String(required=False, default="")
    category = fields.Nested(CategorySchema, required=False)
    category_id = fields.Integer(required=False)


book = Instances(BookSchema, models.Book)


class AuthorSchema(Schema):
    id = id_field()
    name = fields.String(required=True)


author = Instances(AuthorSchema, models.Author)


class BookAuthorSchema(Schema):
    id = id_field()
    book = fields.Nested(BookSchema, required=True)
    book_id = fields.Integer(required=True)
    author = fields.Nested(AuthorSchema, required=True)
    author_id = fields.Integer(required=True)


book_author = Instances(BookAuthorSchema, models.BookAuthor)


class PublisherSchema(Schema):
    id = id_field()
    name = fields.String(required=True)


publisher = Instances(PublisherSchema, models.Publisher)


class BookCopySchema(Schema):
    id = id_field()
    year_published = fields.Integer(required=False)
    book = fields.Nested(BookSchema, required=True)
    book_id = fields.Integer(required=True)
    publisher = fields.Nested(PublisherSchema, required=True)
    publisher_id = fields.Integer(required=True)


book_copy = Instances(BookCopySchema, models.BookCopy)


class LibrarianSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True, load_only=True)
    admin = fields.Boolean(required=False, default=False)


librarian = Instances(LibrarianSchema, models.Librarian)


class AccountSchema(Schema):
    username = fields.String(required=True)
    admin = fields.Boolean(required=False, default=False)


account = Instances(AccountSchema)


class Identity(Schema):
    account = fields.Nested(AccountSchema, required=False)


identity = Instances(Identity)


class LogInSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True, load_only=True)


login = Instances(LogInSchema, models.Librarian)


class Jwt(Schema):
    token = fields.String(required=True)


jwt = Instances(Jwt)


class ChallengeRequestSchema(Schema):
    hash = fields.String(required=True)
    image = fields.String(required=True)


challenge_request = Instances(ChallengeRequestSchema)


class ChallengeResponseSchema(Schema):
    hash = fields.String(required=True)
    text = fields.String(required=True)


challenge_response = Instances(ChallengeResponseSchema)


class ChallengeRequestMessageSchema(Schema):
    request = fields.Nested(ChallengeRequestSchema, required=False)
    token = fields.String(required=False)


challenge_request_message = Instances(ChallengeRequestMessageSchema)


class ChallengeResponseMessageSchema(Schema):
    response = fields.Nested(ChallengeResponseSchema, required=False)


challenge_response_message = Instances(ChallengeResponseMessageSchema)


@jwt_manager.user_identity_loader
def user_identity_lookup(user: Any) -> Any:
    return identity.one.dump(user)


@jwt_manager.user_lookup_loader
def user_lookup_loader(_jwt_header: dict[str, Any], jwt_data: dict[str, Any]):
    return identity.one.load(jwt_data["sub"])
