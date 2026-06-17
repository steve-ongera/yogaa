import os
import random
import shutil
import uuid
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files import File
from django.conf import settings

from core.models import (
    ProfileImage, VerificationDocument, Like, Match,
    ChatMessage, PaymentTransaction, Boost, Report, Notification
)

User = get_user_model()

# ── Kenyan names pool ──────────────────────────────────────────────────────────
MALE_NAMES = [
    ('Brian', 'Otieno'), ('Kevin', 'Kamau'), ('Dennis', 'Mwangi'),
    ('Victor', 'Kipchoge'), ('Samuel', 'Njoroge'), ('Ian', 'Waweru'),
    ('Felix', 'Odhiambo'), ('Arnold', 'Mutua'), ('Clinton', 'Kariuki'),
    ('Trevor', 'Achieng'), ('Kelvin', 'Gitau'), ('Nathan', 'Mugo'),
    ('Patrick', 'Omondi'), ('Eric', 'Kiprotich'), ('David', 'Njeru'),
]

FEMALE_NAMES = [
    ('Amina', 'Hassan'), ('Faith', 'Wanjiku'), ('Grace', 'Auma'),
    ('Linda', 'Chebet'), ('Sandra', 'Moraa'), ('Mercy', 'Nyambura'),
    ('Vivian', 'Adhiambo'), ('Cynthia', 'Muthoni'), ('Brenda', 'Aoko'),
    ('Lydia', 'Wangari'), ('Eunice', 'Nekesa'), ('Sharon', 'Wanjiru'),
    ('Diana', 'Kemunto'), ('Irene', 'Njoki'), ('Pauline', 'Awino'),
]

NAIROBI_LOCATIONS = [
    'Westlands, Nairobi', 'Kilimani, Nairobi', 'Karen, Nairobi',
    'Lavington, Nairobi', 'Parklands, Nairobi', 'South B, Nairobi',
    'South C, Nairobi', 'Langata, Nairobi', 'Hurlingham, Nairobi',
    'Upperhill, Nairobi', 'Ruaka, Kiambu', 'Kasarani, Nairobi',
    'Embakasi, Nairobi', 'Buruburu, Nairobi', 'Donholm, Nairobi',
]

BIOS = [
    "Nairobi native. Coffee addict ☕ | Hiking trails on weekends 🏔️",
    "Software engineer by day, foodie by night. Let's explore Nairobi together!",
    "Lover of good vibes, good food and spontaneous road trips.",
    "Gym, brunch and Netflix. Looking for someone to share adventures with.",
    "Architect of dreams 🌙 | Matatus, mandazis and good company.",
    "Certified overthinker. Dog lover. Make me laugh and I'm yours.",
    "Travel enthusiast | 12 countries down, 100 more to go ✈️",
    "Marketing creative. Swahili puns are my love language.",
    "Just a Nairobian trying to figure out life. DM if you like ugali.",
    "Book club organiser. Jazz on Sunday mornings. Chai over coffee always.",
    "Entrepreneur | Gym rat | Looking for my person.",
    "Photographer who finds beauty in Nairobi's chaos 📸",
    "Doctor. I save lives on weekdays and Karaoke on Fridays 🎤",
    "Chef in training. Will cook for you if you earn it 😄",
    "Finance bro with a soft spot for cats and sunsets.",
]

INTERESTS_POOL = [
    'hiking', 'coffee', 'travel', 'cooking', 'gym', 'reading',
    'photography', 'music', 'dancing', 'football', 'swimming',
    'yoga', 'art', 'movies', 'gaming', 'foodie', 'fashion',
    'entrepreneurship', 'volunteering', 'nature',
]

CHAT_MESSAGES = [
    "Hey! How are you doing?",
    "I saw you like hiking, which trails have you done around Nairobi?",
    "Longonot or Suswa — which one is harder in your opinion? 😄",
    "We should grab coffee sometime at Java or Artcaffe!",
    "Have you been to the new rooftop spot in Westlands?",
    "What are you up to this weekend?",
    "Your profile pic is stunning btw 🔥",
    "I love that we matched! Tell me more about yourself.",
    "Nairobi rain hits different when you have good company 😊",
    "Favourite Kenyan dish? I'm a pilau person myself.",
]


# ── Image helpers ──────────────────────────────────────────────────────────────
IMAGE_SOURCE_DIR = r'D:\gadaf\Documents'
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}


def collect_images(source_dir: str) -> list[str]:
    """Recursively collect all image paths from source_dir."""
    images = []
    if not os.path.exists(source_dir):
        return images
    for root, _, files in os.walk(source_dir):
        for f in files:
            if os.path.splitext(f)[1].lower() in IMAGE_EXTENSIONS:
                images.append(os.path.join(root, f))
    return images


def assign_profile_image(user, image_path: str, is_primary: bool = False, order: int = 0):
    """Copy a local image into MEDIA_ROOT and attach it as a ProfileImage."""
    ext = os.path.splitext(image_path)[1].lower()
    dest_filename = f"{uuid.uuid4()}{ext}"
    dest_rel = os.path.join('profiles', str(user.id), dest_filename)
    dest_abs = os.path.join(settings.MEDIA_ROOT, dest_rel)
    os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
    shutil.copy2(image_path, dest_abs)
    ProfileImage.objects.create(
        user=user,
        image=dest_rel,
        is_primary=is_primary,
        order=order,
    )


# ── Command ────────────────────────────────────────────────────────────────────
class Command(BaseCommand):
    help = 'Delete all existing data and seed fresh dating-app data with local images.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users', type=int, default=20,
            help='Number of regular users to create (default: 20)',
        )

    def handle(self, *args, **options):
        n_users = options['users']

        # ── 1. Wipe existing data ──────────────────────────────────────────────
        self.stdout.write(self.style.WARNING('🗑️  Deleting existing data...'))
        Notification.objects.all().delete()
        Report.objects.all().delete()
        Boost.objects.all().delete()
        PaymentTransaction.objects.all().delete()
        ChatMessage.objects.all().delete()
        Match.objects.all().delete()
        Like.objects.all().delete()
        VerificationDocument.objects.all().delete()
        ProfileImage.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS('✅  All previous data deleted.'))

        # ── 2. Collect images ──────────────────────────────────────────────────
        all_images = collect_images(IMAGE_SOURCE_DIR)
        if not all_images:
            self.stdout.write(self.style.WARNING(
                f'⚠️  No images found in {IMAGE_SOURCE_DIR}. '
                'Profile images will be skipped.'
            ))
        else:
            self.stdout.write(f'📸  Found {len(all_images)} images in {IMAGE_SOURCE_DIR}')
        random.shuffle(all_images)
        img_queue = list(all_images)  # we'll pop from this

        def next_image():
            """Return a random image path (cycles if exhausted)."""
            if not img_queue:
                img_queue.extend(all_images)
                random.shuffle(img_queue)
            return img_queue.pop() if img_queue else None

        # ── 3. Create users ────────────────────────────────────────────────────
        self.stdout.write(f'\n👥  Creating {n_users} users...')
        users = []
        male_pool = MALE_NAMES * 5
        female_pool = FEMALE_NAMES * 5
        random.shuffle(male_pool)
        random.shuffle(female_pool)

        tiers = ['free', 'free', 'free', 'premium', 'premium', 'gold']

        for i in range(n_users):
            gender = 'M' if i % 2 == 0 else 'F'
            first, last = (male_pool.pop() if gender == 'M' else female_pool.pop())
            username = f"{first.lower()}{last.lower()}{random.randint(10, 99)}"
            email = f"{username}@example.com"
            dob = timezone.now().date() - timedelta(days=random.randint(365*20, 365*35))
            tier = random.choice(tiers)
            sub_expiry = (
                timezone.now() + timedelta(days=random.randint(7, 90))
                if tier != 'free' else None
            )

            user = User.objects.create_user(
                username=username,
                email=email,
                password='Password123!',
                first_name=first,
                last_name=last,
                gender=gender,
                looking_for='F' if gender == 'M' else 'M',
                date_of_birth=dob,
                bio=random.choice(BIOS),
                location=random.choice(NAIROBI_LOCATIONS),
                latitude=round(random.uniform(-1.40, -1.15), 6),
                longitude=round(random.uniform(36.70, 37.00), 6),
                is_verified=random.random() > 0.4,
                verification_badge=random.random() > 0.6,
                is_active_profile=True,
                interests=random.sample(INTERESTS_POOL, k=random.randint(3, 7)),
                subscription_tier=tier,
                subscription_expiry=sub_expiry,
                swipes_today=random.randint(0, 5),
            )
            users.append(user)

            # Assign 1-3 profile images
            n_imgs = random.randint(1, 3)
            for idx in range(n_imgs):
                img = next_image()
                if img:
                    assign_profile_image(user, img, is_primary=(idx == 0), order=idx)

        self.stdout.write(self.style.SUCCESS(f'✅  {n_users} users created.'))

        # ── 4. Likes & Matches ─────────────────────────────────────────────────
        self.stdout.write('\n❤️   Creating likes and matches...')
        males = [u for u in users if u.gender == 'M']
        females = [u for u in users if u.gender == 'F']
        likes_created = 0
        matches_created = 0

        for male in males:
            targets = random.sample(females, k=min(random.randint(3, 7), len(females)))
            for female in targets:
                like_m, _ = Like.objects.get_or_create(from_user=male, to_user=female)
                likes_created += 1

                # ~50 % chance the female liked back → match
                if random.random() > 0.5:
                    Like.objects.get_or_create(from_user=female, to_user=male)
                    likes_created += 1
                    like_m.is_match = True
                    like_m.save()

                    u1, u2 = sorted([male, female], key=lambda u: u.id)
                    match, created = Match.objects.get_or_create(
                        user1=u1, user2=u2,
                        defaults={'chat_unlocked': random.random() > 0.4},
                    )
                    if created:
                        matches_created += 1

                        # Add chat messages for unlocked matches
                        if match.chat_unlocked:
                            msgs = random.sample(CHAT_MESSAGES, k=random.randint(2, 6))
                            sender_cycle = [u1, u2]
                            for j, msg_text in enumerate(msgs):
                                ChatMessage.objects.create(
                                    match=match,
                                    sender=sender_cycle[j % 2],
                                    message=msg_text,
                                    is_read=random.random() > 0.3,
                                    created_at=timezone.now() - timedelta(minutes=random.randint(1, 1440)),
                                )

        self.stdout.write(self.style.SUCCESS(
            f'✅  {likes_created} likes | {matches_created} matches created.'
        ))

        # ── 5. Transactions ────────────────────────────────────────────────────
        self.stdout.write('\n💳  Creating payment transactions...')
        premium_users = [u for u in users if u.subscription_tier != 'free']
        tx_count = 0
        for user in premium_users:
            for _ in range(random.randint(1, 3)):
                amount = {'premium': 500, 'gold': 1000}.get(user.subscription_tier, 500)
                PaymentTransaction.objects.create(
                    user=user,
                    transaction_type=random.choice(['SUBSCRIPTION', 'BOOST']),
                    amount=amount,
                    mpesa_receipt_number=f"QH{uuid.uuid4().hex[:8].upper()}",
                    mpesa_request_id=f"ws_{uuid.uuid4().hex}",
                    status='COMPLETED',
                    subscription_tier=user.subscription_tier,
                    completed_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                )
                tx_count += 1
        self.stdout.write(self.style.SUCCESS(f'✅  {tx_count} transactions created.'))

        # ── 6. Boosts ──────────────────────────────────────────────────────────
        self.stdout.write('\n🚀  Creating boosts...')
        boost_users = random.sample(premium_users, k=min(5, len(premium_users)))
        for user in boost_users:
            Boost.objects.create(
                user=user,
                is_active=random.random() > 0.4,
                expires_at=timezone.now() + timedelta(hours=random.randint(1, 24)),
            )
        self.stdout.write(self.style.SUCCESS(f'✅  {len(boost_users)} boosts created.'))

        # ── 7. Reports ─────────────────────────────────────────────────────────
        self.stdout.write('\n🚨  Creating reports...')
        report_count = 0
        for _ in range(min(5, len(users) - 1)):
            reporter, reported = random.sample(users, 2)
            Report.objects.get_or_create(
                reporter=reporter,
                reported_user=reported,
                defaults={
                    'reason': random.choice(['SPAM', 'FAKE', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER']),
                    'description': 'Suspicious behaviour reported during seed.',
                    'resolved': random.random() > 0.5,
                }
            )
            report_count += 1
        self.stdout.write(self.style.SUCCESS(f'✅  {report_count} reports created.'))

        # ── 8. Notifications ───────────────────────────────────────────────────
        self.stdout.write('\n🔔  Creating notifications...')
        notif_count = 0
        notif_types = ['MATCH', 'LIKE', 'MESSAGE', 'SUBSCRIPTION', 'VERIFICATION']
        for user in random.sample(users, k=min(10, len(users))):
            for _ in range(random.randint(1, 4)):
                ntype = random.choice(notif_types)
                Notification.objects.create(
                    user=user,
                    notification_type=ntype,
                    message=f"You have a new {ntype.lower().replace('_', ' ')}!",
                    is_read=random.random() > 0.5,
                )
                notif_count += 1
        self.stdout.write(self.style.SUCCESS(f'✅  {notif_count} notifications created.'))

        # ── Summary ────────────────────────────────────────────────────────────
        self.stdout.write('\n' + '─' * 50)
        self.stdout.write(self.style.SUCCESS('🎉  Seeding complete!'))
        self.stdout.write(f'    Users      : {User.objects.filter(is_superuser=False).count()}')
        self.stdout.write(f'    Images     : {ProfileImage.objects.count()}')
        self.stdout.write(f'    Likes      : {Like.objects.count()}')
        self.stdout.write(f'    Matches    : {Match.objects.count()}')
        self.stdout.write(f'    Messages   : {ChatMessage.objects.count()}')
        self.stdout.write(f'    Txns       : {PaymentTransaction.objects.count()}')
        self.stdout.write(f'    Boosts     : {Boost.objects.count()}')
        self.stdout.write(f'    Reports    : {Report.objects.count()}')
        self.stdout.write(f'    Notifs     : {Notification.objects.count()}')
        self.stdout.write('─' * 50)
        self.stdout.write('    Login with any seeded user: password = Password123!')