from app import create_app, db, socketio
from app.models import Room, Question

app = create_app()

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    print("启动提问墙系统...")
    print("后端服务运行在: http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
