from website import create_app

app = create_app()


# makes that the flask app is only started when this file is executed
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)

