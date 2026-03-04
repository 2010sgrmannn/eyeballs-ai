-- Add carousel_urls column to content
ALTER TABLE content ADD COLUMN carousel_urls jsonb DEFAULT '[]'::jsonb;

-- Create favorites table
CREATE TABLE favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  content_id uuid REFERENCES content NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, content_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create folders table
CREATE TABLE folders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Create folder_items table
CREATE TABLE folder_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid REFERENCES folders NOT NULL,
  content_id uuid REFERENCES content NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (folder_id, content_id)
);

ALTER TABLE folder_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their own folders"
  ON folder_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM folders WHERE folders.id = folder_items.folder_id AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items into their own folders"
  ON folder_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM folders WHERE folders.id = folder_items.folder_id AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own folders"
  ON folder_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM folders WHERE folders.id = folder_items.folder_id AND folders.user_id = auth.uid()
    )
  );
