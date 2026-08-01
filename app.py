from flask import Flask
import os
from config import Config
from routes.home import home_bp
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.quran import quran_bp 

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]

app.config["UPLOAD_FOLDER"] = os.path.join(
    "uploads",
    "recordings"
)

app.register_blueprint(home_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(quran_bp)

if __name__ == "__main__":
    app.run(debug=True)