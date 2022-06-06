#import cgi;
from email.policy import default
from flask import render_template
import folium
import pandas as pd
import branca
import branca.colormap as cm
from datetime import datetime


# loading all the loc data
# using panda dataframe


# function for building the map with given data
def buildmap(user):
    '''
    userStr = str(user)[1:-1].replace(" ","")
    #print(str(user))
    print(type(userStr)) 
    print(userStr)
    print("username: " +  user.username)
    '''

    csv_path = "website/data/" + user.username + ".csv"

    data = pd.read_csv(csv_path)

    location = data['latitude'].mean(), data['longitude'].mean()

    m3 = folium.Map(
        location,
        zoom_start=15)

    colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                 index=[0, 100, 250, 500, 700, 1000], vmin=0, vmax=1000,
                                 caption='motion score')
    m3.add_child(colormap)

    for i in range(0, len(data)-1):
        loc1 = data['latitude'].iloc[i], data['longitude'].iloc[i]
        loc2 = data['latitude'].iloc[i+1], data['longitude'].iloc[i+1]

        loc = [loc1, loc2]

        color_ = colormap(data['motion_score'][i])

        folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m3)

    m3.save('website/templates/map1.html')

    return m3


# funtion for building map that shows data at a requested day of the week

def build_weekday_map(user, weekday):
    # mapping int to weekday
    weekDays = {0: "Monday", 1: "Tuesday", 2: "Wednesday",
                3:  "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}

    '''
    # get Stringformatted Username
    userStr = str(user)[1:-1].replace(" ","")
    #for debugging delete later <---
    print(type(userStr)) 
    print(userStr)
     '''

    csv_path = "website/data/" + user.username + ".csv"

    # get Data for user
    data = pd.read_csv(csv_path)
    newData = pd.DataFrame()

    for i in range(0, len(data)-1):
        dataWeekday = data['ts'].iloc[i]
        # vllt problem, wegen :00
        # weekday of data row as Integer
        data_weekday = datetime.strptime(
            dataWeekday, '%Y-%m-%d %H:%M:%S+%f:00').weekday()

        # if required weekday, add to newDataframe
        if weekDays[data_weekday] == weekday:
            newData = pd.concat([newData, data.iloc[[i]]])

    # create new folium map with filterd Data
    location = newData['latitude'].mean(), newData['longitude'].mean()
    print(location)

    m3 = folium.Map(
        location,
        zoom_start=15)

    colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                 index=[0, 100, 250, 500, 700, 1000], vmin=0, vmax=1000,
                                 caption='motion score')
    m3.add_child(colormap)

    for i in range(0, len(newData)-1):
        loc1 = newData['latitude'].iloc[i], newData['longitude'].iloc[i]
        loc2 = newData['latitude'].iloc[i+1], newData['longitude'].iloc[i+1]

        loc = [loc1, loc2]

        color_ = colormap(newData['motion_score'][i])

        folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m3)

    mapPath = "website/templates/map" + weekday + ".html"
    print("mapPath:" + mapPath)
    m3.save(mapPath)

# funktioniert bisher nur für den 27-10-2021, weil keine anderen daten in csv-datei
# expl week, needs to be adjusted {"2021-10-25" : 0 , "2021-10-26" : 1, "2021-10-27" : 2, "2021-10-28" : 3, "2021-10-29" : 4, "2021-10-30" : 5,"2021-10-31" : 6}


def build_date_map(user, req_start_date, req_end_date, req_start_time, req_end_time):

    # creating comaprable ints form string dates
    date_values = {"2021-10-25": 1, "2021-10-26": 2, "2021-10-27": 3,
                   "2021-10-28": 4, "2021-10-29": 5, "2021-10-30": 6, "2021-10-31": 7}

    # convert to int and if no time request, then set req time span to whole day
    if (req_start_time == "" or req_start_time == ""):
        req_start_time_int = 0
        start_date_value = 0
    else:
        req_start_time_int = int(
            req_start_time[0:2])*100 + int(req_start_time[3:5])
        start_date_value = date_values[str(req_start_date)]

    if (req_end_time == ""):
        req_end_time_int = 2359
        end_date_value = 0
    else:
        req_end_time_int = int(req_end_time[0:2])*100 + int(req_end_time[3:5])
        end_date_value = date_values[str(req_end_date)]

     # get Data for user
    csv_path = "website/data/" + user.username + ".csv"
    data = pd.read_csv(csv_path)
    newData = pd.DataFrame()

    for i in range(0, len(data)-1):
        dataDate = data['ts'].iloc[i]
        # vllt problem, wegen :00
        # date from timestamp in data
        data_date = datetime.strptime(
            dataDate, '%Y-%m-%d %H:%M:%S+%f:00').date()
        data_time = str(datetime.strptime(
            dataDate, '%Y-%m-%d %H:%M:%S+%f:00').time())[0:5]
        data_time_int = int(data_time[0:2])*100 + int(data_time[3:5])

        # if required date, add to newDataframe

        print(req_start_time == "")
        print('r_end_time:' + str(req_end_time))

        if start_date_value <= date_values[str(data_date)] and date_values[str(data_date)] <= end_date_value and req_start_time_int <= data_time_int and data_time_int <= req_end_time_int:

            newData = pd.concat([newData, data.iloc[[i]]])

    print(newData)

    # if dataframe is empty (no locations at selected date intervall) then build empty map doesn't work, idk why

    if (newData.empty):
        location = data['latitude'].mean(), data['longitude'].mean()
        m4 = folium.Map(
            location,
            zoom_start=15)

        colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                     index=[0, 100, 250, 500, 700, 1000], vmin=0, vmax=1000,
                                     caption='motion score')
        m4.add_child(colormap)
        m4.save("website/templates/map_date.html")

    else:

        # create new folium map with filterd Data
        location = newData['latitude'].mean(), newData['longitude'].mean()

        m4 = folium.Map(
            location,
            zoom_start=15)

        colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                     index=[0, 100, 250, 500, 700, 1000], vmin=0, vmax=1000,
                                     caption='motion score')
        m4.add_child(colormap)

        for i in range(0, len(newData)-1):
            loc1 = newData['latitude'].iloc[i], newData['longitude'].iloc[i]
            loc2 = newData['latitude'].iloc[i +
                                            1], newData['longitude'].iloc[i+1]

            loc = [loc1, loc2]

            color_ = colormap(newData['motion_score'][i])

            folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m4)

        m4.save("website/templates/map_date.html")


def metadata():
    csv_path = "website/data/" + "mobility_report" + ".csv"
    df = pd.read_csv(csv_path)
    return df
