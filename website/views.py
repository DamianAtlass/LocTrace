from flask import Blueprint, render_template, request
from website.map import buildmap
from datetime import datetime
import folium
import sys
import datetime
import pandas as pd



def filter_by_date_range(start_date,start_time, end_date, end_time):
    start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    start_time = datetime.datetime.strptime(start_time, "%H:%M")
    end_date = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    end_time = datetime.datetime.strptime(end_time, "%H:%M")
    
    start_datetime = datetime.datetime.combine(start_date, start_time.time())
    end_datetime = datetime.datetime.combine(end_date, end_time.time())
    
    data = pd.read_csv("website/data/example_gps.csv")
    df_filtered = pd.DataFrame(columns =['Unnamed: 0', 'ts', 'longitude', 'latitude', 'altitude', 'accuracy', 'motion_score', 'y', 'x'])
    
    data['ts']= data['ts'].apply(lambda x: datetime.datetime.strptime(x, "%Y-%m-%d %H:%M:%S+02:00"))
    data_filtered =data[start_datetime <= data['ts']]
    data_filtered2 =data_filtered[ data['ts'] <= end_datetime]
    

    return data_filtered2
# create a new blueprint, which defines how the website can be accessed
views = Blueprint('views',__name__,)




@views.route("/")
def base():
    temp = render_template("base.html")
    return temp

variable = "variables can be passed this way"

@views.route("/map/", methods=['GET','POST'])
def map():
    
    if request.method == 'POST':


        #print(str(start), file=sys.stdout)
        buildmap()
        temp = render_template("map.html")
        return temp
    else:
        temp = render_template("map.html")
        return temp
    temp = render_template("map.html")
    return temp
    



@views.route('/filter', methods=['POST'])
def filter():
    start_date = request.form['start_date']
    start_time = request.form['start_time']
    end_date = request.form['end_date']
    end_time = request.form['end_time']
    data = filter_by_date_range(start_date,start_time, end_date, end_time)
    buildmap(data)
    return render_template('map.html', data=data)




@views.route("/displaymap/")
def map1():
    temp = render_template("map1.html")
    return temp



@views.route("/login/")
def login():
    temp = render_template("login.html")
    return temp

