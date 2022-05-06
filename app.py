from flask import Flask, render_template, url_for, redirect

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/map/')
def map_cities():
    return render_template("map_cities.html")

if __name__ == '__main__':
    app.run(debug=True)