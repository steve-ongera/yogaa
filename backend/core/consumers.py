import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Match, ChatMessage, Notification
from .serializers import ChatMessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.room_group_name = f'chat_{self.match_id}'
        
        # Authenticate user
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Verify user is part of this match
        if not await self.is_user_in_match():
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        
        if not message:
            return
        
        # Save message to database
        chat_message = await self.save_message(message)
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': chat_message
            }
        )
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': event['message']
        }))
    
    @database_sync_to_async
    def is_user_in_match(self):
        try:
            match = Match.objects.get(id=self.match_id)
            return self.user in [match.user1, match.user2]
        except Match.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, message):
        match = Match.objects.get(id=self.match_id)
        chat_message = ChatMessage.objects.create(
            match=match,
            sender=self.user,
            message=message
        )
        
        # Create notification for recipient
        recipient = match.user2 if self.user == match.user1 else match.user1
        Notification.objects.create(
            user=recipient,
            notification_type='MESSAGE',
            message=f'New message from {self.user.username}',
            related_id=match.id
        )
        
        return ChatMessageSerializer(chat_message).data

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.room_group_name = f'notifications_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        pass
    
    async def notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['notification']
        }))