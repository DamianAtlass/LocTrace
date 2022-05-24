from flask import Blueprint, render_template, redirect, url_for
from flask_login import  login_required, current_user
# create a new blueprint, which defines how the website can be accessed
views = Blueprint('views',__name__,)




@views.route("/")
def home():
    if (current_user.is_authenticated):
        return redirect(url_for("views.map", user = current_user))
    else:
        return redirect(url_for("auth.login"))

variable = "variables can be passed this way"

@views.route("/map/")
@login_required
def map():
    temp = render_template("map.html", foo = variable, user = current_user)
    return temp


@views.route("/base/")
def base():
    return render_template("base.html", user = current_user)





