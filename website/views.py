from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
import pandas as pd
from website.map import buildmap
from website.map import metadata
from website.map import build_date_map
from datetime import datetime
import folium
import sys
import csv
from os import path, mkdir
from flask import send_file
from . import db
from random import randint
# create a new blueprint, which defines how the website can be accessed
views = Blueprint('views', __name__,)


@views.route("/")
def home():
    if (current_user.is_authenticated):
        return redirect(url_for("views.map"))
    else:
        return redirect(url_for("auth.login"))


variable = "variables can be passed this way"

@views.route("/map/", methods=['GET', 'POST'])
@login_required
def map():

    if request.method == 'POST':
        print("Filter button POST")
        random_number = randint(1, 9999999999)

        # getting values from html form
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        start_time = request.form.get('start_time')
        end_time = request.form.get('end_time')
        build_date_map(current_user, start_date,
                       end_date, start_time, end_time, random_number)
        # add metadata

        

        df_metadata = metadata(current_user)
        temp = render_template("map.html", Metadata=zip(
            df_metadata.columns, df_metadata.loc[0]), df_metadata=df_metadata, random_number = random_number)
        #print(str(start), file=sys.stdout)
        return temp

    if request.method == 'GET':

        if not current_user.survey_part1_answered:
            return redirect(url_for("views.survey_part1"))

        random_number = randint(1, 9999999999)

        buildmap(current_user, random_number)
        # add metadata
        df_metadata = metadata(current_user)

        return render_template("map.html", Metadata=zip(df_metadata.columns, df_metadata.loc[0]), df_metadata=df_metadata, random_number = random_number)


@views.route("/displaymap/")
@login_required
def map1():
    random_number = request.args.get("random_number")

    if not current_user.survey_part1_answered:
            return redirect(url_for("views.survey_part1"))
            
    temp = render_template("iframes/map"+random_number+".html")
    return temp


@views.route("/survey_part1/")
@login_required
def survey_part1():
    if  current_user.survey_part1_answered:
        return redirect(url_for("views.map"))

    return render_template("survey.html")

@views.route("/survey_part2/")
@login_required
def survey_part2():
    if not current_user.survey_part1_answered:
            return redirect(url_for("views.survey_part1"))

    if current_user.survey_part2_answered:
        return redirect(url_for("views.map"))

    return render_template("survey2.html")


@views.route("/receivedata_part1/", methods=['POST'])
@login_required
def receivedata_part1():

    saveSurveyData(request.data, "part1/")

    current_user.survey_part1_answered = True
    db.session.commit()
    print("survey part 2: "+str(current_user.survey_part2_answered))
    return ""

@views.route("/receivedata_part2/", methods=['POST'])
@login_required
def receivedata_part2():

    saveSurveyData(request.data, "part2/")
    current_user.survey_part2_answered = True
    db.session.commit()
    print("survey part 2: "+str(current_user.survey_part2_answered))
    
    return ""

def saveSurveyData(data, directory):
    
    data = request.data
    
    if not path.exists('surveyData/'):
        mkdir("surveyData/")
    if not path.exists('surveyData/'+directory):
        mkdir("surveyData/"+directory)


    with open("surveyData/"+directory+current_user.username+".csv", "wb") as binary_file:
        
        # data starts with : 'data="Screen index","Type of[...]'
        #get rid of 'data='
        data = data[5:]
        binary_file.write(data)

    if not path.exists("surveyData/"+directory+current_user.username+".csv"):
        print("Error while saving survey data for user "+current_user.username+" in "+directory+".")
    



@views.route('/get_image')
def get_image():
    img = request.args.get("image")
    directory ="./templates/img/"
    return send_file(directory+img, mimetype='image/gif')