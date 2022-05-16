from flask import Blueprint, render_template, request
import pandas as pd
auth = Blueprint('auth',__name__)



@auth.route("/login", methods = ["GET", "POST"])
def login():
    if request.method =="POST":
        email = request.form.get("email")
        pw = request.form.get("password")

