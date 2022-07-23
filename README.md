# LocTrace


### Setting up the app

Before the app can be started, there are a couple of things that need to be done:

1) The file "LocTrace/logindata.csv", which should be found in the main directory, needs to contain all users and passwords, that are supposed to access the page. If no such file can be found or if it is empty, a warning should be displayed on the console. For more information read "Loading users" below.

2) The folder "LocTrace/data" in the main directory needs to provide the location data for all users. If data is not provided, the map can't be build correctly and an error message will probably be shown. "LocTrace/data" contains folders, which are named after the users (example: "EXAMPLE_USER_1"). In "LocTrace/data/EXAMPLE_USER_1/" are multiple files, which are named all the same for each user:
- "LocTrace/data/EXAMPLE_USER_1/gps_samples_and_motion_score.csv"
- "LocTrace/data/EXAMPLE_USER_1/mobility_report.csv"
- "LocTrace/data/EXAMPLE_USER_1/stops.csv"

3) The variable "HOST", which can be found in "LocTrace/website/templatessurvey.html", "LocTrace/website/survey2.html" and "LocTrace/website/map.html" needs to be adjusted in each file, depending on where the app is hosted (localhost, https://LocTrace.pythonanywhere.com/,...). The most common hosts, which were just stated, are already listed in the files and simply need to be commented in/out. When hosted locally, the app runs on port 5000 by default.

4) Python 3.9 is required to run the app, in pythonanywhere this can be configured under "Web"->"Code".

5) When starting the app, as explained below, there will probably be a few packages, which need to be installed. Usually, your python interpreter / error log will tell you, which packages are needed.


### Starting the app

Start the app by executing "LocTrace/main.py". Alternatively, you can run "flask run" in your terminal from the main directory. This command will run the file "LocTrace/app.py" - essentially the same will happen, if the app is started using pythonanywhere ("Web"->"Reload"). Remember to set "HOST", as explained above.
When starting the app for the first time, depending on how many users / how many data you provide, it can / will take some time for the server to start (for more information, consider reading "The database"). This is normal and interrupting is not recommended, as it can lead to unexpected behavior. The console / Server log should display progress.


### Loading users:

For insights in loading users from "LocTrace/logindata.csv" into the sql-database correctly, take a look at "LocTrace/website/auth.py" (specifically the variables "LOG_IN_DATA_FILE", "REQUIRE_PW_TO_LOAD_DB", "PW_DB" and the function "load_users()". After loading users, significant locations(sigLocs), which will be seen on the map, will be calculated and saved in the database as well.

If there ever should be a need for changing passwords for existing users or adding users in general, the following steps need to be taken:
- New users and passwords should be added to "LocTrace/logindata.csv" in the same pattern, as the existing ones ([username],[password]\n).
- For changing the password of an existing user, simply replace the old password with the new one in "LocTrace/logindata.csv".
- None of the changes have actually been updated yet. To do so, access the route HOST/loaddb/ (example: LocTrace.pythonanywhere.com/loaddb/) and enter the password, which can be found (and set) in "LocTrace/website/auth.py".
- Deleting users from the database is not possible. It is advised to add new users after the new data has been added to "LocTrace/data/", as adding it afterwards can lead to unexpected behaviour.


### The database:

The database is needed so that users can only see their own information and answer their own questionnaire. It also remembers sessions and does other important tasks. "create_database(app)" in "LocTrace/website/__init__.py" first looks for an old database (which would be "LocTrace/website/database.db") and uses that, if it finds one. When the server is hosted for the first time and no database exists, an instance of the class "State" will be created, which roughly represents the state of the database. The State instance, which there can only be one of, prevents the server from looking for data to be put into the database more than once. However, the route "loaddb/" can be used to bypass that (for more information, consider reading "Loading users" above).
Immediately after creation, users and significant locations are saved into the database. Loading significant locations from the database saves a significant amount of time, when loading the website. Therefore it is the first thing to be done before the server can be accessed. Significant locations are represented by the classes "Stop_h" and "Stop_w", as every significant location is technically represented by a simplified version of an entry in "LocTrace/data/*/stops.csv". Though "Stop_h" and "Stop_w" are technically completely identical, their existence is reasoned by the need for a simple distinction between home and work without getting much into sql-relations.


### The survey data:

As of now, the survey is designed to be split up into 2 parts: part 1 and part 2. When the user's questionnair is sent to the server, a folder "LocTrace/surveyData" will be created, which contains 2 subfolders called "LocTrace/surveyData/part1" and "LocTrace/surveyData/part2" (this folders not existing implicates that no data has arrived yet). Each of them will hold the participant's answers as .csv files, which are named after their username (example: "LocTrace/surveyData/part1/EXAMPLE_USER_1.csv" and "LocTrace/surveyData/part2/EXAMPLE_USER_1.csv"). None of the actualy survey data is saved in the database, however it is remembered if a participant already awnsered a part of a survey. The participant will be redirected to the map, if this is the case.
The easiest way to export the survey data from the pythonanywhere server is probably using the console to zip it (command: "zip -r myzipfile my_folder_name", example: "zip -r surveyData surveyData") and simply download the .zip file afterwards (here: "LocTrace/surveyData.zip").























