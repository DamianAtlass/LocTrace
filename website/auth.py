from re import L
from flask import Blueprint, render_template, request, redirect, url_for, flash
import pandas as pd
from .models import User, Stop_h, Stop_w, State
from . import db
from flask_login import login_user, login_required, logout_user, current_user
from os import path
from sqlalchemy import func
from .map import getHomeLoc, getWorkLoc
import time
from geopy.geocoders import Nominatim
import numpy as np


auth = Blueprint('auth',__name__)

REQUIRE_PW_TO_LOAD_DB = False
PW_DB = "apfelkuchen"

#automatically load database (not password-protected!)
DB_AUTOLOAD = True
#file from which the users' usernames will be added to the local sqlalchemy database
LOG_IN_DATA_FILE  = "logindata.csv"


@auth.route("/login/", methods=["GET", "POST"])
def login():

    load_database()

    #manages log in, redirectes and informs user if log-in failed
    if request.method =="POST":
        username_login = request.form.get("username")
        user = User.query.filter_by(username=username_login).first()


        if user:
            login_user(user, remember=True)
            flash("Logged in successfully!", category="success")
            print("User "+user.username+" logged in.")
            return redirect(url_for("views.map", username=username_login))
        else:
            flash("No user named '"+username_login+"' has been found.", category="error")
            if not User.query.first():
                flash("No users in database found.", category="error")
        
        return redirect(url_for("auth.login"))

    #sends log-in page to user and checks if database needs to be loaded
    if request.method =="GET":
        
            
        return render_template("login.html")

@auth.route("/logout/")
@login_required
def logout():
    logout_user()
    flash("Loggend out successfully!", category="success")
    return redirect(url_for("auth.login"))


#this route is important when the database is not automatically loaded
@auth.route("/force_load_database/", methods=["GET", "POST"])
def force_load_database():
    #loads db if REQUIRE_PW_TO_LOAD_DB is set to False
    #sends simple form to confirm PW_DB if REQUIRE_PW_TO_LOAD_DB is set to True
    if request.method =="GET":

            if not REQUIRE_PW_TO_LOAD_DB:
                print("Force reload of database...")
                load_users()
                calculateSigLocs()
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

        print("Force reload of database...")
        load_users()
        calculateSigLocs()
        return redirect(url_for("auth.login"))


def load_database():
    if(State.query.count()==0):
        state = State()
        state.db_loaded = False
        state.sigLoc_loaded = False
                        
        db.session.add(state)
        db.session.commit()
    
    #if db is empty
    if State.query.first().db_loaded == False:
        load_users()
        State.query.first().db_loaded = True
        db.session.commit()


    if State.query.first().sigLoc_loaded == False:
        calculateSigLocs()
        State.query.first().sigLoc_loaded = True
        db.session.commit()


#loads log-in data from LOG_IN_DATA_FILE (csv) in a local sqlanchemy database in order to work with flask-login
def load_users():
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
                new_user.sigLoc_loaded = False
                                
                db.session.add(new_user)
                db.session.commit()
                new = new+1
                


        print("done.\n"+str(old)+" user(s) already in database. "+str(new)+" new user(s) added. ", end="")
        
        number_of_users = User.query.count()
        print(str(number_of_users)+" users in database.")

        if number_of_users == 0:
                    flash("No users found in database.", category="error")
                    print("No users found in database!")
    else:
        print("No file "+ LOG_IN_DATA_FILE +" found!" , end="")
        number_of_users = User.query.count()
        print(str(number_of_users)+" users in database.")
    print("")

def calculateSigLocs():
    c = 0
    print("Calculate significant locations...this might take a few seconds.")
    start = time.time()
    geolocator = Nominatim(user_agent="LocTrace")
 
    for user in User.query:
        stops_path = "data/" + user.username + "/stops.csv"

        #skip this iteration if path doesn't exist
        if not path.exists(stops_path):
            print("File '"+stops_path+"' for user '" +user.username+"' doesn't exist. Can't calculate significant locations.")
            continue

        if user.sigLoc_loaded:
            continue

        

        stops = pd.read_csv(stops_path)

        #calculate home location
        h_dic = getHomeLoc(stops)

        #get adress
        adress, coordinates = geolocator.reverse(str(h_dic["latitude"])+" "+str(h_dic["longitude"]))

        #create Stop object
        home = Stop_h(latitude = h_dic["latitude"], longitude = h_dic["longitude"],timestamp = h_dic["start"], adress = adress, user_id = user.id)
        
        #add to db and commit
        db.session.add(home)
        db.session.commit()

        

        #calculate work location
        w_list = getWorkLoc(stops, h_dic)
        
        #do the same as with the home lcoation
        for entry in w_list:
            
            adress, coordinates = geolocator.reverse(str(entry["latitude"])+" "+str(entry["longitude"]))
            work = Stop_w(latitude = entry["latitude"], longitude = entry["longitude"],timestamp = entry["start"], adress = adress, user_id= user.id)

            db.session.add(work)
            db.session.commit()
        
        

        if len(user.home) == 0 and len(user.home) == 0:
            print("Problem while calculating sigLocs of user "+ user.username)
        else:
            c+=1
            #mark that sigLocs have been calculated
            user.sigLoc_loaded = True
            db.session.commit()

    end = time.time()
    print("...done. Calculated significant locations for "+ str(c)+ " user(s) in "+ str(np.round(end - start, 2))+" seconds.\n") 



