from flask import Blueprint, render_template, request
import pandas as pd

auth = Blueprint('auth',__name__)

#read data and put it in a dataframe
df = pd.read_csv("logindata.csv")


@auth.route("/login/", methods=["GET", "POST"])
def login():
    if request.method =="POST":

        username = request.form.get("username")
        password_login = request.form.get("password")
        #print("username: "+ username+" pw: "+pw)

        # get user-password pair for corresponding username
        data_pair = df.loc[df['username'] == username ]

        #check if user exists and if it is unique
        len = data_pair.shape[0]  # Gives number of rows
        
        if len < 1:
            return "ERROR: user doesn't exist"
        
        if len > 1:
            return "ERROR: multiple users with same username found"

        

        # get right column
        password_df = data_pair.iloc[0, 1]

        
        
        if(password_login == password_df):
            return render_template("map.html", username = username)
        else:
             return "password incorrect"


    if request.method =="GET":
        temp = render_template("login.html")
        return temp

