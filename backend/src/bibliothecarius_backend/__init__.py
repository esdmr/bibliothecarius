from app import app
import models
import schemas
import account
import challenge
import api

if __name__ == "__main__":
    app.run(debug=True)
