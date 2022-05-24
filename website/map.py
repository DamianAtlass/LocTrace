#import cgi;
from email.policy import default
import folium
import pandas as pd
import branca
import branca.colormap as cm
from datetime import datetime


#loading all the loc data
#using panda dataframe
data = pd.read_csv("website/data/example_gps.csv")




# function for building the map with given data
def buildmap():



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
    
        color_ = colormap(data['motion_score'][i])

        folium.PolyLine(loc, weight=5, opacity=1, color=color_).add_to(m3)



    m3.save('website/templates/map1.html')