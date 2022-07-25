from . import db
from flask_login import UserMixin




class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150), unique=True)

    survey_part1_answered = db.Column(db.Boolean)
    survey_part2_answered = db.Column(db.Boolean)

    sigLoc_loaded = db.Column(db.Boolean)

    home = db.relationship('Stop_h')
    work = db.relationship('Stop_w')

class Stop_h(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    latitude = db.Column(db.Integer)
    longitude = db.Column(db.Integer)
    timestamp = db.Column(db.String(150))
    adress = db.Column(db.String(250))

class Stop_w(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    latitude = db.Column(db.Integer)
    longitude = db.Column(db.Integer)
    timestamp = db.Column(db.String(150))
    adress = db.Column(db.String(250))

class State(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    db_loaded = db.Column(db.Boolean)
    sigLoc_loaded = db.Column(db.Boolean)
   
