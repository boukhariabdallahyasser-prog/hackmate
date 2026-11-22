# 0001 Reuse the existing HackMate database

Status — accepted for local development planning

An active Supabase project named HackMate already contains the identity and event/team foundation migrations. Preserve the existing project and recovered migration history. Add local incremental changes, replay and test them with isolated data, then apply reviewed changes to the authorized target. Generate database types from the resulting schema.

The first public query uses explicit approved-event columns with the publishable key. This provides a working vertical slice without requiring any hosted schema changes.
