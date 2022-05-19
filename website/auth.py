from flask import Blueprint, render_template, request,  redirect, url_for
import pandas as pd
from .models import User
from . import db
from flask_sqlalchemy import SQLAlchemy
from flask_login import login_user, login_required, logout_user, current_user


auth = Blueprint('auth',__name__)

REQUIRE_PW_TO_LOAD_DB = True
PW_DB = "apfelkuchen"

#automatically load database (not password-protected!)
DB_AUTOLOAD = True



@auth.route("/login/", methods=["GET", "POST"])
def login():
    if request.method =="POST":

        username = request.form.get("username")
        password_login = request.form.get("password")
        print("LOGIN: username: "+ username+" pw: "+password_login)
        user = User.query.filter_by(username=username).first()


        if user:
            if user.password == password_login:
                login_user(user, remember=True)
                return redirect(url_for("views.map", username=password_login))
            else:
                return "worng pw"
        else:
            return "no user"


    if request.method =="GET":
        #if db is empty
        if  User.query.first() == None and DB_AUTOLOAD:
            if REQUIRE_PW_TO_LOAD_DB:
                load_database()

        
        temp = render_template("login.html")
        return temp

@auth.route("/logout/")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))

@auth.route("/loaddb/", methods=["GET", "POST"])
def loaddb():
    if request.method =="POST":

        pw_db_form = request.form.get("load_db_password")
        print("pw_db: "+pw_db_form)
        if pw_db_form != PW_DB:
            return "wrong pw, pw can be found in auth.py"

        
        load_database()

        return redirect(url_for("auth.login"))

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

def load_database():
    #read data and put it in a dataframe
    df = pd.read_csv("logindata.csv")

    print("Add users to database...", end="")
    # add users from datafram in db
    c = 0
    
    for index, row in df.iterrows():
        new_user = User()
        new_user.password = row['password']
        new_user.username = row['username']       

        db.session.add(new_user)
        db.session.commit()
        c = c+1

    print("done. "+str(c)+" users were added.")
