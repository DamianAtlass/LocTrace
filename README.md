# LocTrace


###### starting the app

start app by executing main.py

###### Login-functionality:
For loading users from the .csv file into the local sqlalchemy database correctly take a look at auth.py, specificly the variables LOG_IN_DATA_FILE, REQUIRE_PW_TO_LOAD_DB, PW_DB and DB_AUTOLOAD.
In short: if DB_AUTOLOAD is set to True everything happens automatically, LOG_IN_DATA_FILE should obviously be the path/name to the .csv file.

###### The database:
The database is mainly needed so that the server can remember users who just loggend in. create_database(app) in __init__.py first looks for an old database and uses that, if it finds one. When DB_AUTOLOAD is True and it regulary checks LOG_IN_DATA_FILE for new users, it won't add users who already exist.