from typing import Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .flask import app, db, bcrypt

VARCHAR_LENGTH = 255
BCRYPT_LENGTH = 60


class Category(db.Model):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(VARCHAR_LENGTH), nullable=False)

    books: Mapped[list["Book"]] = relationship(back_populates="category")


class Book(db.Model):
    __tablename__ = "book"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(VARCHAR_LENGTH), nullable=False)
    description: Mapped[str] = mapped_column(
        String(VARCHAR_LENGTH), nullable=False, default=""
    )

    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("category.id"))
    category: Mapped[Optional["Category"]] = relationship(back_populates="books")

    authors: Mapped[list["BookAuthor"]] = relationship(back_populates="book")

    copies: Mapped[list["BookCopy"]] = relationship(back_populates="book")


class Author(db.Model):
    __tablename__ = "author"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(VARCHAR_LENGTH), nullable=False)

    books: Mapped[list["BookAuthor"]] = relationship(back_populates="author")


class BookAuthor(db.Model):
    __tablename__ = "book_author"

    id: Mapped[int] = mapped_column(primary_key=True)

    book_id: Mapped[int] = mapped_column(ForeignKey("book.id"), nullable=False)
    book: Mapped["Book"] = relationship(back_populates="authors")

    author_id: Mapped[int] = mapped_column(ForeignKey("author.id"), nullable=False)
    author: Mapped["Author"] = relationship(back_populates="books")


class Publisher(db.Model):
    __tablename__ = "publisher"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(VARCHAR_LENGTH), nullable=False)

    copies: Mapped[list["BookCopy"]] = relationship(back_populates="publisher")


class BookCopy(db.Model):
    __tablename__ = "book_copy"

    id: Mapped[int] = mapped_column(primary_key=True)
    year_published: Mapped[Optional[int]] = mapped_column()

    book_id: Mapped[int] = mapped_column(ForeignKey("book.id"), nullable=False)
    book: Mapped["Book"] = relationship(back_populates="copies")

    publisher_id: Mapped[int] = mapped_column(
        ForeignKey("publisher.id"), nullable=False
    )
    publisher: Mapped["Publisher"] = relationship(back_populates="copies")


class Librarian(db.Model):
    __tablename__ = "librarian"

    username: Mapped[str] = mapped_column(String(VARCHAR_LENGTH), primary_key=True)
    password: Mapped[str] = mapped_column(String(BCRYPT_LENGTH), nullable=False)
    admin: Mapped[bool] = mapped_column(nullable=False, default=False)


with app.app_context():
    if app.debug:
        db.drop_all()

    db.create_all()
    db.session.add(
        Librarian(
            username="admin",
            password=bcrypt.generate_password_hash(app.config["ADMIN_PASSWORD"]),
            admin=True,
        )  # type: ignore
    )
    db.session.commit()
