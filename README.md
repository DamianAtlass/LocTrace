# LocTrace


#### Setting up the app

Before the app can be started, there are a couple of things that need to be done:

1) The file "logindata.csv" needs to contain all users, that are supposed to log in.

2) The folder "data" in the main directory needs to provide the location data for all users. If data is not provided, the map can't be build correctly and an error message will probably be shown. "data" contains folders, which are named after the users (example: "username1"). In "username1" are multiple files, which are named all the same for each user:
- "gps_samples_and_motion_score.csv"
- "mobility_report.csv"
- "stops.csv"

3) The variable HOST, which can be found in "survey.html", "survey2.html" and "map.html" needs to be adjusted in each file, depending on where the app is hosted (localhost, LocTrace.pythonanywhere.com,...). The most common hosts, which were just stated, are already listed in the files and simply need to be commented in/out.

4) When starting the app, as explained below, there will probably be a few packeges, which need to be installed. Usually, your python interperter/error log will tell you, which packeges are needed.


#### Starting the app

Start app by executing main.py. Alternatively, you can execute "flask run" from the main directory. This command will run the file "app.py" - essentially the same will happen, if the app is started using pythonanywhere. Remember to set HOST, as explained above.


#### Login-functionality:
For loading users from the .csv file into the local sqlalchemy database correctly take a look at auth.py, specificly the variables LOG_IN_DATA_FILE, REQUIRE_PW_TO_LOAD_DB, PW_DB and the function load_users(). After loading users, significant locations(sigLocs), which will be seen on the map, will be calculated and saved in the database as well.


#### The database:
The database is mainly needed so that the server can remember users who just loggend in. create_database(app) in __init__.py first looks for an old database and uses that, if it finds one. When the server is hosted for the first time (and no database exists), an instance of the class 'State' will be created, which roughly represents the state of the database. The State instance, which there can only be one of, prevents the server from looking for data to be put into the database more than once. However, the route /loaddb/ can be used to bypass that without restarting the server. Immediately after creation, users and significant locations are saved into the database. Loading significant locations from the database saves a significant amount of time, when loading the website. They are represented by the classes 'Stop_h' and 'Stop_w', as every significant location is technically represented by a simplified version of an entry in the stops.cvs.


#### Adding new participants
The location data for each participant is stored in the data folder. Every participant has their own sub-folder, which has to be named after the username. To add new participant, simply create a new sub-folder that is named after the participant's usename and add the username to "logindata.csv". Access the route "/loaddb/" (the password can be found in "auth.py") to re-load the database and add the new users.