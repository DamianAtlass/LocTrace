#import cgi;
from email.policy import default
import folium
import pandas as pd
import branca
import branca.colormap as cm
from datetime import datetime

 


#loading all the loc data
#using panda dataframe





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
        loc1 = data['latitude'].iloc[i],data['longitude'].iloc[i]
        loc2 = data['latitude'].iloc[i+1],data['longitude'].iloc[i+1]

        loc = [loc1,loc2]
    
        color_ = colormap(data['motion_score'].iloc[i])

        folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m3)



    m3.save('website/templates/map1.html')

    return m3


# funtion for building map that shows data at a requested day of the week

def build_weekday_map(user, weekday): 
    # mapping int to weekday
    weekDays = {0: "Monday", 1 : "Tuesday", 2 : "Wednesday", 3:  "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
    
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
        #vllt problem, wegen :00
        # weekday of data row as Integer
        data_weekday = datetime.strptime(dataWeekday, '%Y-%m-%d %H:%M:%S+%f:00').weekday()
       
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
        loc1 = newData['latitude'].iloc[i],newData['longitude'].iloc[i]
        loc2 = newData['latitude'].iloc[i+1],newData['longitude'].iloc[i+1]

        loc = [loc1,loc2]
    
        color_ = colormap(newData['motion_score'].iloc[i])

        folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m3)


    mapPath = "website/templates/map" + weekday + ".html" 
    print("mapPath:" +mapPath)
    m3.save(mapPath)

# builds new map for requested timespan
def build_date_map(user, req_start_date, req_end_date, req_start_time, req_end_time): 
    
     # get Data for user
    csv_path = "website/data/" + user.username + ".csv" 
    data = pd.read_csv(csv_path)

    #if no time is given, set to while day
    if req_start_time == "" and  req_end_time == "" :
        reqStartDateTime = datetime.strptime(req_start_date + "00:00", '%Y-%m-%d%H:%M')
        reqEndDateTime = datetime.strptime(req_end_date +  "23:59", '%Y-%m-%d%H:%M')
    elif req_start_time == "" and req_end_time != "":
        reqStartDateTime = datetime.strptime(req_start_date + "00:00", '%Y-%m-%d%H:%M')
        reqEndDateTime = datetime.strptime(req_end_date +  req_end_time, '%Y-%m-%d%H:%M')
    elif req_start_time != "" and req_end_time == "":
        reqStartDateTime = datetime.strptime(req_start_date +  req_start_time, '%Y-%m-%d%H:%M')
        reqEndDateTime = datetime.strptime(req_end_date + "23:59", '%Y-%m-%d%H:%M')
    else:
        reqStartDateTime = datetime.strptime(req_start_date +  req_start_time, '%Y-%m-%d%H:%M')
        reqEndDateTime = datetime.strptime(req_end_date +  req_end_time, '%Y-%m-%d%H:%M')

    newData = pd.DataFrame()

    print(data['ts'].iloc[0])
    print(data['ts'].iloc[len(data)-1])

    


    for i in range(0, len(data)-1):
        dataDate = data['ts'].iloc[i]
    
        # date from timestamp in data
        data_date = datetime.strptime(dataDate, '%Y-%m-%d %H:%M:%S+%f:00')
        if data_date >= reqStartDateTime and data_date <= reqEndDateTime:
            newData = pd.concat([newData, data.iloc[[i]]])

  

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
        m4.save("website/templates/map_date.html" )
       
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
            loc1 = newData['latitude'].iloc[i],newData['longitude'].iloc[i]
            loc2 = newData['latitude'].iloc[i+1],newData['longitude'].iloc[i+1]

            loc = [loc1,loc2]
    
            color_ = colormap(newData['motion_score'].iloc[i])

            folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m4)

  
        m4.save("website/templates/map_date.html" )
   


