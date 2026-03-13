# SportSquad - PRD

## Original Problem Statement
Full-stack web application that facilitates group sports by connecting people who want to practice a sport together. Users can create ads to organize sporting activities and other users can join.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (collections: users, user_sessions, activities, messages, ratings)
- **Auth**: Emergent-managed Google OAuth
- **Chat**: WebSocket real-time messaging
- **Design**: Sporty/energetic - Volt Lime (#CCFF00) + Carbon Black (#0A0A0A), Barlow Condensed + Manrope fonts

## User Personas
1. **Activity Creator** - Organizes group sports events, manages participants
2. **Activity Joiner** - Browses and joins activities matching their sport/level/location
3. **Casual Browser** - Views available activities without account

## Core Requirements
- Google OAuth authentication
- User profiles (name, photo, age, city, sports, level)
- Activity CRUD (sport, location, date, time, max participants, level, description, image)
- Activity filtering (sport, city, date) with pagination
- Join/leave activities
- Participant management
- Real-time group chat (WebSocket)
- Player rating system (1-5 stars)
- File upload for profile photos and activity images
- Personal dashboard (created/joined activities, stats)

## What's Been Implemented (2026-03-13)
- Complete Emergent Google OAuth authentication flow
- User profile management with photo upload
- Activity CRUD with filtering and pagination
- Join/leave activities with participant management
- Real-time WebSocket group chat per activity
- Player rating system (1-5 stars with comments)
- File upload for images
- Personal dashboard with stats
- Landing page with hero, features grid, sports marquee, CTA
- Activities browse page with sport/city/date filters
- Activity detail page with participants, chat, ratings
- Create activity form with image upload
- Profile edit page with sports selection
- Responsive mobile-first design

## Prioritized Backlog
### P0 (Critical)
- All core features implemented

### P1 (Important)
- Notification system for activity updates
- Activity edit functionality (frontend form)
- Search by activity title

### P2 (Nice to have)
- Email notifications for new participants
- Activity comments/reviews
- Social sharing features
- Activity recurring schedules
- Advanced search with multiple filters

## Next Tasks
- Add notification system
- Activity editing from dashboard
- User-to-user messaging
- Activity status management (completed/cancelled)
