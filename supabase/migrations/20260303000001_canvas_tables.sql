-- Canvas nodes: blocks on the interactive canvas
CREATE TABLE IF NOT EXISTS canvas_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (node_type IN ('backstory', 'content_folder', 'product', 'youtube', 'ai_chat')),
  position_x double precision NOT NULL DEFAULT 0,
  position_y double precision NOT NULL DEFAULT 0,
  width double precision DEFAULT 280,
  height double precision DEFAULT 200,
  data jsonb DEFAULT '{}',
  label text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE canvas_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own canvas nodes"
  ON canvas_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvas nodes"
  ON canvas_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvas nodes"
  ON canvas_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvas nodes"
  ON canvas_nodes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_canvas_nodes_user_id ON canvas_nodes(user_id);

-- Canvas edges: connections between nodes
CREATE TABLE IF NOT EXISTS canvas_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id uuid NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  edge_type text DEFAULT 'default',
  animated boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE canvas_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own canvas edges"
  ON canvas_edges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvas edges"
  ON canvas_edges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvas edges"
  ON canvas_edges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvas edges"
  ON canvas_edges FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_canvas_edges_user_id ON canvas_edges(user_id);
CREATE INDEX idx_canvas_edges_source ON canvas_edges(source_node_id);
CREATE INDEX idx_canvas_edges_target ON canvas_edges(target_node_id);
