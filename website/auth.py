from flask import Blueprint, render_template, request, redirect, url_for, flash
import pandas as pd
from .models import User, Stop_h, Stop_w, State
from . import db
from flask_login import login_user, login_required, logout_user, current_user
from os import path
from .map import getHomeLoc, getWorkLoc
import time
from geopy.geocoders import Nominatim
import numpy as np
from werkzeug.security import generate_password_hash, check_password_hash


auth = Blueprint('auth',__name__)

REQUIRE_PW_TO_LOAD_DB = True
#second parameter is the password for loading the database
PW_DB = generate_password_hash("apfelkuchen", method="sha256")


#file from which the users' usernames will be added to the local sqlalchemy database
LOG_IN_DATA_FILE  = "logindata.csv"


@auth.route("/login/", methods=["GET", "POST"])
def login():

    #manages login, redirectes and informs user if log-in failed
    if request.method =="POST":
        username_login = request.form.get("username")
        password_login = request.form.get("password")


        user = User.query.filter_by(username=username_login).first()

        if user:
            if check_password_hash(user.password, password_login):
                login_user(user, remember=True)
                print("User "+user.username+" logged in.")
                return redirect(url_for("views.survey_part1"))
            else:
                flash("Password for user '"+ username_login +"' incorrect.", category="error")
                print("Unsuccessful login attempt by user "+user.username+".")

        else:
            flash("No user named '"+username_login+"' has been found.", category="error")
            if not User.query.first():
                flash("No users in database found.", category="error")
        
        return redirect(url_for("auth.login"))

    #sends log-in page to user
    if request.method =="GET":
        #checks if database needs to be loaded, and does so
        load_database()
        return render_template("login.html")

@auth.route("/logout/")
@login_required
def logout():
    print("User "+current_user.username+" logged out.")
    logout_user()
    return redirect(url_for("auth.login"))

#Force-reloads database. Only needed if data is added after running the server
@auth.route("/loaddb/", methods=["GET", "POST"])
def loaddb():
    #sends simple form to confirm PW_DB if REQUIRE_PW_TO_LOAD_DB is set to True
    if request.method =="GET":

            if not REQUIRE_PW_TO_LOAD_DB:
                print("Force reload of database...")
                load_users()
                calculateSigLocs()
                return redirect(url_for("auth.login"))

            return '''<form method="POST">
            Enter password to reload database.<br>Note that the database is usually loaded after creation and only needs to be reloaded manually, if new data has been added after its creation.
            <div class="form-group">
                <input
                Enter password to load database
                type="password"
                class="form-control"
                id="password"
                name="load_db_password"
                />
            </div>
            <button type="submit" >Submit</button>
        
        </form>'''

    #validates PW_DB if REQUIRE_PW_TO_LOAD_DB is set to True and loads database
    if request.method =="POST":

        pw_db_form = request.form.get("load_db_password")
        if not check_password_hash(PW_DB, pw_db_form):
            return "wrong pw, pw can be found in auth.py"
        else:
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
        
        #some variables to provide interesting information
        new = 0
        old = 0
        p = 0

        for index, row in df.iterrows():
            username_df = row['username']

            #if user with same username is already in database, don't add them again
            if User.query.filter_by(username=username_df).first():
                old=old+1

                #however, check if they have a new password and set it, if so
                existing_user = User.query.filter_by(username=username_df).first()
                
                if not check_password_hash(existing_user.password, row['password']):
                    existing_user.password = generate_password_hash(row['password'], method="sha256")
                    db.session.commit()
                    p=p+1
                    
            else:
                #build new user
                new_user = User()
                new_user.username = username_df
                new_user.password = generate_password_hash(row['password'], method="sha256")
                new_user.sigLoc_loaded = False
                new_user.survey_part1_answered = False
                new_user.survey_part2_answered = False
                
                #add new user
                db.session.add(new_user)
                db.session.commit()
                new = new+1
                


        print("done.\n"+str(old)+" user(s) already in database. "+str(new)+" new user(s) added. ")
        print(str(p) +" password(s) have been updated.", end=" ")

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

        # skip if sigLocs already have been loaded
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


