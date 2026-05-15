-- Kirameku Blog - PostgreSQL 建表脚本
-- 执行方式: psql -U postgres -d kirameku -f init_db.sql

-- ============================================
-- 1. User（用户/管理员）
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    hashed_password VARCHAR(128) NOT NULL,
    nickname      VARCHAR(50)  DEFAULT '',
    avatar        VARCHAR(500) DEFAULT '',
    email         VARCHAR(100) DEFAULT '',
    bio           VARCHAR(500) DEFAULT '',
    is_admin      BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 2. Category（分类）
-- ============================================
CREATE TABLE IF NOT EXISTS category (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  UNIQUE NOT NULL,
    slug          VARCHAR(50)  UNIQUE NOT NULL,
    description   VARCHAR(200) DEFAULT '',
    sort          INTEGER      DEFAULT 0,
    post_count    INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 3. Tag（标签）
-- ============================================
CREATE TABLE IF NOT EXISTS tag (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  UNIQUE NOT NULL,
    slug          VARCHAR(50)  UNIQUE NOT NULL,
    post_count    INTEGER      DEFAULT 0
);

-- ============================================
-- 4. Post（文章）
-- ============================================
CREATE TABLE IF NOT EXISTS post (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    slug          VARCHAR(200) UNIQUE NOT NULL,
    description   VARCHAR(500) DEFAULT '',
    content       TEXT         DEFAULT '',
    cover         VARCHAR(500) DEFAULT '',
    category_id   INTEGER      REFERENCES category(id) ON DELETE SET NULL,
    status        VARCHAR(20)  DEFAULT 'draft',
    is_pinned     BOOLEAN      DEFAULT FALSE,
    views         INTEGER      DEFAULT 0,
    likes         INTEGER      DEFAULT 0,
    word_count    INTEGER      DEFAULT 0,
    reading_time  INTEGER      DEFAULT 0,
    published_at  TIMESTAMP,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_slug ON post(slug);
CREATE INDEX IF NOT EXISTS idx_post_status ON post(status);
CREATE INDEX IF NOT EXISTS idx_post_category ON post(category_id);

-- ============================================
-- 5. PostTag（文章-标签 中间表）
-- ============================================
CREATE TABLE IF NOT EXISTS post_tag (
    post_id       INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    tag_id        INTEGER NOT NULL REFERENCES tag(id)  ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ============================================
-- 6. Comment（文章评论）
-- ============================================
CREATE TABLE IF NOT EXISTS comment (
    id            SERIAL PRIMARY KEY,
    post_id       INTEGER      NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    parent_id     INTEGER      REFERENCES comment(id) ON DELETE CASCADE,
    nickname      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) DEFAULT '',
    website       VARCHAR(200) DEFAULT '',
    content       TEXT         NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',
    ip            VARCHAR(45)  DEFAULT '',
    status        VARCHAR(20)  DEFAULT 'pending',
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_status ON comment(status);

-- ============================================
-- 7. GitHubUser（GitHub 登录用户）
-- ============================================
CREATE TABLE IF NOT EXISTS github_user (
    id            SERIAL PRIMARY KEY,
    github_id     INTEGER      UNIQUE NOT NULL,
    login         VARCHAR(100) NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',
    bio           VARCHAR(500) DEFAULT '',
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_github_user_id ON github_user(github_id);

-- ============================================
-- 8. Message（留言板/杂谈）
-- ============================================
CREATE TABLE IF NOT EXISTS message (
    id              SERIAL PRIMARY KEY,
    github_user_id  INTEGER      REFERENCES github_user(id) ON DELETE SET NULL,
    parent_id       INTEGER      REFERENCES message(id) ON DELETE CASCADE,
    content         TEXT         NOT NULL,
    ip              VARCHAR(45)  DEFAULT '',
    status          VARCHAR(20)  DEFAULT 'approved',
    likes           INTEGER      DEFAULT 0,
    created_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_status ON message(status);
CREATE INDEX IF NOT EXISTS idx_message_parent ON message(parent_id);
CREATE INDEX IF NOT EXISTS idx_message_github_user ON message(github_user_id);

-- ============================================
-- 9. Chatter（说说/微语）
-- ============================================
CREATE TABLE IF NOT EXISTS chatter (
    id              SERIAL PRIMARY KEY,
    content         TEXT         NOT NULL,
    images          TEXT         DEFAULT '[]',
    mood            VARCHAR(20)  DEFAULT '',
    likes           INTEGER      DEFAULT 0,
    comments_count  INTEGER      DEFAULT 0,
    status          VARCHAR(20)  DEFAULT 'draft',
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatter_status ON chatter(status);

-- ============================================
-- 10. ChatterComment（说说评论）
-- ============================================
CREATE TABLE IF NOT EXISTS chatter_comment (
    id            SERIAL PRIMARY KEY,
    chatter_id    INTEGER      NOT NULL REFERENCES chatter(id) ON DELETE CASCADE,
    parent_id     INTEGER      REFERENCES chatter_comment(id) ON DELETE CASCADE,
    nickname      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) DEFAULT '',
    content       TEXT         NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',
    ip            VARCHAR(45)  DEFAULT '',
    status        VARCHAR(20)  DEFAULT 'pending',
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatter_comment_chatter ON chatter_comment(chatter_id);
CREATE INDEX IF NOT EXISTS idx_chatter_comment_status ON chatter_comment(status);

-- ============================================
-- 11. Album（相册）
-- ============================================
CREATE TABLE IF NOT EXISTS album (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(100) NOT NULL,
    description   VARCHAR(500) DEFAULT '',
    cover         VARCHAR(500) DEFAULT '',
    photo_count   INTEGER      DEFAULT 0,
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 12. Photo（照片）
-- ============================================
CREATE TABLE IF NOT EXISTS photo (
    id            SERIAL PRIMARY KEY,
    album_id      INTEGER      NOT NULL REFERENCES album(id) ON DELETE CASCADE,
    url           VARCHAR(500) NOT NULL,
    caption       VARCHAR(200) DEFAULT '',
    orientation   VARCHAR(20)  DEFAULT 'landscape',
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_album ON photo(album_id);

-- ============================================
-- 13. Project（项目展示）
-- ============================================
CREATE TABLE IF NOT EXISTS project (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    slug             VARCHAR(100) UNIQUE NOT NULL,
    description      VARCHAR(500) DEFAULT '',
    long_description TEXT         DEFAULT '',
    cover_image      VARCHAR(500) DEFAULT '',
    tech_stack       TEXT         DEFAULT '[]',
    link_github      VARCHAR(300) DEFAULT '',
    link_gitee       VARCHAR(300) DEFAULT '',
    link_live        VARCHAR(300) DEFAULT '',
    link_docs        VARCHAR(300) DEFAULT '',
    status           VARCHAR(20)  DEFAULT 'developing',
    status_label     VARCHAR(20)  DEFAULT '',
    is_featured      BOOLEAN      DEFAULT FALSE,
    sort             INTEGER      DEFAULT 0,
    created_at       TIMESTAMP    DEFAULT NOW(),
    updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 14. FriendLink（友情链接）
-- ============================================
CREATE TABLE IF NOT EXISTS friend_link (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    url           VARCHAR(300) NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',
    description   VARCHAR(300) DEFAULT '',
    sort          INTEGER      DEFAULT 0,
    is_approved   BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 15. BookmarkCategory（收藏夹分类）
-- ============================================
CREATE TABLE IF NOT EXISTS bookmark_category (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL,
    icon          VARCHAR(50)  DEFAULT '',
    description   VARCHAR(200) DEFAULT '',
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 16. BookmarkSite（收藏站点）
-- ============================================
CREATE TABLE IF NOT EXISTS bookmark_site (
    id            SERIAL PRIMARY KEY,
    category_id   INTEGER      NOT NULL REFERENCES bookmark_category(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    url           VARCHAR(300) NOT NULL,
    icon          VARCHAR(500) DEFAULT '',
    description   VARCHAR(300) DEFAULT '',
    platforms     TEXT         DEFAULT '[]',
    sort          INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmark_site_category ON bookmark_site(category_id);

-- ============================================
-- 17. SiteConfig（站点配置）
-- ============================================
CREATE TABLE IF NOT EXISTS site_config (
    id            SERIAL PRIMARY KEY,
    key           VARCHAR(100) UNIQUE NOT NULL,
    value         TEXT         DEFAULT '',
    description   VARCHAR(200) DEFAULT '',
    updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ============================================
-- 18. Visitor（访客记录）
-- ============================================
CREATE TABLE IF NOT EXISTS visitor (
    id            SERIAL PRIMARY KEY,
    ip            VARCHAR(45)  NOT NULL,
    path          VARCHAR(500) DEFAULT '',
    user_agent    TEXT         DEFAULT '',
    city          VARCHAR(100) DEFAULT '',
    region        VARCHAR(100) DEFAULT '',
    country       VARCHAR(100) DEFAULT '',
    org           VARCHAR(200) DEFAULT '',
    browser       VARCHAR(50)  DEFAULT '',
    os            VARCHAR(50)  DEFAULT '',
    device_type   VARCHAR(20)  DEFAULT '',
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_ip ON visitor(ip);
CREATE INDEX IF NOT EXISTS idx_visitor_created ON visitor(created_at DESC);

-- ============================================
-- 插入默认管理员账号（密码: admin123）
-- bcrypt hash of "admin123"
-- ============================================
INSERT INTO "user" (username, hashed_password, nickname, is_admin)
VALUES (
    'admin',
    '$2b$12$LJ3m4ys4Pz0C5eK8rZqYaOzLiGh5v1DmdMFRnDvMQfLpUfKlPu5S.',
    '管理员',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 插入默认站点配置
-- ============================================
INSERT INTO site_config (key, value, description) VALUES
    ('site_title',      '"Kirameku"',           '站点标题'),
    ('site_description', '"煌めく — 一个个人博客"', '站点描述'),
    ('icp_number',      '""',                    'ICP备案号'),
    ('icp_link',        '""',                    'ICP备案链接')
ON CONFLICT (key) DO NOTHING;
