from datetime import datetime
from app import db

class Room(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    questions = db.relationship('Question', backref='room', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.String(36), db.ForeignKey('room.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    nickname = db.Column(db.String(50), nullable=False)
    likes = db.Column(db.Integer, default=0)
    is_answered = db.Column(db.Boolean, default=False)
    answer = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'content': self.content,
            'nickname': self.nickname,
            'likes': self.likes,
            'is_answered': self.is_answered,
            'answer': self.answer,
            'created_at': self.created_at.isoformat()
        }
