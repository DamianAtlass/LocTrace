from website import create_app
import cryptography

app = create_app()


# makes that the flask app is only started when this file is executed
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000, ssl_context='adhoc')

