# LocTrace


###### starting the app

start app by executing main.py

###### Login-functionality:
For loading users from the .csv file into the local sqlalchemy database correctly take a look at auth.py, specificly the variables LOG_IN_DATA_FILE, REQUIRE_PW_TO_LOAD_DB, PW_DB and DB_AUTOLOAD.
In short: if DB_AUTOLOAD is set to True everything happens automatically, LOG_IN_DATA_FILE should obviously be the path/name to the .csv file.

###### The database:
The database is mainly needed so that the server can remember users who just loggend in. It is important to know, that as of now create_database(app) in __init__.py first looks for an old database and deletes it, if it finds one. This is to prevent adding users to the database who are already in it, which would result in an error because usernames need to be unique. Since users are imported into the database from the .csv file (which is not touched in this process), loss of data is not to be expected. However if we would want to permanently store data in the database, this would have to be revised.
