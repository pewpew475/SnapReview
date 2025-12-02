# Database Setup Guide

This guide will help you set up the database schema for the SnapReview application using Supabase.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase SQL Editor

## Setup Steps

### 1. Run the Schema SQL

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run** to execute the schema

### 2. Verify Tables Created

After running the schema, verify that the following tables were created:

- `profiles` - User profile information
- `tasks` - Code submission tasks
- `evaluations` - AI evaluation results
- `payments` - Payment transaction records

### 3. Verify RLS Policies

Row Level Security (RLS) is enabled on all tables. Verify the policies:

- Users can only view/update their own data
- All policies use `auth.uid()` to enforce user isolation

### 4. Test the Setup

You can test the setup by:

1. Creating a test user through Supabase Auth
2. Verifying that a profile is automatically created (via trigger)
3. Testing RLS by querying data as different users

## Schema Overview

### profiles
Extends Supabase `auth.users` with additional user information:
- `id` - References `auth.users.id`
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- `credits` - Available credits for premium features

### tasks
Stores code submission tasks:
- `id` - Unique task identifier
- `user_id` - Owner of the task
- `title`, `description` - Task metadata
- `code_content` - The code to be evaluated
- `programming_language` - Language of the code
- `status` - Task processing status

### evaluations
Stores AI evaluation results:
- `id` - Unique evaluation identifier
- `task_id` - Related task
- `overall_score` - Overall code quality score (0-100)
- Individual scores for readability, efficiency, maintainability, security
- `strengths`, `improvements` - JSONB arrays with detailed feedback
- `refactored_code` - Improved version of the code
- `is_unlocked` - Whether the full report is accessible

### payments
Stores payment transaction records:
- `id` - Unique payment identifier
- `user_id` - User who made the payment
- `evaluation_id` - Evaluation being unlocked
- `transaction_id` - Gateway transaction ID
- `payment_status` - Status of the payment

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the schema SQL in the correct database
- Check that all CREATE TABLE statements executed successfully

### Error: "permission denied"
- Verify RLS policies are correctly set up
- Check that you're using the service role key for server-side operations

### Trigger not working
- Verify the `handle_new_user()` function exists
- Check that the trigger `on_auth_user_created` is attached to `auth.users`

## Next Steps

After setting up the database:

1. Configure your `.env.local` file with Supabase credentials
2. Test the API endpoints
3. Set up authentication in your application

