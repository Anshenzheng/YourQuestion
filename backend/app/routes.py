import uuid
import io
import base64
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import qrcode
from app import db, socketio
from app.models import Room, Question, Like
from datetime import datetime

main = Blueprint('main', __name__)

def generate_qr_code(url):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

@main.route('/api/rooms', methods=['POST'])
@cross_origin(supports_credentials=True)
def create_room():
    data = request.get_json()
    room_name = data.get('name', '默认提问房间')
    
    room_id = str(uuid.uuid4())
    room = Room(id=room_id, name=room_name)
    db.session.add(room)
    db.session.commit()
    
    frontend_url = request.headers.get('Frontend-Url', 'http://localhost:3000')
    user_url = f"{frontend_url}/user/{room_id}"
    bigscreen_url = f"{frontend_url}/bigscreen/{room_id}"
    host_url = f"{frontend_url}/host/{room_id}"
    
    qr_user = generate_qr_code(user_url)
    qr_bigscreen = generate_qr_code(bigscreen_url)
    qr_host = generate_qr_code(host_url)
    
    return jsonify({
        'success': True,
        'room': room.to_dict(),
        'urls': {
            'user': user_url,
            'bigscreen': bigscreen_url,
            'host': host_url
        },
        'qrcodes': {
            'user': qr_user,
            'bigscreen': qr_bigscreen,
            'host': qr_host
        }
    }), 201

@main.route('/api/rooms/<room_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_room(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'success': False, 'error': '房间不存在'}), 404
    
    return jsonify({
        'success': True,
        'room': room.to_dict()
    })

@main.route('/api/rooms/<room_id>/questions', methods=['POST'])
@cross_origin(supports_credentials=True)
def create_question(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'success': False, 'error': '房间不存在'}), 404
    
    data = request.get_json()
    content = data.get('content')
    nickname = data.get('nickname')
    
    if not content or not nickname:
        return jsonify({'success': False, 'error': '问题内容和昵称不能为空'}), 400
    
    question = Question(
        room_id=room_id,
        content=content,
        nickname=nickname
    )
    db.session.add(question)
    db.session.commit()
    
    socketio.emit('question_created', question.to_dict(), room=room_id)
    
    return jsonify({
        'success': True,
        'question': question.to_dict()
    }), 201

@main.route('/api/rooms/<room_id>/questions', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_questions(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'success': False, 'error': '房间不存在'}), 404
    
    sort_by = request.args.get('sort', 'likes')
    order = request.args.get('order', 'desc')
    
    query = Question.query.filter_by(room_id=room_id)
    
    if sort_by == 'likes':
        if order == 'desc':
            query = query.order_by(Question.likes.desc())
        else:
            query = query.order_by(Question.likes.asc())
    elif sort_by == 'time':
        if order == 'desc':
            query = query.order_by(Question.created_at.desc())
        else:
            query = query.order_by(Question.created_at.asc())
    
    questions = query.all()
    
    return jsonify({
        'success': True,
        'questions': [q.to_dict() for q in questions]
    })

@main.route('/api/questions/<question_id>/like', methods=['POST'])
@cross_origin(supports_credentials=True)
def like_question(question_id):
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'success': False, 'error': '问题不存在'}), 404
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': '用户ID不能为空'}), 400
    
    existing_like = Like.query.filter_by(question_id=question_id, user_id=user_id).first()
    if existing_like:
        return jsonify({
            'success': False,
            'error': '您已经点赞过了',
            'question': question.to_dict(),
            'already_liked': True
        }), 400
    
    try:
        new_like = Like(question_id=question_id, user_id=user_id)
        db.session.add(new_like)
        question.likes += 1
        db.session.commit()
        
        socketio.emit('question_updated', question.to_dict(), room=question.room_id)
        
        return jsonify({
            'success': True,
            'question': question.to_dict(),
            'already_liked': False
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': '点赞失败'}), 500

@main.route('/api/rooms/<room_id>/user-likes', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_user_likes(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'success': False, 'error': '房间不存在'}), 404
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'success': True, 'liked_question_ids': []})
    
    question_ids = db.session.query(Question.id).filter_by(room_id=room_id).all()
    question_id_list = [qid[0] for qid in question_ids]
    
    likes = Like.query.filter(
        Like.question_id.in_(question_id_list),
        Like.user_id == user_id
    ).all()
    
    liked_question_ids = [like.question_id for like in likes]
    
    return jsonify({
        'success': True,
        'liked_question_ids': liked_question_ids
    })

@main.route('/api/questions/<question_id>/answer', methods=['POST'])
@cross_origin(supports_credentials=True)
def answer_question(question_id):
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'success': False, 'error': '问题不存在'}), 404
    
    data = request.get_json()
    answer = data.get('answer', '')
    
    question.is_answered = True
    question.answer = answer
    db.session.commit()
    
    socketio.emit('question_updated', question.to_dict(), room=question.room_id)
    
    return jsonify({
        'success': True,
        'question': question.to_dict()
    })

@socketio.on('join')
def on_join(data):
    room_id = data.get('room_id')
    from flask_socketio import join_room
    join_room(room_id)
