from flask import Blueprint, render_template, request
import pandas as pd

auth = Blueprint('auth',__name__)

#read data and put it in a dataframe
df = pd.read_csv("logindata.csv")


@auth.route("/login/", methods=["GET", "POST"])
def login():
    if request.method =="POST":
        username = request.form.get("username")
        pw = request.form.get("password")
        print("username: "+ username+" pw: "+pw)
        # get right row
        data_pair = df.loc[df['username'] == username ]

        # get right column
        password_df = data_pair.iloc[0, 1]
        
        if(pw == password_df):
            return render_template("map.html", username = username)
            #("map.html", foo = variable)
        else:
             return "not logged in"


    if request.method =="GET":
        temp = render_template("login.html")
        return temp

