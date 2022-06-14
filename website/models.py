from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func




class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(150), unique=True)
    
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
   
