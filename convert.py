import os
import pandas as pd
import utm

#runs fine on python 3.8.10. Not supposed to be running on the server 

main_folder = os.path.join(os.getcwd(), "data")
for user_folder in os.listdir(main_folder):
    print(user_folder+":")

    ###rename gps file(s) - define needed files
    old_file_gps = os.path.join(main_folder, user_folder, "source.csv")
    new_file_gps = os.path.join(main_folder, user_folder, "gps_samples_and_motion_score.csv")

    #rename file
    if os.path.exists(old_file_gps):
        os.rename(old_file_gps, new_file_gps)
    else:
        if os.path.exists(new_file_gps):
            print("\tFile already exists")
        else:
            print("\tNo file '"+ old_file_gps + "' found, can't rename.")



    ###convert mobility_report file(s) - define needed files
    old_file_mr = os.path.join(main_folder, user_folder, "analysis.xlsx")
    new_file_mr = os.path.join(main_folder, user_folder, "mobility_report.csv")
   
    # convert & delete file afterwards
    if os.path.exists(old_file_mr):
        read_file = pd.read_excel (old_file_mr, engine='openpyxl')
        read_file.to_csv (new_file_mr, index = None, header=True)
        os.remove(old_file_mr)
    else:
        if os.path.exists(new_file_mr):
            print("\tFile already exists")
        else:
            print("\tNo file '"+ new_file_mr + "' found, can't convert.")



    ####from Veras align_data.py file:

    # read tracks
    samples_df = pd.read_csv(new_file_gps)

    # read stops
    stops_df = pd.read_csv(os.path.join(main_folder, user_folder, "stops.csv"))

    ##convert timestamps to timezone aware format (important)
    samples_df.ts = pd.to_datetime(samples_df.ts)
    samples_df = samples_df.set_index('ts').tz_convert('Europe/Berlin').reset_index()

    stops_df.start = pd.to_datetime(stops_df.start)
    stops_df = stops_df.set_index('start').tz_convert('Europe/Berlin').reset_index()
    stops_df.stop = pd.to_datetime(stops_df.stop)
    stops_df = stops_df.set_index('stop').tz_convert('Europe/Berlin').reset_index()
    

    ##iterate stops and add unique stop ID to corresponding samples
    samples_df['stop_id'] = -1
    for index, row in stops_df.iterrows():
        selection = samples_df[(samples_df.ts >= row.start) & (samples_df.ts <= row.stop)].index
        samples_df.loc[selection, 'stop_id'] = row.unique_id

    # save new CSVs
    samples_df.to_csv(new_file_gps, index=False)


    # add long and lat to stops:
    stops_file = os.path.join(os.path.join(main_folder, user_folder, "stops.csv"))
    stops = pd.read_csv(stops_file)
    tracks = pd.read_csv(new_file_gps)

    longitude_list = []
    latitude_list = []
    longitude_list_utm = []
    latitude_list_utm = []


    for i in range(0, len(stops)):
        ##find longitude and latitude by using the track's id 
        row = tracks.loc[tracks['stop_id'] == stops.iloc[i]["unique_id"]]

        lat = row.iloc[0]["latitude"]
        long = row.iloc[0]["longitude"]

        longitude_list.append(long)
        latitude_list.append(lat)
        
        ##find longitude and latitude by converting the UTM parameters to longitude and latitude

        x = stops.iloc[i]["x"]
        y = stops.iloc[i]["y"]
        #print(f"x: {x}  y: {y}")

        #for some reason, a OUTOFBOUNDS error occurs with some users. they may have been moving too far from the 33U zone, idk
        #in order to still provide a coordinate, one is taken from the track (stops and tracks are now linked via id)
        if x <100000 or x > 999999 or y < 0 or y > 10000000:
            print("OUT OF BOUNDS")
            longitude_list_utm.append(long)
            latitude_list_utm.append(lat)
        else:
            lat_utm, long_utm = utm.to_latlon(x, y, 33, 'U')

            longitude_list_utm.append(long_utm)
            latitude_list_utm.append(lat_utm)
        
        #print(f"Diff: {lat} - {lat_utm} = {'{:f}'.format(lat - lat_utm)} |\t {long} - {long_utm} = {'{:f}'.format(long - long_utm)}")

    #stops['longitude'] = longitude_list
    #stops['latitude'] = latitude_list
    stops['longitude'] = longitude_list_utm
    stops['latitude'] = latitude_list_utm

    #save file
    stops.to_csv (stops_file, index = None, header=True)
        