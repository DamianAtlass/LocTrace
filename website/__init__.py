from flask import Flask, flash
from flask_sqlalchemy import SQLAlchemy
from os import path
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, logout_user





db = SQLAlchemy()

DB_NAME = "database.db"

def create_app():
        app = Flask(__name__)
        #important for remembering users
        app.config["SECRET_KEY "] = "asdjfhakljsdgjf"

        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
        
        #disables Flask-SQLAlchemy's event system, which is not used anyway
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        db.init_app(app)

        # Set the secret key to some random bytes. Keep this really secret!
        app.secret_key = "sfdjksdafeljkksdf"

        



        #register views/urls
        #from [file] import [Blueprint]
        from .views import views
        from .auth import auth

        app.register_blueprint(views, url_prefix="/")
        app.register_blueprint(auth, url_prefix="/")


        from .models import User
        create_database(app)

        #login_manager remembers logged-in users
        login_manager = LoginManager()
        login_manager.login_view = "auth.login"
        login_manager.init_app(app)

        @login_manager.user_loader
        def load_user(id):
            return User.query.get(int(id))

        return app

#this function checks if an 'old' database already exists and if so deletes it
#this prevents that the same users are pasted in the database multiple time, concluding in an error, since usernames must be unique
#after that a new (empty) database is created. It will be filled with data in auth.login("GET")
def create_database(app):
    import os
    
    if path.exists('website/' + DB_NAME):
        print("An old database has been found...", end="")
        os.remove('website/' + DB_NAME)
        if path.exists('website/' + DB_NAME):
            print("removel of old database was unsucessfull.")
        else:
            print("removel of old database was sucessfull.")
    else:
        print("No old database found.")

    db.create_all(app=app)
    if path.exists('website/' + DB_NAME):
            print('Created a new Database!')
    else:
        print("The app failed to build a new database.")
    