from flask import Flask, flash
from flask_login import LoginManager
from .user import User
from flask import session




def create_app():
        app = Flask(__name__)
        app.config["SECRET_KEY "] = "asdjfhakljsdgjf"

        # Set the secret key to some random bytes. Keep this really secret!
        app.secret_key = "sfdjksdaföljkksdf"

        login_manager = LoginManager()
        login_manager.login_view = "auth.login"
        #todo: flash
        login_manager.login_message = "Anmelden!"
        login_manager.init_app(app)

        @login_manager.user_loader
        def load_user(username):
                return User.get_username(username)

        #register views/urls
        #from [file] import [Blueprint]
        from .views import views
        from .auth import auth

        app.register_blueprint(views, url_prefix="/")
        app.register_blueprint(auth, url_prefix="/")


        return app