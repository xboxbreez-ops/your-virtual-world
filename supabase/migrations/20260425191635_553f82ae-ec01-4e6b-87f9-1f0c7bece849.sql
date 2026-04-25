
-- Inventory of owned cosmetic items (item_id encodes category + key, e.g. "hat:crown")
CREATE TABLE public.inventory (
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory viewable by everyone"
ON public.inventory FOR SELECT USING (true);

CREATE POLICY "Users insert own inventory"
ON public.inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Atomic purchase: check bux, deduct, grant item. Returns new balance.
CREATE OR REPLACE FUNCTION public.purchase_item(_item_id TEXT, _price INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  current_bux INTEGER;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _price < 0 THEN
    RAISE EXCEPTION 'Invalid price';
  END IF;

  -- Already owned? Just return current bux
  IF EXISTS (SELECT 1 FROM public.inventory WHERE user_id = uid AND item_id = _item_id) THEN
    SELECT bux INTO current_bux FROM public.profiles WHERE id = uid;
    RETURN current_bux;
  END IF;

  SELECT bux INTO current_bux FROM public.profiles WHERE id = uid FOR UPDATE;
  IF current_bux IS NULL THEN
    RAISE EXCEPTION 'Profile missing';
  END IF;
  IF current_bux < _price THEN
    RAISE EXCEPTION 'Not enough Bux';
  END IF;

  UPDATE public.profiles SET bux = bux - _price, updated_at = now() WHERE id = uid;
  INSERT INTO public.inventory (user_id, item_id) VALUES (uid, _item_id);

  RETURN current_bux - _price;
END;
$$;
