from re import L
from flask import Blueprint, render_template, request, redirect, url_for, flash
import pandas as pd
from .models import User
from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user


auth = Blueprint('auth',__name__)

REQUIRE_PW_TO_LOAD_DB = True
PW_DB = "apfelkuchen"

#automatically load database (not password-protected!)
DB_AUTOLOAD = True
#file from which the users' usernames and passwords will be added to the local sqlalchemy database
LOG_IN_DATA_FILE  = "logindata.csv"


@auth.route("/login/", methods=["GET", "POST"])
def login():

    #manages log in, redirectes and informs user if log-in failed
    if request.method =="POST":
        username_login = request.form.get("username")
        password_login = request.form.get("password")
        user = User.query.filter_by(username=username_login).first()


        if user:
            if check_password_hash(user.password, password_login):
                login_user(user, remember=True)
                flash("Loggend in successfully!", category="success")
                print("User "+user.username+" logged in.")
                return redirect(url_for("views.map", username=username_login))
            else:
                flash("Password incorrect.", category="error")
        else:
            flash("No user named '"+username_login+"' has been found.", category="error")
        
        return redirect(url_for("auth.login"))

    #sends log-in page to user and checks if database needs to be loaded
    if request.method =="GET":
        #if db is empty and DB_AUTOLOAD is True
        if DB_AUTOLOAD and User.query.first() == None:
            load_database()
            
        return render_template("login.html")

@auth.route("/logout/")
@login_required
def logout():
    logout_user()
    flash("Loggend out successfully!", category="success")
    return redirect(url_for("auth.login"))

#this route is important when the database is not automatically loaded
@auth.route("/loaddb/", methods=["GET", "POST"])
def loaddb():
    #loads db if REQUIRE_PW_TO_LOAD_DB is set to False
    #sends simple form to confirm PW_DB if REQUIRE_PW_TO_LOAD_DB is set to True
    if request.method =="GET":
            if not User.query.first() == None:
                return "Database already loaded."

            if not REQUIRE_PW_TO_LOAD_DB:
                load_database()
                db_loaded = True
                return redirect(url_for("auth.login"))

            return '''<form method="POST">
            Enter password to load database
            <div class="form-group">
                <input
                Enter password to load database
                type="password"
                class="form-control"
                id="password"
                name="load_db_password"
                />
            </div>
            <button type="submit" >Login</button>
        
        </form>'''

    #validates PW_DB if REQUIRE_PW_TO_LOAD_DB is set to True and loads database
    if request.method =="POST":

        pw_db_form = request.form.get("load_db_password")
        print("pw_db: "+pw_db_form)
        if pw_db_form != PW_DB:
            return "wrong pw, pw can be found in auth.py"

        load_database()
        return redirect(url_for("auth.login"))

    
#loads log-in data from LOG_IN_DATA_FILE (csv) in a local sqlanchemy database in order to work with flask-login
def load_database():
    #read data and put it in a dataframe
    df = pd.read_csv(LOG_IN_DATA_FILE)

    print("Add users to database...", end="")
    # add users from datafram in db
    c = 0
    
    for index, row in df.iterrows():
        new_user = User()
        new_user.username = row['username']
        new_user.password = generate_password_hash(row['password'], method="sha256")
        
        db.session.add(new_user)
        db.session.commit()
        c = c+1

    print("done. "+str(c)+" users were added.")

    if User.query.first() == None:
                flash("No users found in database.", category="error")
                print("The app tried to import users from "+ LOG_IN_DATA_FILE +" but failed.")

