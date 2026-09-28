-- 九四班官网 SQLite 建表脚本
-- app.py 启动时若 data.db 不存在则自动执行本文件（CREATE TABLE IF NOT EXISTS）

CREATE TABLE IF NOT EXISTS event (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  coverImage TEXT,
  category TEXT DEFAULT '班级活动',
  priority TEXT DEFAULT 'normal',
  pinned INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  publishedAt TEXT DEFAULT (datetime('now')),
  viewCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  contact TEXT,
  ipHash TEXT,
  likes INTEGER DEFAULT 0,
  parentId TEXT,
  replyRole TEXT DEFAULT 'user',
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS confession (
  id TEXT PRIMARY KEY,
  nickname TEXT DEFAULT '匿名同学',
  content TEXT NOT NULL,
  type TEXT DEFAULT 'confession',
  color TEXT DEFAULT 'rose',
  likes INTEGER DEFAULT 0,
  ipHash TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visit (
  id TEXT PRIMARY KEY,
  path TEXT,
  ipHash TEXT,
  ua TEXT,
  referrer TEXT,
  visitedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  accessToken TEXT DEFAULT '1234',
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS about_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  className TEXT DEFAULT '九四班',
  slogan TEXT DEFAULT '志存高远 · 脚踏实地 · 团结奋进',
  intro TEXT,
  headTeacher TEXT,
  headTeacherQuote TEXT,
  classCommittee TEXT,
  contact TEXT,
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_session (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT NOT NULL
);

INSERT OR IGNORE INTO site_config (id, accessToken) VALUES ('default', '1234');
INSERT OR IGNORE INTO about_config (id, className, slogan, intro, headTeacher, headTeacherQuote, classCommittee, contact)
VALUES (
  'default',
  '九四班',
  '志存高远 · 脚踏实地 · 团结奋进',
  '九四班是一个由 48 名同学组成的温暖集体。我们热爱学习、热爱生活，在班主任的带领下共同成长。这里是我们的精神家园，记录着我们青春里的每一个重要时刻。',
  'CarreyHui 老师',
  '愿你们眼里有光、心中有梦、脚下有路，做最好的自己。',
  '班长:李明,副班长:王芳,学习委员:张华,文体委员:刘洋,生活委员:陈静,纪律委员:赵强',
  '班主任邮箱:carreyhui@94class.edu,班级公众号:九四班那些事,紧急联系:班级群'
);

-- 索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_event_category ON event(category);
CREATE INDEX IF NOT EXISTS idx_event_pinned ON event(pinned);
CREATE INDEX IF NOT EXISTS idx_event_publishedAt ON event(publishedAt);
CREATE INDEX IF NOT EXISTS idx_message_parentId ON message(parentId);
CREATE INDEX IF NOT EXISTS idx_confession_type ON confession(type);
CREATE INDEX IF NOT EXISTS idx_visit_visitedAt ON visit(visitedAt);
