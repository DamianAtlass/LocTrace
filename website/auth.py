from flask import Blueprint, render_template, request

auth = Blueprint('auth',__name__)



@auth.route("/login", methods = ["GET", "POST"])
def login():
    if request.method =="POST":
        email = request.form.get("email")
        pw = request.form.get("password")

