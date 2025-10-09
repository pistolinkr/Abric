-- 이미지 메타데이터 저장 (원저작자 라이선스/권한 검증용)
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  source_provider TEXT NOT NULL, -- 'instagram','unsplash','flickr','pinterest','cosmos', etc.
  original_url TEXT NOT NULL UNIQUE,
  embed_html TEXT,               -- oEmbed 또는 제공된 embed 코드
  license_type TEXT,             -- 'instagram','cc-by','cc-by-nc','all-rights-reserved', etc.
  license_url TEXT,              -- 라이선스 원문 링크
  commercial_allowed BOOLEAN,    -- 상업적 사용 가능여부
  attribution_text TEXT,         -- 표시할 저작자/출처 문자열(예: "Photo by X on Instagram")
  provider_attribution_required BOOLEAN DEFAULT TRUE,
  author_name TEXT,              -- 저작자 이름
  author_url TEXT,               -- 저작자 프로필 URL
  image_url TEXT,                -- 실제 이미지 URL
  thumbnail_url TEXT,            -- 썸네일 URL
  title TEXT,                    -- 이미지 제목
  description TEXT,              -- 이미지 설명
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 캔버스(사용자 페이지)에 삽입된 항목
CREATE TABLE canvas_embeds (
  id SERIAL PRIMARY KEY,
  canvas_id UUID NOT NULL,
  image_id INT REFERENCES images(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL,
  embed_position JSONB,   -- layout info
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  note TEXT
);

-- 사용자의 계정/목적(상업적 여부 판단 기준)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  is_business BOOLEAN DEFAULT FALSE, -- 계정 자체가 상업적 활동인지
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX idx_images_original_url ON images(original_url);
CREATE INDEX idx_images_source_provider ON images(source_provider);
CREATE INDEX idx_canvas_embeds_canvas_id ON canvas_embeds(canvas_id);
CREATE INDEX idx_canvas_embeds_owner_user_id ON canvas_embeds(owner_user_id);
