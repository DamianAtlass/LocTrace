# LocTrace


#### starting the app

start app by executing main.py

#### Login-functionality:
For loading users from the .csv file into the local sqlalchemy database correctly take a look at auth.py, specificly the variables LOG_IN_DATA_FILE, REQUIRE_PW_TO_LOAD_DB, PW_DB and the function load_users(). After loading users, significant locations(sigLocs), which will be seen on the map, will be calculated and saved in the database as well.


#### The database:
The database is mainly needed so that the server can remember users who just loggend in. create_database(app) in __init__.py first looks for an old database and uses that, if it finds one. When the server is hosted for the first time (and no database exists), an instance of the class 'State' will be created, which roughly represents the state of the database. The State instance, which there can only be one of, prevents the server from looking for data to be put into the database more than once. However, the route /loaddb/ can be used to bypass that without restarting the server. Immediately after creation, users and significant locations are saved into the database. Loading significant locations from the database saves a significant amount of time, when loading the website. They are represented by the classes 'Stop_h' and 'Stop_w', as every significant location is technically represented by a simplified version of an entry in the stops.cvs.