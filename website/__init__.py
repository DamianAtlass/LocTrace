from flask import Flask, flash
from flask_sqlalchemy import SQLAlchemy
from os import path
import pandas as pd
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, logout_user



db = SQLAlchemy()

DB_NAME = "database.db"

def create_app():
        app = Flask(__name__)
        app.config["SECRET_KEY "] = "asdjfhakljsdgjf"

        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
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

        login_manager = LoginManager()
        login_manager.login_view = "auth.login"
        login_manager.init_app(app)

        @login_manager.user_loader
        def load_user(id):
            return User.query.get(int(id))

        return app

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
    print("Remember to add users to the database by going to /loaddb/ once.")
    