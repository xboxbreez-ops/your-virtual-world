-- Friendships
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  friend_username text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friendships visible to involved users"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users insert own friendship rows"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Friend can update status (accept/decline)"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Either party can delete"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE INDEX ON public.friendships (user_id);
CREATE INDEX ON public.friendships (friend_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  message text NOT NULL CHECK (length(message) > 0 AND length(message) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat visible to authenticated users"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users post as themselves"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ON public.chat_messages (channel, created_at DESC);

-- Match queue
CREATE TABLE public.match_queue (
  user_id uuid PRIMARY KEY,
  username text NOT NULL,
  mode text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue visible to authenticated"
  ON public.match_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users manage own queue row"
  ON public.match_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;