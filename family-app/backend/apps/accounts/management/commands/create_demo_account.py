"""
Django management command to create a demo account with 2 families, topology, chat, and pending join requests.

Creates: demo user (admin of both families), 2 family groups, ~25-30 person topology per family
(from CSV + code), filled feed (MESSAGE/POST/ANNOUNCEMENT + comments), pending join requests,
and seed data so "Analyze Missing Relationships" returns 2-3 suggestions.

Default credentials: username=demo, email=demo@example.com, password=Demo123!

Usage:
    python manage.py create_demo_account
    python manage.py create_demo_account --username demo --email demo@example.com --password Demo123!
    python manage.py create_demo_account --reset   # Remove demo user and related data, then exit
"""
import csv
from datetime import date, timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.families.models import Family, FamilyMembership, JoinRequest
from apps.families.services.family_service import create_family_with_membership, create_join_request
from apps.feed.models import Post, PostComment, PostTypeChoices
from apps.graph.models import GenderChoices, Person, Relationship, RelationshipTypeChoices


# Default demo credentials (document in help so testers can log in)
DEMO_USERNAME = 'demo'
DEMO_EMAIL = 'demo@example.com'
DEMO_PASSWORD = 'Demo123!'

# Prefix for users we create so --reset can remove them
DEMO_MEMBER_PREFIX = 'demo_member_'
DEMO_OUTSIDER_PREFIX = 'demo_outsider_'


def get_user_model():
    from django.contrib.auth import get_user_model
    return get_user_model()


def get_demo_csv_path():
    """Resolve path to demo_members.csv relative to backend root."""
    base = Path(settings.BASE_DIR)
    return base / 'data' / 'demo_members.csv'


def load_csv_members(path):
    """Load rows from CSV; return list of dicts with first_name, last_name, dob, gender."""
    members = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            first = (row.get('first_name') or '').strip()
            last = (row.get('last_name') or '').strip()
            if not first:
                continue
            dob = None
            if row.get('dob'):
                try:
                    dob = date.fromisoformat(row['dob'].strip())
                except ValueError:
                    pass
            gender = (row.get('gender') or 'UNKNOWN').strip().upper()
            if gender not in (GenderChoices.MALE, GenderChoices.FEMALE, GenderChoices.OTHER):
                gender = GenderChoices.UNKNOWN
            members.append({
                'first_name': first,
                'last_name': last,
                'dob': dob,
                'gender': gender,
            })
    return members


class Command(BaseCommand):
    help = (
        'Create a demo user with 2 families, ~25-30 topology each, filled chat, and pending join requests. '
        'Use --reset to remove the demo user and related data. Default login: demo / Demo123!'
    )

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default=DEMO_USERNAME, help='Demo user username')
        parser.add_argument('--email', type=str, default=DEMO_EMAIL, help='Demo user email')
        parser.add_argument('--password', type=str, default=DEMO_PASSWORD, help='Demo user password')
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete the demo user (and demo member/outsider users) and all related data, then exit',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        reset = options['reset']

        if reset:
            self._do_reset(User, username)
            return

        if User.objects.filter(username=username).exists():
            raise CommandError(
                f'Demo user "{username}" already exists. Use --reset to remove and recreate.'
            )

        with transaction.atomic():
            demo_user = self._create_demo_user(User, options)
            family1, family2 = self._create_families(demo_user)
            self._build_topology(family1, family2, demo_user)
            member_users = self._create_member_users(User, family1, family2)
            self._create_feed_posts(demo_user, family1, family2, member_users)
            outsider_users = self._create_outsider_users(User)
            self._create_pending_join_requests(family1, family2, outsider_users)

        self.stdout.write(
            self.style.SUCCESS(
                f'Demo account created. Login: {username} / {options["password"]}'
            )
        )

    def _do_reset(self, User, demo_username):
        """Delete demo user and demo_member_* / demo_outsider_* users and cascaded data."""
        with transaction.atomic():
            to_delete = list(User.objects.filter(username=demo_username))
            to_delete.extend(
                User.objects.filter(username__startswith=DEMO_MEMBER_PREFIX)
            )
            to_delete.extend(
                User.objects.filter(username__startswith=DEMO_OUTSIDER_PREFIX)
            )
            seen = set()
            for u in to_delete:
                if u.pk in seen:
                    continue
                seen.add(u.pk)
                self.stdout.write(f'Deleting user: {u.username}')
                u.delete()
        self.stdout.write(self.style.SUCCESS('Reset complete. Run create_demo_account again to recreate.'))

    def _create_demo_user(self, User, options):
        return User.objects.create_user(
            username=options['username'],
            email=options['email'],
            password=options['password'],
            first_name='Demo',
            last_name='User',
            dob=date(1990, 5, 15),
            gender=GenderChoices.UNKNOWN,
            is_active=True,
        )

    def _create_families(self, demo_user):
        family1 = create_family_with_membership('Smith Family', demo_user)
        family2 = create_family_with_membership('Jones Family', demo_user)
        return family1, family2

    def _build_topology(self, family1, family2, demo_user):
        """For each family: load CSV persons, add code-generated persons, build relationships with 2-3 missing-parent cases."""
        csv_path = get_demo_csv_path()
        if not csv_path.exists():
            raise CommandError(f'CSV not found: {csv_path}')
        csv_members = load_csv_members(csv_path)
        if len(csv_members) < 3:
            raise CommandError(f'CSV must have at least 3 members, found {len(csv_members)}')

        for family in (family1, family2):
            self._build_family_topology(family, demo_user, csv_members)

    def _build_family_topology(self, family, demo_user, csv_members):
        """Build a realistic 3-generation family (~25-30 persons) with grandparents, uncles, aunts, cousins.
        Leaves 2-3 missing-parent cases so 'Analyze Missing Relationships' returns suggestions."""
        demo_membership = FamilyMembership.objects.get(user=demo_user, family=family)
        demo_person = demo_membership.person

        # Family last name from family name (e.g. "Smith Family" -> "Smith")
        family_last = family.name.replace(' Family', '').strip() or 'Smith'

        def add_rel(fr, to, rel_type):
            Relationship.objects.get_or_create(
                family=family,
                from_person=fr,
                to_person=to,
                type=rel_type,
            )

        def make_person(first_name, last_name, dob, gender):
            return Person.objects.create(
                family=family,
                first_name=first_name,
                last_name=last_name,
                dob=dob,
                gender=gender,
            )

        # 1) Create persons from CSV (at least 3) and keep them in the graph as extra relatives
        csv_persons = []
        for m in csv_members:
            p = make_person(
                m['first_name'],
                m['last_name'],
                m['dob'],
                m['gender'],
            )
            csv_persons.append(p)

        # 2) Realistic 3-generation tree with clear roles (grandfather, grandmother, uncles, aunts, cousins)
        # Gen 1: Grandparents (born ~1940s)
        grandfather = make_person('George', family_last, date(1942, 5, 12), GenderChoices.MALE)
        grandmother = make_person('Margaret', family_last, date(1945, 8, 20), GenderChoices.FEMALE)
        add_rel(grandfather, grandmother, RelationshipTypeChoices.SPOUSE_OF)

        # Gen 2: Their children (born ~1965-1975) — demo's parent + uncles/aunts
        father = make_person('Robert', family_last, date(1968, 3, 10), GenderChoices.MALE)
        mother = make_person('Susan', 'Hayes', date(1970, 11, 22), GenderChoices.FEMALE)  # married in
        aunt = make_person('Elizabeth', family_last, date(1972, 7, 5), GenderChoices.FEMALE)
        uncle = make_person('William', family_last, date(1965, 1, 18), GenderChoices.MALE)
        aunt2 = make_person('Catherine', family_last, date(1975, 9, 30), GenderChoices.FEMALE)

        for child in (father, aunt, uncle, aunt2):
            add_rel(grandfather, child, RelationshipTypeChoices.PARENT_OF)
            add_rel(grandmother, child, RelationshipTypeChoices.PARENT_OF)

        add_rel(father, mother, RelationshipTypeChoices.SPOUSE_OF)
        uncle_spouse = make_person('Helen', 'Clark', date(1967, 4, 14), GenderChoices.FEMALE)
        add_rel(uncle, uncle_spouse, RelationshipTypeChoices.SPOUSE_OF)
        aunt_spouse = make_person('James', 'Wright', date(1971, 12, 8), GenderChoices.MALE)
        add_rel(aunt, aunt_spouse, RelationshipTypeChoices.SPOUSE_OF)
        aunt2_spouse = make_person('David', 'Taylor', date(1974, 6, 25), GenderChoices.MALE)
        add_rel(aunt2, aunt2_spouse, RelationshipTypeChoices.SPOUSE_OF)

        # Gen 3: Grandchildren — demo person + siblings + cousins
        sibling1 = make_person('Emily', family_last, date(1998, 2, 14), GenderChoices.FEMALE)
        sibling2 = make_person('Michael', family_last, date(2001, 10, 5), GenderChoices.MALE)
        cousin1 = make_person('Sarah', 'Wright', date(2003, 5, 19), GenderChoices.FEMALE)  # Elizabeth's daughter
        cousin2 = make_person('Daniel', 'Wright', date(2006, 8, 3), GenderChoices.MALE)
        cousin3 = make_person('Lucy', 'Clark', date(2004, 12, 11), GenderChoices.FEMALE)  # William's daughter
        cousin4 = make_person('Oliver', 'Taylor', date(2008, 4, 7), GenderChoices.MALE)  # Catherine's son
        # One more uncle for a larger tree
        uncle3 = make_person('Thomas', family_last, date(1962, 6, 15), GenderChoices.MALE)
        uncle3_spouse = make_person('Rachel', 'Green', date(1964, 2, 28), GenderChoices.FEMALE)
        add_rel(grandfather, uncle3, RelationshipTypeChoices.PARENT_OF)
        add_rel(grandmother, uncle3, RelationshipTypeChoices.PARENT_OF)
        add_rel(uncle3, uncle3_spouse, RelationshipTypeChoices.SPOUSE_OF)
        cousin5 = make_person('Sophie', 'Green', date(2005, 7, 22), GenderChoices.FEMALE)
        add_rel(uncle3, cousin5, RelationshipTypeChoices.PARENT_OF)
        add_rel(uncle3_spouse, cousin5, RelationshipTypeChoices.PARENT_OF)

        # Demo person's family: both parents linked
        add_rel(father, demo_person, RelationshipTypeChoices.PARENT_OF)
        add_rel(mother, demo_person, RelationshipTypeChoices.PARENT_OF)
        add_rel(father, sibling1, RelationshipTypeChoices.PARENT_OF)
        add_rel(mother, sibling1, RelationshipTypeChoices.PARENT_OF)
        add_rel(father, sibling2, RelationshipTypeChoices.PARENT_OF)
        add_rel(mother, sibling2, RelationshipTypeChoices.PARENT_OF)

        # Aunt Elizabeth's children: link both parents for Sarah; leave Daniel with only Elizabeth (missing-parent suggestion)
        add_rel(aunt, cousin1, RelationshipTypeChoices.PARENT_OF)
        add_rel(aunt_spouse, cousin1, RelationshipTypeChoices.PARENT_OF)
        add_rel(aunt, cousin2, RelationshipTypeChoices.PARENT_OF)
        # intentionally do NOT add aunt_spouse as parent of cousin2 -> suggestion

        # Uncle William's child: leave Lucy with only Helen (missing-parent suggestion)
        add_rel(uncle_spouse, cousin3, RelationshipTypeChoices.PARENT_OF)
        # intentionally do NOT add uncle as parent of cousin3 -> suggestion

        # Aunt Catherine's child: leave Oliver with only Catherine (missing-parent suggestion)
        add_rel(aunt2, cousin4, RelationshipTypeChoices.PARENT_OF)
        # intentionally do NOT add aunt2_spouse as parent of cousin4 -> suggestion

        # Wire CSV persons into the tree as extra Gen 2 siblings (more uncles/aunts)
        for i, csv_p in enumerate(csv_persons[:3]):
            add_rel(grandfather, csv_p, RelationshipTypeChoices.PARENT_OF)
            add_rel(grandmother, csv_p, RelationshipTypeChoices.PARENT_OF)

    def _create_member_users(self, User, family1, family2):
        """Create 2-3 member users with Person + FamilyMembership in both families."""
        members = []
        for i in range(1, 3):  # demo_member_1, demo_member_2
            username = f'{DEMO_MEMBER_PREFIX}{i}'
            if User.objects.filter(username=username).exists():
                u = User.objects.get(username=username)
                members.append(u)
                for family in (family1, family2):
                    if not FamilyMembership.objects.filter(user=u, family=family).exists():
                        person = Person.objects.create(
                            family=family,
                            first_name='Member',
                            last_name=str(i),
                            dob=date(1995, 1, 1),
                            gender=GenderChoices.UNKNOWN,
                        )
                        FamilyMembership.objects.create(
                            user=u,
                            family=family,
                            person=person,
                            role=FamilyMembership.Role.MEMBER,
                            status=FamilyMembership.Status.ACTIVE,
                        )
                continue
            u = User.objects.create_user(
                username=username,
                email=f'demo.member.{i}@example.com',
                password=DEMO_PASSWORD,
                first_name='Member',
                last_name=str(i),
                is_active=True,
            )
            members.append(u)
            for family in (family1, family2):
                person = Person.objects.create(
                    family=family,
                    first_name='Member',
                    last_name=str(i),
                    dob=date(1995, 1, 1),
                    gender=GenderChoices.UNKNOWN,
                )
                FamilyMembership.objects.create(
                    user=u,
                    family=family,
                    person=person,
                    role=FamilyMembership.Role.MEMBER,
                    status=FamilyMembership.Status.ACTIVE,
                )
        return members

    def _create_feed_posts(self, demo_user, family1, family2, member_users):
        """Create MESSAGE, POST, ANNOUNCEMENT and comments in each family."""
        posts_data = [
            (PostTypeChoices.MESSAGE, 'Hey everyone, don\'t forget the reunion next weekend!'),
            (PostTypeChoices.MESSAGE, 'Thanks for the photos from the trip!'),
            (PostTypeChoices.POST, 'Happy birthday to our grandma! 🎂'),
            (PostTypeChoices.ANNOUNCEMENT, 'Family meeting this Saturday at 3 PM.'),
            (PostTypeChoices.MESSAGE, 'Who\'s bringing the dessert?'),
            (PostTypeChoices.MESSAGE, 'I can bring the cake.'),
            (PostTypeChoices.POST, 'New baby photos are in the album.'),
            (PostTypeChoices.MESSAGE, 'See you all at the party!'),
        ]
        comment_texts = ['Sounds good!', 'Count me in.', '👍', 'Can\'t wait!', 'Thanks for sharing!']

        all_members = [demo_user] + list(member_users)
        for family in (family1, family2):
            demo_membership = FamilyMembership.objects.get(user=demo_user, family=family)
            demo_person = demo_membership.person
            member_persons = []
            for u in member_users:
                m = FamilyMembership.objects.get(user=u, family=family)
                member_persons.append(m.person)

            for idx, (post_type, text) in enumerate(posts_data):
                author = all_members[idx % len(all_members)]
                author_person = demo_person if author == demo_user else member_persons[all_members.index(author) - 1]
                post = Post.objects.create(
                    family=family,
                    author_user=author,
                    author_person=author_person,
                    type=post_type,
                    text=text,
                )
                # Spread created_at over past days
                if idx % 2 == 0:
                    past = timezone.now() - timedelta(days=idx, hours=idx)
                    Post.objects.filter(pk=post.pk).update(created_at=past)

                # Add 1-2 comments on some posts
                if idx % 2 == 1:
                    for ci, ct in enumerate(comment_texts[:2]):
                        comment_author = all_members[(idx + ci) % len(all_members)]
                        comment_person = demo_person if comment_author == demo_user else member_persons[all_members.index(comment_author) - 1]
                        c = PostComment.objects.create(
                            post=post,
                            author_user=comment_author,
                            author_person=comment_person,
                            text=ct,
                        )
                        PostComment.objects.filter(pk=c.pk).update(
                            created_at=timezone.now() - timedelta(days=ci, hours=ci * 2)
                        )

    def _create_outsider_users(self, User):
        """Create 2-3 users with no family membership."""
        outsiders = []
        for i in range(1, 3):
            username = f'{DEMO_OUTSIDER_PREFIX}{i}'
            if User.objects.filter(username=username).exists():
                outsiders.append(User.objects.get(username=username))
                continue
            u = User.objects.create_user(
                username=username,
                email=f'demo.outsider.{i}@example.com',
                password=DEMO_PASSWORD,
                first_name=f'Outsider',
                last_name=str(i),
                is_active=True,
            )
            outsiders.append(u)
        return outsiders

    def _create_pending_join_requests(self, family1, family2, outsider_users):
        """Create PENDING JoinRequests for each family from outsider users."""
        for family in (family1, family2):
            create_join_request(family.code, outsider_users[0], new_person_payload={'first_name': 'Outsider', 'last_name': '1'})
            if len(outsider_users) > 1:
                create_join_request(family.code, outsider_users[1], new_person_payload={'first_name': 'Outsider', 'last_name': '2'})
