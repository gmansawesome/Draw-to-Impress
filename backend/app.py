import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_admin import Admin, BaseView, expose
from flask_admin.contrib.sqla import ModelView
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime, timezone

drawtime = 10

class UserView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "username", "name", "hosted_games", "games", "drawing"]
class GameView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "state", "code", "capacity", "host", "prompt", "start_time", "players", "drawings"]
class GameSessionView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "player", "game"]
class PromptView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "content", "active_games"]
class DrawingView(ModelView):
    column_hide_backrefs = False
    column_list = ["id", "player", "game"]

app = Flask(__name__)
app.secret_key = "secret"
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(60), unique=True)
    name = db.Column(db.String(120))
    password = db.Column(db.String(256))

    hosted_games = db.relationship("Game", foreign_keys=lambda: [Game.host_id], backref="host", cascade="all, delete")
    games = db.relationship("GameSession", foreign_keys=lambda: [GameSession.player_id], backref="player", cascade="all, delete")
    drawing = db.relationship("Drawing", foreign_keys=lambda: [Drawing.player_id], backref="player", cascade="all, delete")

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
    start_time = db.Column(db.DateTime(timezone=True), nullable=True)

    players = db.relationship("GameSession", foreign_keys=lambda: [GameSession.game_id], backref="game", cascade="all, delete")
    drawings = db.relationship("Drawing", foreign_keys=lambda: [Drawing.game_id], backref="game", cascade="all, delete")

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
    
class Drawing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    game_id = db.Column(db.Integer, db.ForeignKey("game.id"))
    image_data = db.Column(db.Text, nullable=False)

    def __str__(self):
        return f"P-{self.player_id}"

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

        db.session.add_all([
            # prompt
            # host, player1, player2, player3,
            # prompt, game, session1, session2, session3
        ])

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

    prompts = Prompt.query.all()
    if not prompts:
        return jsonify({
            "success": False,
            "message": "No prompts available"
        })
    random_prompt = random.choice(prompts)

    game_code = generate_game_code()
    game = Game(code=game_code, host_id=user.id, state='lobby', capacity=20, prompt_id=random_prompt.id )
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

def generate_game_code():
    characters = string.ascii_uppercase+string.digits
    return ''.join(random.choices(characters, k=8))

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
            "message": "This game is already in progress"
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
        game = db.session.get(Game, session.game_id)
        return jsonify({
            "inGame": True,
            "gameCode": game.code,
            "role": "host" if game.host_id == user_id else "player"
        })
    return jsonify({"inGame": False})

@app.route('/game/<string:username>/<string:gamecode>', methods=['GET'])
def check_game(username, gamecode):
    game = Game.query.filter_by(code=gamecode).first()
    if not game:
        return jsonify({
            "success": False,
            "message": "Invalid game code"
        })

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        })

    user_gs = GameSession.query.filter_by(player_id=user.id, game_id=game.id).first()
    if not user:
        return jsonify({
            "success": False,
            "message": "User does not belong to game"
        })

    game_session_objs = game.players
    if not game_session_objs:
        return jsonify({
            "success": False,
            "players": []
        })

    players = []
    for game_session in game_session_objs:
        player = db.session.get(User, game_session.player_id)
        if not player:
            continue

        players.append({
            "id": player.id,
            "username": player.username
        })

    return jsonify({
        "success": True,
        "players": players
    })

@app.route('/game/<string:username>/<string:gamecode>', methods=['DELETE'])
def leave_game(username, gamecode):
    user = User.query.filter_by(username=username).first()
    if not (user):
        return jsonify({
            "success": False,
            "message": "User not found"
        })

    game = Game.query.filter_by(code=gamecode).first()
    if not game:
        return jsonify({
            "success": False,
            "message": "Invalid game code"
        })

    game_session = GameSession.query.filter_by(player_id=user.id, game_id=game.id).first()
    if not game_session:
        return jsonify({
            "success": False,
            "message": "Game session entry not found"
        })

    if (game.host_id == user.id):
        for session in game.players:
            db.session.delete(session)
        db.session.delete(game)
        db.session.commit()
        
        socketio.emit("game_closed", {"gameCode": game.code}, room=game.code)
    else:
        db.session.delete(game_session)
        db.session.commit()
        
        updated_players = [
            {"id": gs.player.id, "username": gs.player.username}
            for gs in game.players if gs.player is not None
        ]
        socketio.emit("player_list", updated_players, room=game.code)

    return jsonify({
        "success": True,
        "message": "Successfully left the game"
    })

def generate_game_code():
    characters = string.ascii_uppercase+string.digits
    return ''.join(random.choices(characters, k=8))

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('gameCode')
    leave_room(room)

@socketio.on("rejoin_game")
def rejoin_game(data):
    user_id = data.get("userId")
    game_code = data.get("code")

    game = Game.query.filter_by(code=game_code).first()
    if not game:
        emit("rejoin_failed", {"message": "Game not found"})
        return

    session = GameSession.query.filter_by(player_id=user_id, game_id=game.id).first()
    if not session:
        emit("rejoin_failed", {"message": "User not in this game"})
        return

    join_room(game.code)

    emit("game_state", {
        "gameCode": game.code,
        "role": "host" if game.host_id == user_id else "player",
        "state": game.state,
        "prompt": game.prompt.content,
        "duration": get_time_left(game)
    }, to=request.sid)

    if game.state == "lobby":
        players = [
            {"id": gs.player.id, "username": gs.player.username}
            for gs in game.players if gs.player is not None
        ]
        emit("player_list", players, room=game.code)

@socketio.on("start_game")
def handle_start_game(data):
    user_id = data.get("userId")
    game_code = data.get("gameCode")

    game = Game.query.filter_by(code=game_code).first()
    if not game:
        socketio.emit("error", {"message": "Game not found"}, to=request.sid)
        return

    if game.host_id != user_id:
        socketio.emit("error", {"message": "Only the host can start the game"}, to=request.sid)
        return

    game.state = "whiteboard"
    game.start_time = datetime.now(timezone.utc)
    db.session.commit()

    # Notify all players
    socketio.emit("game_state", {
        "gameCode": game.code,
        "state": game.state,
        "prompt": game.prompt.content,
        "duration": get_time_left(game)
    }, room=game.code)

@app.route('/submit-drawing', methods=['POST'])
def submit_drawing():
    data = request.get_json()
    player_id = data.get("playerId")
    game_code = data.get("gameCode")
    image_data = data.get("imageData")

    if not all([player_id, game_code, image_data]):
        return jsonify({"success": False, "message": "Missing data"}), 400
    
    user = db.session.get(User, player_id)
    if not user:
        return jsonify({"success": False, "message": "Invalid user id"}), 404

    game = Game.query.filter_by(code=game_code).first()
    if not game:
        return jsonify({"success": False, "message": "Invalid game code"}), 404
    
    game_session = GameSession.query.filter_by(player_id=user.id, game_id=game.id).first()
    if not game_session:
        return jsonify({"success": False, "message": "User not in game"}), 404

    draw = Drawing.query.filter_by(player_id=user.id, game_id=game.id).first()
    if draw:
        return jsonify({"success": False, "message": "Already submitted drawing"}), 404

    drawing = Drawing(player_id=player_id, game_id=game.id, image_data=image_data)
    db.session.add(drawing)
    db.session.commit()

    return jsonify({"success": True, "message": "Drawing submitted"})

def get_time_left(game):
    if not game.start_time:
        return drawtime

    start = game.start_time

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    return max(0, int(drawtime - elapsed))

def game_monitor():
    while True:
        with app.app_context():
            # print("CYCLE")
            games = Game.query.filter_by(state="whiteboard").all()
            for game in games:
                if not get_time_left(game):
                    print(f"Emitting game_submit for {game.code}")
                    game.state = "submission"
                    db.session.commit()
                    socketio.emit("game_submit", {
                        "gameCode": game.code,
                        "state": "submission"
                    }, room=game.code)
                    socketio.start_background_task(voting_transition, game.code)
        eventlet.sleep(1)

def voting_transition(game_code):
    eventlet.sleep(10)
    with app.app_context():
        game = Game.query.filter_by(code=game_code).first()
        if game and game.state == "submission":
            game.state = "voting"
            db.session.commit()

            socketio.emit("game_vote", {
                "gameCode": game.code,
                "state": "voting"
            }, room=game.code)

# def voting_process(game_code):
#     while True:
#         with app.app_context():
#             eventlet.sleep(5)


admin = Admin(app)
admin.add_view(UserView(User, db.session))
admin.add_view(GameView(Game, db.session))
admin.add_view(GameSessionView(GameSession, db.session))
admin.add_view(PromptView(Prompt, db.session))
admin.add_view(DrawingView(Drawing, db.session))

if __name__ == '__main__':
    main()
    socketio.start_background_task(game_monitor)
    socketio.run(app, debug=True)