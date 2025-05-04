from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_admin import Admin, BaseView, expose
from flask_admin.contrib.sqla import ModelView
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string

class UserView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "username", "name", "password", "hosted_games", "games"]
class GameView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "state", "code", "capacity", "host", "prompt", "players"]
class GameSessionView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "player", "game"]
class PromptView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "content", "active_games"]

app = Flask(__name__)
app.secret_key = "secret"
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(60), unique=True)
    name = db.Column(db.String(120))
    password = db.Column(db.String(256))

    hosted_games = db.relationship("Game", foreign_keys=lambda: [Game.host_id], backref="host", cascade="all, delete")
    games = db.relationship("GameSession", foreign_keys=lambda: [GameSession.player_id], backref="player", cascade="all, delete")

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)

    def __str__(self):
        return str(self.name)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(120)) # "lobby, whiteboard, voting, results"
    code = db.Column(db.String(120))
    capacity = db.Column(db.Integer)
    host_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    prompt_id = db.Column(db.Integer, db.ForeignKey("prompt.id"))

    players = db.relationship("GameSession", foreign_keys=lambda: [GameSession.game_id], backref="game", cascade="all, delete")

    def __str__(self):
        return f"Game {self.id}"

class GameSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    game_id = db.Column(db.Integer, db.ForeignKey("game.id"))

    def __str__(self):
        return f"GS-{self.id}"
    
class Prompt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(240))

    active_games = db.relationship("Game", foreign_keys=lambda: [Game.prompt_id], backref="prompt", cascade="all, delete")

    def __str__(self):
        return str(self.id)

def main():
    with app.app_context():
        # db.drop_all()
        db.create_all()

        # host = User(username="hostUser", name="Alice Host", password="123")
        # player1 = User(username="playerOne", name="Bob Player", password="123")
        # player2 = User(username="playerTwo", name="Charlie Player", password="123")
        # player3 = User(username="playerThree", name="David Player", password="123")

        # prompt = Prompt(content="Draw cars having a thanksgiving dinner")

        # game = Game(state="lobby", code="ABC123", capacity=20, host=host, prompt=prompt)

        # session1 = GameSession(player=player1, game=game)
        # session2 = GameSession(player=player2, game=game)
        # session3 = GameSession(player=player3, game=game)

        # db.session.add_all([
        #     host, player1, player2, player3,
        #     prompt, game, session1, session2, session3
        # ])

        db.session.commit()


@app.route('/login', methods=['POST'])
def login():
    username = request.form['Username']
    password = request.form['Password']

    user = User.query.filter_by(username=username).first()
    if user:
        if user.check_password(password):
        # if user.password == password:
            return jsonify({
                "success": True,
                "message": "Login successful.",
                "username": username,
                "name": user.name,
                "id": user.id
            })
        else:
            return jsonify({"success": False, "message": "Wrong password."})
    else:
        return jsonify({"success": False, "message": "User not found. Please sign up."})

@app.route('/signup', methods=['POST'])
def signup():
    username = request.form['Username']
    password = request.form['Password']
    firstname = request.form['FirstName']
    lastname = request.form['LastName']

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Username already taken."})
    else:
        new_user = User(
            username=username,
            name=f"{firstname} {lastname}",
        )

        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Account created. You can now log in.",
            "username": username,
        })
    
@app.route('/create-game', methods=['POST'])
def create_game():
    data = request.get_json()
    user = User.query.filter_by(id=int(data['hostId'])).first() 
    if not (user):
        return jsonify({
            "success": False,
            "message": "User not found"
        })

    session = GameSession.query.filter_by(player_id=user.id).first()
    if session:
        return jsonify({
            "success": False,
            "message": "User already in a game - log out and sign in to rejoin!"
        })

    host_id = user.id
    game_code = generate_game_code()
    game = Game(code=game_code, host_id=host_id, state='lobby', capacity=20)
    db.session.add(game)
    db.session.commit()

    session = GameSession(player_id=user.id, game_id=game.id)
    db.session.add(session)
    db.session.commit()

    return jsonify({
        "success": True,
        "gameCode": game_code,
        "message": "You have created the game!"
    })

@app.route('/join-game', methods=['POST'])
def join_game():
    data = request.get_json()
    user = User.query.filter_by(id=int(data['playerId'])).first()
    if not (user):
        return jsonify({
            "success": False,
            "message": "User not found"
        })
    
    game = Game.query.filter_by(code=data.get('gameCode')).first()
    if not game:
        return jsonify({
            "success": False,
            "message": "Invalid game code"
        })
    
    session = GameSession.query.filter_by(player_id=user.id).first()
    if session:
        return jsonify({
            "success": False,
            "message": "User already in a game - log out and sign in to rejoin!"
        })

    if game.state != 'lobby':
        return jsonify({
            "success": False,
            "message": "This game is already in progress or has ended"
        })

    if len(game.players) >= game.capacity:
        return jsonify({
            "success": False,
            "message": "Game is full"
        })
    
    gamesesh = GameSession(player_id=user.id, game_id=game.id)
    db.session.add(gamesesh)
    db.session.commit()
    return jsonify({
        "success": True,
        "message": "You have joined the game!"
    })

@app.route('/check-active-game', methods=['POST'])
def check_active_game():
    data = request.get_json()
    user_id = data.get('userId')

    session = GameSession.query.filter_by(player_id=user_id).first()
    if session:
        game = Game.query.get(session.game_id)
        return jsonify({
            "inGame": True,
            "gameCode": game.code,
            "role": "host" if game.host_id == user_id else "player"
        })
    return jsonify({"inGame": False})

def generate_game_code():
    characters = string.ascii_uppercase+string.digits
    return ''.join(random.choices(characters, k=8))

admin = Admin(app)

admin.add_view(UserView(User, db.session))
admin.add_view(GameView(Game, db.session))
admin.add_view(GameSessionView(GameSession, db.session))
admin.add_view(PromptView(Prompt, db.session))

if __name__ == '__main__':
    main()
    app.run(debug=True)
