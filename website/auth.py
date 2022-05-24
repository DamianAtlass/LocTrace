from re import L
from flask import Blueprint, render_template, request, redirect, url_for, flash
import pandas as pd
from .models import User
from . import db
from flask_login import login_user, login_required, logout_user, current_user
from os import path
from sqlalchemy import func


auth = Blueprint('auth',__name__)

REQUIRE_PW_TO_LOAD_DB = False
PW_DB = "apfelkuchen"

#automatically load database (not password-protected!)
DB_AUTOLOAD = False
#file from which the users' usernames will be added to the local sqlalchemy database
LOG_IN_DATA_FILE  = "logindata.csv"


@auth.route("/login/", methods=["GET", "POST"])
def login():

    #manages log in, redirectes and informs user if log-in failed
    if request.method =="POST":
        username_login = request.form.get("username")
        user = User.query.filter_by(username=username_login).first()


        if user:
            login_user(user, remember=True)
            flash("Loggend in successfully!", category="success")
            print("User "+user.username+" logged in.")
            return redirect(url_for("views.map", username=username_login))
        else:
            flash("No user named '"+username_login+"' has been found.", category="error")
            if not User.query.first():
                flash("No users in database found.", category="error")
        
        return redirect(url_for("auth.login"))

    #sends log-in page to user and checks if database needs to be loaded
    if request.method =="GET":
        #if db is empty and DB_AUTOLOAD is True
        if DB_AUTOLOAD:
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

            if not REQUIRE_PW_TO_LOAD_DB:
                load_database()
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
    print("LOAD DB")
    #read data and put it in a dataframe (if it exists)

    if path.exists(LOG_IN_DATA_FILE):

        df = pd.read_csv(LOG_IN_DATA_FILE)

        print("Add users to database...", end="")
        # add users from datafram in db
        new = 0
        old = 0

        for index, row in df.iterrows():
            username_df = row['username']

            if User.query.filter_by(username=username_df).first():
                old=old+1
                    
            else:
                new_user = User()
                new_user.username = username_df
                                
                db.session.add(new_user)
                db.session.commit()
                new = new+1
                


        print("done.\n"+str(old)+" user(s) already in database.\n"+str(new)+" new user(s) added.\n")
        
        number_of_users = User.query.count()
        print(str(number_of_users)+" users in database.")

        if User.query.first() == None:
                    flash("No users found in database.", category="error")
                    print("No users found in database!")
    else:
        print("No file "+ LOG_IN_DATA_FILE +" found!")
        number_of_users = User.query.count()
        print(str(number_of_users)+" users in database.")


