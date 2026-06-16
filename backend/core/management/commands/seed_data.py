from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import ProfileImage
import random
from faker import Faker

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Seed database with sample data'
    
    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create admin user
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@dating-saas.com',
                password='admin123',
                is_verified=True,
                verification_badge=True
            )
            self.stdout.write('Admin user created')
        
        # Create sample users
        genders = ['M', 'F', 'O']
        interests = ['Music', 'Sports', 'Travel', 'Reading', 'Movies', 'Cooking', 
                    'Dancing', 'Photography', 'Art', 'Gaming', 'Fashion', 'Technology']
        
        for i in range(20):
            gender = random.choice(genders)
            looking_for = random.choice(genders)
            
            user = User.objects.create_user(
                username=fake.user_name(),
                email=fake.email(),
                password='password123',
                phone_number=f'2547{random.randint(10000000, 99999999)}',
                gender=gender,
                looking_for=looking_for,
                date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=50),
                bio=fake.text(max_nb_chars=200),
                location=fake.city(),
                latitude=random.uniform(-4.0, 5.0),
                longitude=random.uniform(34.0, 42.0),
                is_verified=random.choice([True, False]),
                verification_badge=random.choice([True, False]),
                subscription_tier=random.choice(['free', 'premium', 'gold'])
            )
            
            # Add random interests
            user_interests = random.sample(interests, random.randint(2, 5))
            user.interests = user_interests
            user.save()
            
            self.stdout.write(f'Created user: {user.username}')
        
        self.stdout.write('Database seeded successfully!')