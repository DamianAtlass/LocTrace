# LocTrace


### Setting up the app

Before the app can be started, there are a couple of things that need to be done:

1) The file "LocTrace/logindata.csv", which should be found in the main directory, needs to contain all users and passwords, that are supposed to access the page. If no such file can be found or if it is empty, a warning should be displayed on the console. For more information read "Loading users" below.

2) The folder "LocTrace/data" in the main directory needs to provide the location data for all users. If data is not provided, the map can't be build correctly and an error message will probably be shown. "LocTrace/data" contains folders, which are named after the users (example: "EXAMPLE_USER_1"). In "LocTrace/data/EXAMPLE_USER_1/" would be multiple files, which need to be named all the same for each user:
- "LocTrace/data/EXAMPLE_USER_1/gps_samples_and_motion_score.csv"
- "LocTrace/data/EXAMPLE_USER_1/mobility_report.csv"
- "LocTrace/data/EXAMPLE_USER_1/stops.csv"

3) The variable "HOST", which can be found in "LocTrace/website/templatessurvey.html", "LocTrace/website/survey2.html" and "LocTrace/website/map.html" needs to be adjusted in each file, depending on where the app is hosted (localhost, https://LocTrace.pythonanywhere.com/,...). The most common hosts, which were just stated, are already listed in the files and simply need to be commented in/out. When hosted locally, the app runs on port 5000 by default.

4) For altering the questions in the questionnaire, it is recommended to be familiar with TheFragebogen (https://thefragebogen.de/) first. Then, the files "LocTrace/website/templates/survey.html" (the first part of the survey) and "LocTrace/website/templates/survey2.html" (the second part of the survey) can be edited as desired. 

5) When new data is about to be collected and the website is about to be hosted for the first time, the file "LocTrace/website/database.db" should not exist / must be deleted if it does (implicating, that it belongs to an old survey). "LocTrace/website/database.db" is created automatically when the website is hosted and even though it doesn't carry the survey data, it does contain information allowing/forbidding participants to answer the survey. If the server is just reloaded (because, for example, insignificant changes to the website have been made) it should be fine to keep the file, it is however strongly recommended against deploying changes, when an active survey is running. Therefore, this should be kept in mind for development only. If "LocTrace/surveyData" contains answers of an old survey, it must be deleted as well.

6) Python 3.9 is required to run the app, in pythonanywhere this can be configured under "Web"->"Code".

7) When starting the app, as explained below, there will probably be a few packages, which need to be installed. Usually, your python interpreter / error log will tell you, which packages are needed.


### Starting the app

Start the app by executing "LocTrace/main.py". Alternatively, you can run "flask run" in your terminal from the main directory. This command will run the file "LocTrace/app.py" - essentially the same will happen, if the app is started using pythonanywhere ("Web"->"Reload"). Remember to set "HOST", as explained above.
When starting the app for the first time, depending on how many users / how many data you provide, it can / will take some time for the server to start (for more information, consider reading "The database"). This is normal and interrupting is not recommended, as it can lead to unexpected behavior. The console / Server log should display progress.


### Loading users:

For insights in loading users from "LocTrace/logindata.csv" into the sql-database correctly, take a look at "LocTrace/website/auth.py" (specifically the variables "LOG_IN_DATA_FILE", "REQUIRE_PW_TO_LOAD_DB", "PW_DB" and the function "load_users()". After loading users, significant locations(sigLocs), which will be seen on the map, will be calculated and saved in the database as well.

If there ever should be a need for changing passwords for existing users or adding users in general, the following steps need to be taken:
- New users and passwords should be added to "LocTrace/logindata.csv" in the same pattern, as the existing ones ([username],[password]).
- For changing the password of an existing user, simply replace the old password with the new one in "LocTrace/logindata.csv".
- None of the changes have actually been updated yet. To do so, access the route HOST/loaddb/ (example: LocTrace.pythonanywhere.com/loaddb/) and enter the password, which can be found (and set) in "LocTrace/website/auth.py".
- Deleting users from the database is not possible. It is advised to add new users after the new data has been added to "LocTrace/data/", as adding it afterwards can lead to unexpected behaviour.


### The database:

The database is needed so that users can only see their own information and answer their own questionnaire. It also remembers sessions and does other important tasks. "create_database(app)" in "LocTrace/website/__init__.py" first looks for an old database (which would be "LocTrace/website/database.db") and uses that, if it finds one. When the server is hosted for the first time and no database exists, an instance of the class "State" will be created, which roughly represents the state of the database. The State instance, which there can only be one of, prevents the server from looking for data to be put into the database more than once. However, the route "loaddb/" can be used to bypass that (for more information, consider reading "Loading users" above).
Immediately after creation, users and significant locations are saved into the database. Loading significant locations from the database saves a significant amount of time, when loading the website. Therefore it is the first thing to be done before the server can be accessed. Significant locations are represented by the classes "Stop_h" and "Stop_w", as every significant location is technically represented by a simplified version of an entry in "LocTrace/data/*/stops.csv". Though "Stop_h" and "Stop_w" are technically completely identical, their existence is reasoned by the need for a simple distinction between home and work without getting much into sql-relations.


### The survey data:

As of now, the survey is designed to be split up into 2 parts: part 1 and part 2. When the user's questionnaire is sent to the server, a folder "LocTrace/surveyData" will be created, which contains 2 subfolders called "LocTrace/surveyData/part1" and "LocTrace/surveyData/part2" (these folders not existing implicates that no data has arrived yet). Each of them will hold the participant's answers as .csv files, which are named after their username (example: "LocTrace/surveyData/part1/EXAMPLE_USER_1.csv" and "LocTrace/surveyData/part2/EXAMPLE_USER_1.csv"). None of the actual survey data is saved in the database, however it is remembered if a participant already answered a part of a survey. The participant will be redirected to the map, if this is the case.
The easiest way to export the survey data from the pythonanywhere server is probably using the console to zip it (command: "zip -r myzipfile my_folder_name", example: "zip -r surveyData surveyData") and simply download the .zip file afterwards (here: "LocTrace/surveyData.zip").



### Overview on file structure


LocTrace/   <--Root
|   app.py
|   convert.py
|   logindata.csv
|   main.py
|   README.md
|   
+---data
|   +---EXAMPLE_USER1
|   |       gps_samples_and_motion_score.csv
|   |       mobility_report.csv
|   |       stops.csv
|   |       
|   +---...
|   |
|   :
|        
+---surveyData*
|   +---part1
|   |       EXAMPLE_USER_1.csv
|   |       ...
|   |       
|   \---part2
|           EXAMPLE_USER_1.csv
|	    ...
|           
+---website
|   |   auth.py
|   |   database.db*
|   |   map.py
|   |   models.py
|   |   views.py
|   |   __init__.py
|   |   
|   +---templates
|   |   |   base.html
|   |   |   login.html
|   |   |   map.html
|   |   |   survey.html
|   |   |   survey2.html
|   |   |   
|   |   +---css
|   |   |       bootstrap.min.css
|   |   |       style.css
|   |   |       
|   |   +---iframes*
|   |   |       ...
|   |   |       
|   |   +---img
|   |   |       ...
|   |   |       
|   |   \---js
|   |           thefragebogen.js
|   |           
|   \---__pycache__*
|           ...
|           
\---__pycache__*
        ...
        

### Short description on relevant files
Some files/folders are given a short summary here. Files/folders marked with * might/should not exist when first launching the app (obviously including all subfolders and files within).

# LocTrace/app.py
Defines the application.


# LocTrace/convert.py
...


# LocTrace/logindata.csv
Carries password and usernames of accounts, that are supposed to access the website.


# LocTrace/main.py
Defines the application as well, but hosts it on a specific port and in debug mode.

# Loctrace/data/
Folder which holds the participants tracked data. For more information, see 'Setting up the app' above.


# Loctrace/surveyData/
Folder which holds the survey's answers separated into part 1 and part 2.


# Loctrace/website/auth.py
Contains routes which deal with logging in/out and reading data from "Loctrace/data/" into the database.


# Loctrace/website/map.py
Is responsible for the creating the map (showing the user's tracked locations), which is later embedded as i-frame into "LocTrace/website/templates/map.html". Also holds the filter function and calculation of significant locations.


# Loctrace/website/models.py
Defines the structure of the database. If on wants to understand the database, this is the first place to go.


# Loctrace/website/views.py
Contains all other routes, passes filter-values to "Loctrace/website/map.py", embeddens map i-frame into "LocTrace/website/templates/map.html".


# Loctrace/website/__init__.py
Sets up the app and creates a database.

# Loctrace/website/templates/iframes
Should contain a single file called "mapX.html", where "X" is replaced by a random positive number. This file is embedded into "LocTrace/website/templates/map.html" and represents the map with the user's tracks and significant locations. It is created and replaced each time a user requests the map page or uses the filter function. It's unorthodox naming allows it to bypass browser's caching, which would result in the same map being loaded again and again and again. When we encountered this problem, a quick solution was needed more than an elegant one. More info in map() in "Loctrace/website/views.py".






