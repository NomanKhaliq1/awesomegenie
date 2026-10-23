alter table website_json_sources
  add column if not exists sync_enabled boolean default true,
  add column if not exists pinecone_synced boolean default false,
  add column if not exists pinecone_namespace text default 'website',
  add column if not exists needs_review boolean default false,
  add column if not exists last_synced_at timestamptz;

alter table website_sections
  add column if not exists content_hash text,
  add column if not exists pinecone_synced boolean default false;

alter table rag_chunks
  add column if not exists pinecone_vector_id text,
  add column if not exists pinecone_namespace text default 'website',
  add column if not exists chunk_index integer;

create unique index if not exists idx_rag_chunks_pinecone_vector_id
  on rag_chunks(pinecone_vector_id)
  where pinecone_vector_id is not null;

alter table rag_retrieval_logs
  add column if not exists pinecone_namespace text,
  add column if not exists selected_source_ids jsonb,
  add column if not exists selected_source_urls jsonb,
  add column if not exists similarity_scores jsonb;

alter table uploaded_files
  add column if not exists pinecone_namespace text;

alter table ai_usage_logs
  add column if not exists model_layer text;

create table if not exists document_sources (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  uploaded_file_id uuid references uploaded_files(id),
  source_type text default 'uploaded_file',
  file_name text,
  mime_type text,
  extracted_text text,
  extraction_status text,
  pinecone_namespace text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_source_id uuid references document_sources(id),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  uploaded_file_id uuid references uploaded_files(id),
  pinecone_vector_id text unique,
  pinecone_namespace text,
  chunk_text text not null,
  chunk_title text,
  chunk_index integer,
  token_estimate integer,
  content_hash text,
  metadata jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  client_id uuid references clients(id),
  summary_text text,
  summary_json jsonb,
  message_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_document_sources_updated_at') then
    create trigger set_document_sources_updated_at
      before update on document_sources
      for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_conversation_summaries_updated_at') then
    create trigger set_conversation_summaries_updated_at
      before update on conversation_summaries
      for each row execute function set_updated_at();
  end if;
end $$;

alter table document_sources enable row level security;
alter table document_chunks enable row level security;
alter table conversation_summaries enable row level security;
