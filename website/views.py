from flask import Blueprint, render_template, redirect, url_for, request
from flask_login import  login_required, current_user
from website.map import buildmap
from website.map import build_weekday_map
from datetime import datetime
import folium
import sys
# create a new blueprint, which defines how the website can be accessed
views = Blueprint('views',__name__,)




@views.route("/")
def home():
    if (current_user.is_authenticated):
        return redirect(url_for("views.base", user = current_user))
    else:
        return redirect(url_for("auth.login"))

variable = "variables can be passed this way"

@views.route("/map/", methods=['GET','POST'])
def map():
        
        #print(str(start), file=sys.stdout)
    buildmap(current_user)
    temp = render_template("map.html")
    return temp
    
  
  
    



@views.route("/displaymap/")
def map1():
    temp = render_template("map1.html")
    return temp

@views.route("/base/")
def base():
    return render_template("base.html", user = current_user)

# example for routing for filteroption "monday" <- 
@views.route("/wednesday/")
def weekday():
    build_weekday_map(current_user, "Wednesday")
    return render_template("mapWednesday.html")
