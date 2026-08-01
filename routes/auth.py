from flask import Blueprint, render_template, request, redirect, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from services.auth_service import create_user, get_user_by_email

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":
        

        full_name = request.form["full_name"]
        email = request.form["email"]
        password = request.form["password"]
        
        existing_user = get_user_by_email(email)

        if existing_user:
            flash("Email already exists.", "danger")
            return redirect("/register")

        hashed_password = generate_password_hash(password)

        create_user(
            full_name,
            email,
            hashed_password
        )

        flash("Registration successful. Please login.", "success")
        return redirect("/login")

    return render_template("auth/register.html")

@auth_bp.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        user = get_user_by_email(email)

        if not user:
            flash("Invalid email or password.", "danger")
            return redirect("/login")

        if not check_password_hash(user["password"], password):
            flash("Invalid email or password.", "danger")
            return redirect("/login")

        session["user_id"] = user["id"]
        session["full_name"] = user["full_name"]

        return redirect("/dashboard")

    return render_template("auth/login.html")

@auth_bp.route("/logout")
def logout():

    session.clear()

    flash("Logged out successfully.", "success")

    return redirect("/login")