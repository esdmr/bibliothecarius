from types import NoneType
from typing import Generic, Type, TypeVar, cast, Iterable, Any
from marshmallow import Schema, fields
from sqlalchemy.orm.query import Query
from flask_sqlalchemy.model import Model
import models
import app


def id_field() -> fields.Integer:
    return fields.Integer(dump_only=True, required=True)


class Instances[S: Schema, M: Model]:
    def __init__(self, name: str, Target: Type[S], model: Type[M] = Model):
        class Raw(Target):
            pass

        Raw.__name__ = Target.__name__.removesuffix("Schema") + "RawSchema"

        class Partial(Target):
            pass

        Partial.__name__ = Target.__name__.removesuffix("Schema") + "PartialSchema"

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


category = Instances("category", CategorySchema, models.Category)
category.model


class BookSchema(Schema):
    id = id_field()
    title = fields.String(required=True)
    description = fields.String(required=False, default="")
    category = fields.Nested(CategorySchema, required=False)
    category_id = fields.Integer(required=False)


book = Instances("book", BookSchema, models.Book)


class AuthorSchema(Schema):
    id = id_field()
    name = fields.String(required=True)


author = Instances("author", AuthorSchema, models.Author)


class BookAuthorSchema(Schema):
    id = id_field()
    book = fields.Nested(BookSchema, required=True)
    book_id = fields.Integer(required=True)
    author = fields.Nested(AuthorSchema, required=True)
    author_id = fields.Integer(required=True)


book_author = Instances("book_author", BookAuthorSchema, models.BookAuthor)


class PublisherSchema(Schema):
    id = id_field()
    name = fields.String(required=True)


publisher = Instances("publisher", PublisherSchema, models.Publisher)


class BookCopySchema(Schema):
    id = id_field()
    year_published = fields.Integer(required=False)
    book = fields.Nested(BookSchema, required=True)
    book_id = fields.Integer(required=True)
    publisher = fields.Nested(PublisherSchema, required=True)
    publisher_id = fields.Integer(required=True)


book_copy = Instances("book_copy", BookCopySchema, models.BookCopy)


class LibrarianSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True, load_only=True)
    admin = fields.Boolean(required=False, default=False)


librarian = Instances("librarian", LibrarianSchema, models.Librarian)


class AccountSchema(Schema):
    username = fields.String(required=True)
    admin = fields.Boolean(required=False, default=False)


account = Instances("account", AccountSchema)


class Identity(Schema):
    account = fields.Nested(AccountSchema, required=False, default=None)


identity = Instances("identity", Identity)


class LogInSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True, load_only=True)


login = Instances("login", LogInSchema, models.Librarian)


class Jwt(Schema):
    token = fields.String(required=True)


jwt = Instances("jwt", Jwt)


class UnauthorizedSchema(Schema):
    msg = fields.String(required=False)


unauthorized = Instances("unauthorized", UnauthorizedSchema)


@app.jwt.user_identity_loader
def user_identity_lookup(user: Any) -> Any:
    return identity.one.dump(user)


@app.jwt.user_lookup_loader
def user_lookup_loader(_jwt_header: dict[str, Any], jwt_data: dict[str, Any]):
    print("jwt", _jwt_header, jwt_data)

    return identity.one.load(jwt_data["sub"])
