import folium
import pandas as pd
import branca.colormap as cm
from datetime import datetime
# import for home loc
import folium
import pandas as pd
import branca.colormap as cm
from datetime import datetime
from datetime import timedelta
import numpy as np
from os import path, mkdir, listdir, remove


# loading all the loc data
# using panda dataframe

def filter_by_date_range(start_date, start_time, end_date, end_time):
    start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    start_time = datetime.datetime.strptime(start_time, "%H:%M")
    end_date = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    end_time = datetime.datetime.strptime(end_time, "%H:%M")

    start_datetime = datetime.datetime.combine(start_date, start_time.time())
    end_datetime = datetime.datetime.combine(end_date, end_time.time())

    data = pd.read_csv("website/data/example_gps.csv")
    #df_filtered = pd.DataFrame(columns=['Unnamed: 0', 'ts', 'longitude', 'latitude', 'altitude', 'accuracy', 'motion_score', 'y', 'x'])

    data['ts'] = data['ts'].apply(
        lambda x: datetime.datetime.strptime(x, "%Y-%m-%d %H:%M:%S+02:00"))
    data_filtered = data[start_datetime <= data['ts']]
    data_filtered2 = data_filtered[data['ts'] <= end_datetime]

    return data_filtered2

# functions for calculation home and work location

# converts a str to a date


def toDate(str):
    return datetime.strptime(str[0:-6], "%Y-%m-%d %H:%M:%S")


# returns location of home
def getHomeLoc(stops):

    durationPerUniqueId = np.zeros(len(stops), dtype=np.int64)

    for i in range(0, len(stops)):
        durationPerUniqueId[stops.iloc[i]["unique_id"]] += stops.iloc[i]["duration"]

    max_index = np.argmax(durationPerUniqueId)
    #print("max: "+str(max_index))
    longest_visited_place = None

    for i in range(0, len(stops)):
        if stops.iloc[i]["unique_id"] == max_index:
            longest_visited_place = stops.iloc[i]
            break
    return longest_visited_place


def diff_id(loc1, loc2):
    if loc2 is None:
        return True
    if loc1["unique_id"] != loc2["unique_id"]:
        return True
    return False


def getDate(data):
    return toDate(data["start"])

# gets a pandas dataframe
# gives longest visited place


# returns an array of possible work locations
def getWorkLoc(stops, home):

    durationPerUniqueId = np.zeros(len(stops), dtype=np.int64)

    # add all durations sorted after unique_id (if it is not home's id)
    for i in range(0, len(stops)):

        if diff_id(stops.iloc[i], home) and toDate(stops["start"].iloc[i]).weekday() < 5:
            #print("weekday: "+str(toDate(stops.iloc[i]["start"]).weekday()))
            durationPerUniqueId[stops.iloc[i]["unique_id"]] += stops.iloc[i]["duration"]
    # get index (= unique_id) of biggest entry
    max_index = np.argmax(durationPerUniqueId)

    workplace = []

    # find first entry calculated unique_id and take it as work location
    for i in range(0, len(stops)):
        if stops.iloc[i]["unique_id"] == max_index:
            workplace.append(stops.iloc[i])
            break
    # get total time at work in hours
    time_worked = durationPerUniqueId[max_index]/(60*60)

    number_workdays = 0

    # calculate the number of work days
    # (not a nice way to do it this way, but since we're only working with relativly small data it should be fine)
    curr1 = getDate(stops.iloc[0])

    for i in range(0, len(stops)):
        # if stops.iloc[i] has different date than curr1
        if (getDate(stops.iloc[i]).date() - curr1.date()) != timedelta(days=0):

            # if this is a workday
            if getDate(stops.iloc[i]).weekday() < 5:
                number_workdays += 1

            # set curr to the next day
            curr1 = curr1 + timedelta(days=1)

    # to prevent errors
    if number_workdays == 0:
        number_workdays = 1

    # get average worktime per (work)day in hours
    avr_work = time_worked/number_workdays

    # (2*8) / 5 = 3.2 ->two days fulltime work at the same place will not trigger this yet
    if avr_work < 3:

        workplace = []
        curr2 = getDate(stops.iloc[0])
        temp = []
        max_index = None

        # go over all stops
        for i in range(0, len(stops)):
            # if stops.iloc[i] has different date than curr2
            if (getDate(stops.iloc[i]).date() - curr2.date()) != timedelta(days=0):

                # if this is a workday
                if len(temp) > 0 and getDate(temp[0]).weekday() < 5:
                    durationPerUniqueId = np.zeros(
                        len(stops)-1, dtype=np.int64)

                    # go over entries in temp
                    for i in range(0, len(temp)):
                        # if it's not the calculated home
                        if diff_id(temp[i], home):
                            # add on index ["unique_id"] to durationPerUniqueId[]
                            durationPerUniqueId[temp[i]
                                                ["unique_id"]] += temp[i]["duration"]

                    # get index (->"unique_id") of biggest number
                    max_index = np.argmax(durationPerUniqueId)

                    # get first element in temp with said unique_id
                    for i in range(0, len(temp)):

                        # np.argmax can STILL return home["unique_id"], if the biggest values in durationPerUniqueId are
                        # the same - if all values are 0, than 0 (as the first occurence) will be returned
                        # this means we still need to filter home["unique_id"] out!
                        if max_index != home["unique_id"] and temp[i]["unique_id"] == max_index:

                            # add to other calculated places of work, reset max_index
                            workplace.append(temp[i])
                            max_index = None
                            break

                # set curr2 to the next day and reset temp
                curr2 = curr2 + timedelta(days=1)
                temp = []
                temp.append(stops.iloc[i])

            # if same day
            else:
                temp.append(stops.iloc[i])

    return workplace


# builds a little popup
def buildPopup(entry, showLastVisit):

    adress = entry.adress
    if adress == None:
        return None
    html = ""
    if showLastVisit:
        html += "Besucht am: <br>" + str(toDate(entry.timestamp))+"<br><br>"

    html += "Adresse:<br>"+str(adress)
    iframe = folium.IFrame(html, width=200,  height=200)

    popup = folium.Popup(iframe, max_width=200)
    return popup


def addSigificantLocations(user, map):
    for home in user.home:
        popup_h = buildPopup(home, False)
        folium.Marker((home.latitude, home.longitude), icon=folium.Icon(
            icon='home', color='blue'), popup=popup_h).add_to(map)
        # there should only be 1 home element, but make sure only 1 is displayed anyway
        break

    for entry in user.work:
        if len(user.work) > 1:
            popup_w = buildPopup(entry, True)
        else:
            popup_w = buildPopup(entry, False)
        folium.Marker((entry.latitude, entry.longitude), icon=folium.Icon(
            icon='wrench', color='red'), popup=popup_w).add_to(map)

def saveMap(map, filenumber):
    dir = 'website/templates/iframes/'

    #check if directory exists and create one, if it doesn't
    if not path.exists(dir):
        mkdir(dir)
    
    #delete other file(s) to prevent memory overflow
    for f in listdir(dir):
        remove(path.join(dir, f))

    #save file
    map.save(dir+"map"+str(filenumber)+'.html')

# function for building the map with given data
def buildmap(user, filenumber):
    '''
    userStr = str(user)[1:-1].replace(" ","")
    #print(str(user))
    print(type(userStr)) 
    print(userStr)
    print("username: " +  user.username)
    '''

    csv_path = "data/" + user.username + "/gps_samples_and_motion_score.csv"

    data = pd.read_csv(csv_path)

    location = data['latitude'].mean(), data['longitude'].mean()

    map = folium.Map(
        location,
        zoom_start=10)

    colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                     index=[0, 50, 100, 200, 600, 1000], vmin=0, vmax=1000,
                                     caption='motion score') #originally "motion_score"
    map.add_child(colormap)

    for i in range(0, len(data)-1):
        loc1 = data['latitude'].iloc[i], data['longitude'].iloc[i]
        loc2 = data['latitude'].iloc[i+1], data['longitude'].iloc[i+1]

        loc = [loc1, loc2]
        
        alt = data['motion_score'].iloc[i] #originally "motion_score"

        if not isNaN(alt):
            color_ = colormap(alt)
            folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(map)

    # add sigificant locations (home and work)
    addSigificantLocations(user, map)

    #save file
    saveMap(map,filenumber)

#checks if a number is NaN by comparing it to itself
#https://stackoverflow.com/questions/944700/how-can-i-check-for-nan-values
def isNaN(num):
    return num != num


# builds new map with filtered data range
def build_date_map(user, req_start_date, req_end_date, req_start_time, req_end_time, filenumber):

    # get Data for user

    csv_path = "data/" + user.username + "/gps_samples_and_motion_score.csv"

    data = pd.read_csv(csv_path)
    print("Filter for: "+str(req_start_date)+" "+str(req_start_time)+" to "+str(req_end_date)+" "+str(req_end_time))

    # if no date is given, set to first and/or last possible day
    if req_start_date == "" and req_end_date == "":
        reqStartDateTime = datetime.strptime(data['ts'].iloc[0], '%Y-%m-%d %H:%M:%S+%f:00')
        reqEndDateTime = datetime.strptime(data['ts'].iloc[len(data)-1], '%Y-%m-%d %H:%M:%S+%f:00')
    elif req_start_date == "":
        reqStartDateTime = datetime.strptime(data['ts'].iloc[0], '%Y-%m-%d %H:%M:%S+%f:00')
        if req_end_time == "":
            reqEndDateTime = datetime.strptime(req_end_date + "23:59", '%Y-%m-%d%H:%M')
        else:
            reqEndDateTime = datetime.strptime(req_end_date + req_end_time, '%Y-%m-%d%H:%M')    
    elif req_end_date == "":
        reqEndDateTime = datetime.strptime(data['ts'].iloc[len(data)-1], '%Y-%m-%d %H:%M:%S+%f:00')
        if req_start_time == "":
            reqStartDateTime = datetime.strptime(
            req_start_date + "00:00", '%Y-%m-%d%H:%M')
        else:
            reqStartDateTime = datetime.strptime(
            req_start_date + req_start_time, '%Y-%m-%d%H:%M')   

    else: 
        #if date but no time set to whole day
        if req_start_time == "" and req_end_time == "":
            reqStartDateTime = datetime.strptime(
            req_start_date + "00:00", '%Y-%m-%d%H:%M')
            reqEndDateTime = datetime.strptime(
            req_end_date + "23:59", '%Y-%m-%d%H:%M')
        elif req_start_time == "" and req_end_time != "":
            reqStartDateTime = datetime.strptime(
            req_start_date + "00:00", '%Y-%m-%d%H:%M')
            reqEndDateTime = datetime.strptime(
            req_end_date + req_end_time, '%Y-%m-%d%H:%M')
        elif req_start_time != "" and req_end_time == "":
            reqStartDateTime = datetime.strptime(
            req_start_date + req_start_time, '%Y-%m-%d%H:%M')
            reqEndDateTime = datetime.strptime(
            req_end_date + "23:59", '%Y-%m-%d%H:%M')
        else:
            reqStartDateTime = datetime.strptime(
            req_start_date + req_start_time, '%Y-%m-%d%H:%M')
            reqEndDateTime = datetime.strptime(
            req_end_date + req_end_time, '%Y-%m-%d%H:%M')

    newData = pd.DataFrame()

    #print(data['ts'].iloc[0])
    #print(data['ts'].iloc[len(data)-1])

    for i in range(0, len(data)-1):
        dataDate = data['ts'].iloc[i]

        # date from timestamp in data
        data_date = datetime.strptime(dataDate, '%Y-%m-%d %H:%M:%S+%f:00')
        if data_date >= reqStartDateTime and data_date <= reqEndDateTime:
            newData = pd.concat([newData, data.iloc[[i]]])

    # if dataframe is empty (no locations at selected date intervall) then build empty map doesn't work, idk why

    if (newData.empty):
        location = data['latitude'].mean(), data['longitude'].mean()
        map = folium.Map(
            location,
            zoom_start=10)

        colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                     index=[0, 100, 250, 500, 700, 1000], vmin=0, vmax=1000,
                                     caption='motion score')
        map.add_child(colormap)

        #save file
        saveMap(map,filenumber)

    else:

        # create new folium map with filterd Data
        location = newData['latitude'].mean(), newData['longitude'].mean()

        map = folium.Map(
            location,
            zoom_start=10)

        colormap = cm.LinearColormap(colors=['darkblue', 'blue', 'green', 'yellow', 'orange', 'red'],
                                     index=[0, 100, 250, 500, 700, 1000], vmin=0, vmax=1000,
                                     caption='motion score') #originally "motion_score"
        map.add_child(colormap)

        for i in range(0, len(newData)-1):
            loc1 = newData['latitude'].iloc[i], newData['longitude'].iloc[i]
            loc2 = newData['latitude'].iloc[i +
                                            1], newData['longitude'].iloc[i+1]

            loc = [loc1, loc2]
            
            alt = newData['motion_score'].iloc[i] #originally "motion_score"

            if not isNaN(alt):
                color_ = colormap(alt)
                folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(map)

    # add sigificant locations (home and work)
    addSigificantLocations(user, map)

    #save file
    saveMap(map,filenumber)


def metadata(current_user):
    csv_path = "data/" + current_user.username + "/mobility_report" + ".csv"
    df = pd.read_csv(csv_path)
    return df
