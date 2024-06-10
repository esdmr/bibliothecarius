from app import app
import models
import schemas
import api
import account
import challenge

if __name__ == "__main__":
    app.run(debug=True)
