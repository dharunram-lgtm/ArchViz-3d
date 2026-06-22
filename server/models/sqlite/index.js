const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const genId = () => uuidv4();
const now = () => new Date().toISOString();

function rowToUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    avatar: row.avatar,
    authProvider: row.authProvider,
    authProviderId: row.authProviderId,
    role: row.role,
    isVerified: !!row.isVerified,
    refreshToken: row.refreshToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    toJSON() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        avatar: this.avatar,
        authProvider: this.authProvider,
        authProviderId: this.authProviderId,
        role: this.role,
        isVerified: this.isVerified,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
    comparePassword: async function (candidate) {
      if (!this.password) return false;
      return bcrypt.compare(candidate, this.password);
    },
    save: async function () {
      this.updatedAt = now();
      db.prepare(`UPDATE users SET name=?, email=?, password=?, avatar=?, authProvider=?, authProviderId=?, role=?, isVerified=?, refreshToken=?, updatedAt=? WHERE id=?`)
        .run(this.name, this.email, this.password, this.avatar, this.authProvider, this.authProviderId, this.role, this.isVerified ? 1 : 0, this.refreshToken, this.updatedAt, this._id);
    },
  };
}

function rowToProject(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    thumbnail: row.thumbnail,
    tags: JSON.parse(row.tags || '[]'),
    layers: JSON.parse(row.layers || '{}'),
    dimensions: JSON.parse(row.dimensions || '[]'),
    sharing: JSON.parse(row.sharing || '{}'),
    user: row.userId,
    userId: row.userId,
    blueprints: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToBlueprint(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    project: row.projectId,
    projectId: row.projectId,
    name: row.name,
    fileUrl: row.fileUrl,
    fileType: row.fileType,
    layer: row.layer || 'structural',
    originalName: row.originalName,
    fileSize: row.fileSize,
    extractedData: JSON.parse(row.extractedData || '{}'),
    metadata: JSON.parse(row.metadata || '{}'),
    createdAt: row.createdAt,
  };
}

function rowToAnnotation(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    project: row.projectId,
    projectId: row.projectId,
    user: row.userId,
    userId: row.userId,
    position: JSON.parse(row.position || '{}'),
    content: row.content,
    type: row.type,
    color: row.color,
    isResolved: !!row.isResolved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToMaterial(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    project: row.projectId,
    projectId: row.projectId,
    walls: JSON.parse(row.walls || '{}'),
    floors: JSON.parse(row.floors || '{}'),
    ceiling: JSON.parse(row.ceiling || '{}'),
    furniture: JSON.parse(row.furniture || '{}'),
    lighting: JSON.parse(row.lighting || '{}'),
    theme: row.theme,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToActivityLog(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    user: row.userId,
    userId: row.userId,
    action: row.action,
    details: JSON.parse(row.details || '{}'),
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}

// ============= USER OPERATIONS =============

const User = {
  findOne: (query = {}) => {
    const { email, _id, id, authProvider, authProviderId } = query;
    const hasParams = email || _id || id || (authProvider && authProviderId);
    if (!hasParams) return null;
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (email) { sql += ' AND email = ?'; params.push(email.toLowerCase()); }
    if (_id || id) { sql += ' AND id = ?'; params.push(_id || id); }
    if (authProvider && authProviderId) { sql += ' AND authProvider = ? AND authProviderId = ?'; params.push(authProvider, authProviderId); }
    const row = db.prepare(sql).get(...params);
    return rowToUser(row);
  },

  findById: (id) => User.findOne({ _id: id }),

  create: async (data) => {
    const id = data._id || genId();
    const password = data.password;
    let finalPassword = password;
    if (password && !password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(12);
      finalPassword = await bcrypt.hash(password, salt);
    }
    db.prepare(`INSERT INTO users (id, name, email, password, avatar, authProvider, authProviderId, role, isVerified, refreshToken, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.name, (data.email || '').toLowerCase(), finalPassword, data.avatar || '', data.authProvider || 'local', data.authProviderId || '', data.role || 'user', data.isVerified ? 1 : 0, data.refreshToken || null, now(), now());
    return User.findById(id);
  },

  countDocuments: (query = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];
    if (query.search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    return db.prepare(sql).get(...params).count;
  },

  find: (query = {}) => {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (query.search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    const sortField = query.sort || 'createdAt';
    const sortDir = query.sortDir || -1;
    sql += ` ORDER BY ${sortField} ${sortDir === -1 ? 'DESC' : 'ASC'}`;
    if (query.skip) sql += ` LIMIT ${query.limit || 20} OFFSET ${query.skip}`;
    else if (query.limit) sql += ` LIMIT ${query.limit}`;
    const rows = db.prepare(sql).all(...params);
    return rows.map(rowToUser);
  },

  findByIdAndUpdate: (id, data) => {
    const user = User.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    user.save();
    return User.findById(id);
  },

  deleteOne: (query) => {
    const { _id, id } = query;
    db.prepare('DELETE FROM users WHERE id = ?').run(_id || id);
  },

  deleteMany: (query) => {
    const { _id, id } = query;
    if (_id || id) db.prepare('DELETE FROM users WHERE id = ?').run(_id || id);
  },
};

// ============= PROJECT OPERATIONS =============

const Project = {
  findOne: (query = {}) => {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    if (query._id || query.id) { sql += ' AND id = ?'; params.push(query._id || query.id); }
    if (query.user) { sql += ' AND userId = ?'; params.push(query.user); }
    if (query['sharing.shareLink']) { sql += ' AND sharing LIKE ?'; params.push(`%"shareLink":"${query['sharing.shareLink']}"%`); }
    const row = db.prepare(sql).get(...params);
    const p = rowToProject(row);
    if (p) {
      p.blueprints = Blueprint.find({ projectId: p._id });
    }
    return p;
  },

  findById: (id) => Project.findOne({ _id: id }),

  create: (data) => {
    const id = genId();
    const sharing = JSON.stringify(data.sharing || {});
    const layers = JSON.stringify(data.layers || {});
    const dimensions = JSON.stringify(data.dimensions || []);
    const tags = JSON.stringify(data.tags || []);
    db.prepare(`INSERT INTO projects (id, name, description, thumbnail, tags, layers, dimensions, sharing, userId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.name, data.description || '', data.thumbnail || '', tags, layers, dimensions, sharing, data.user || data.userId, now(), now());
    return Project.findById(id);
  },

  countDocuments: (query = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM projects WHERE 1=1';
    const params = [];
    if (query.user) { sql += ' AND userId = ?'; params.push(query.user); }
    if (query.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    return db.prepare(sql).get(...params).count;
  },

  find: (query = {}) => {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    if (query.user) { sql += ' AND userId = ?'; params.push(query.user); }
    if (query.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    if (query._id) { sql += ' AND id = ?'; params.push(query._id); }
    const sortField = query.sort === 'name' ? 'name' : query.sort === 'updated' ? 'updatedAt' : 'createdAt';
    const sortDir = query.sort === 'oldest' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortDir}`;
    if (query.limit) sql += ` LIMIT ${query.limit}`;
    if (query.skip) sql += ` OFFSET ${query.skip}`;
    const rows = db.prepare(sql).all(...params);
    const projectIds = rows.map(r => r.id);
    const allBlueprints = projectIds.length > 0 ? Blueprint.find({ projectIds }) : [];
    const blueprintMap = {};
    for (const bp of allBlueprints) {
      if (!blueprintMap[bp.projectId]) blueprintMap[bp.projectId] = [];
      blueprintMap[bp.projectId].push(bp);
    }
    const userCache = {};
    return rows.map(row => {
      const p = rowToProject(row);
      p.blueprints = blueprintMap[p._id] || [];
      if (query.populateUser) {
        const u = userCache[p.userId] || User.findById(p.userId);
        userCache[p.userId] = u;
        p.user = u ? { _id: u._id, name: u.name, email: u.email } : { name: 'Unknown' };
      }
      return p;
    });
  },

  findOneAndUpdate: (filter, update, opts = {}) => {
    const project = Project.findOne(filter);
    if (!project) return null;
    if (update.$set) {
      Object.assign(project, update.$set);
    } else {
      Object.assign(project, update);
    }
    project.updatedAt = now();
    const sharing = typeof project.sharing === 'string' ? project.sharing : JSON.stringify(project.sharing);
    const layers = typeof project.layers === 'string' ? project.layers : JSON.stringify(project.layers);
    const dimensions = typeof project.dimensions === 'string' ? project.dimensions : JSON.stringify(project.dimensions);
    const tags = typeof project.tags === 'string' ? project.tags : JSON.stringify(project.tags);
    db.prepare(`UPDATE projects SET name=?, description=?, thumbnail=?, tags=?, layers=?, dimensions=?, sharing=?, updatedAt=? WHERE id=?`)
      .run(project.name, project.description, project.thumbnail, tags, layers, dimensions, sharing, project.updatedAt, project._id);
    return opts.new ? Project.findById(project._id) : project;
  },

  findOneAndDelete: (query) => {
    const project = Project.findOne(query);
    if (project) db.prepare('DELETE FROM projects WHERE id = ?').run(project._id);
    return project;
  },

  deleteMany: (query) => {
    if (query.user) db.prepare('DELETE FROM projects WHERE userId = ?').run(query.user);
    if (query._id || query.id) db.prepare('DELETE FROM projects WHERE id = ?').run(query._id || query.id);
  },

  aggregate: (pipeline) => {
    const group = (pipeline || []).find(s => s.$group);
    if (group) {
      const rows = db.prepare('SELECT date(createdAt) as date, COUNT(*) as count FROM projects GROUP BY date(createdAt) ORDER BY date DESC LIMIT 30').all();
      return rows.map(r => ({ _id: r.date, count: r.count }));
    }
    return [];
  },
};

// ============= BLUEPRINT OPERATIONS =============

const Blueprint = {
  findOne: (query = {}) => {
    let sql = 'SELECT * FROM blueprints WHERE 1=1';
    const params = [];
    if (query._id || query.id) { sql += ' AND id = ?'; params.push(query._id || query.id); }
    if (query.project) { sql += ' AND projectId = ?'; params.push(query.project); }
    const row = db.prepare(sql).get(...params);
    return rowToBlueprint(row);
  },

  findById: (id) => Blueprint.findOne({ _id: id }),

  create: (data) => {
    const id = genId();
    const extractedData = JSON.stringify(data.extractedData || {});
    const metadata = JSON.stringify(data.metadata || {});
    db.prepare(`INSERT INTO blueprints (id, projectId, name, fileUrl, fileType, layer, originalName, fileSize, extractedData, metadata, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.project || data.projectId, data.name, data.fileUrl, data.fileType, data.layer || 'structural', data.originalName || '', data.fileSize || 0, extractedData, metadata, now());
    return Blueprint.findById(id);
  },

  countDocuments: (query = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM blueprints WHERE 1=1';
    const params = [];
    if (query.project) { sql += ' AND projectId = ?'; params.push(query.project); }
    return db.prepare(sql).get(...params).count;
  },

  find: (query = {}) => {
    let sql = 'SELECT * FROM blueprints WHERE 1=1';
    const params = [];
    if (query.projectIds) {
      const placeholders = query.projectIds.map(() => '?').join(',');
      sql += ` AND projectId IN (${placeholders})`;
      params.push(...query.projectIds);
    } else {
      if (query.projectId) { sql += ' AND projectId = ?'; params.push(query.projectId); }
      if (query.project) { sql += ' AND projectId = ?'; params.push(query.project); }
    }
    sql += ' ORDER BY createdAt DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(rowToBlueprint);
  },

  deleteMany: (query) => {
    if (query.project) db.prepare('DELETE FROM blueprints WHERE projectId = ?').run(query.project);
    if (query._id || query.id) db.prepare('DELETE FROM blueprints WHERE id = ?').run(query._id || query.id);
  },

  deleteOne: (query) => {
    if (query._id || query.id) db.prepare('DELETE FROM blueprints WHERE id = ?').run(query._id || query.id);
  },
};

// ============= ANNOTATION OPERATIONS =============

const Annotation = {
  findOne: (query = {}) => {
    let sql = 'SELECT * FROM annotations WHERE 1=1';
    const params = [];
    if (query._id || query.id) { sql += ' AND id = ?'; params.push(query._id || query.id); }
    if (query.project) { sql += ' AND projectId = ?'; params.push(query.project); }
    if (query.user) { sql += ' AND userId = ?'; params.push(query.user); }
    const row = db.prepare(sql).get(...params);
    return rowToAnnotation(row);
  },

  findById: (id) => Annotation.findOne({ _id: id }),

  create: (data) => {
    const id = genId();
    const position = JSON.stringify(data.position || {});
    db.prepare(`INSERT INTO annotations (id, projectId, userId, position, content, type, color, isResolved, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.project || data.projectId, data.user || data.userId, position, data.content, data.type || 'note', data.color || '#ff6b35', data.isResolved ? 1 : 0, now(), now());
    const a = Annotation.findById(id);
    if (data.populate) {
      const user = User.findById(a.userId);
      a.user = user ? { _id: user._id, name: user.name, avatar: user.avatar } : null;
    }
    return a;
  },

  find: (query = {}) => {
    let sql = 'SELECT * FROM annotations WHERE 1=1';
    const params = [];
    if (query.project) { sql += ' AND projectId = ?'; params.push(query.project); }
    sql += ' ORDER BY createdAt DESC';
    if (query.limit) sql += ` LIMIT ${query.limit}`;
    const rows = db.prepare(sql).all(...params);
    const userCache = {};
    return rows.map(row => {
      const a = rowToAnnotation(row);
      const u = userCache[a.userId] || User.findById(a.userId);
      userCache[a.userId] = u;
      a.user = u ? { _id: u._id, name: u.name, avatar: u.avatar } : null;
      return a;
    });
  },

  findOneAndUpdate: (filter, update, opts = {}) => {
    const annotation = Annotation.findOne(filter);
    if (!annotation) return null;
    const setData = update.$set || update;
    Object.assign(annotation, setData);
    annotation.updatedAt = now();
    const position = typeof annotation.position === 'string' ? annotation.position : JSON.stringify(annotation.position);
    db.prepare(`UPDATE annotations SET position=?, content=?, type=?, color=?, isResolved=?, updatedAt=? WHERE id=?`)
      .run(position, annotation.content, annotation.type, annotation.color, annotation.isResolved ? 1 : 0, annotation.updatedAt, annotation._id);
    const a = opts.new ? Annotation.findById(annotation._id) : annotation;
    const user = User.findById(a.userId);
    a.user = user ? { _id: user._id, name: user.name, avatar: user.avatar } : null;
    return a;
  },

  findOneAndDelete: (query) => {
    const annotation = Annotation.findOne(query);
    if (annotation) db.prepare('DELETE FROM annotations WHERE id = ?').run(annotation._id);
    return annotation;
  },

  deleteMany: (query) => {
    if (query.project) db.prepare('DELETE FROM annotations WHERE projectId = ?').run(query.project);
    if (query._id || query.id) db.prepare('DELETE FROM annotations WHERE id = ?').run(query._id || query.id);
  },
};

// ============= MATERIAL OPERATIONS =============

const Material = {
  findOne: (query = {}) => {
    let sql = 'SELECT * FROM materials WHERE 1=1';
    const params = [];
    if (query.project) { sql += ' AND projectId = ?'; params.push(query.project); }
    if (query._id || query.id) { sql += ' AND id = ?'; params.push(query._id || query.id); }
    const row = db.prepare(sql).get(...params);
    return rowToMaterial(row);
  },

  findOneAndUpdate: (filter, update, opts = {}) => {
    let material = Material.findOne(filter);
    const setData = update.$set || update;
    if (!material) {
      const id = genId();
      const defaults = { walls: '{"color":"#e8e0d8","texture":""}', floors: '{"color":"#c4b8a8","texture":""}', ceiling: '{"color":"#ffffff","texture":""}', furniture: '{"color":"#8B7355","texture":""}', lighting: '{"timeOfDay":"day","intensity":1,"sunPosition":{"azimuth":45,"altitude":60},"shadows":true}', theme: 'light' };
      const merged = { ...defaults, ...Object.fromEntries(Object.entries(setData).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v])) };
      db.prepare(`INSERT INTO materials (id, projectId, walls, floors, ceiling, furniture, lighting, theme, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(id, filter.project, merged.walls, merged.floors, merged.ceiling, merged.furniture, merged.lighting, merged.theme, now(), now());
      material = Material.findOne({ project: filter.project });
    } else {
      Object.keys(setData).forEach(key => {
        if (key !== 'project' && key !== 'projectId') {
          material[key] = setData[key];
        }
      });
      material.updatedAt = now();
      db.prepare(`UPDATE materials SET walls=?, floors=?, ceiling=?, furniture=?, lighting=?, theme=?, updatedAt=? WHERE id=?`)
        .run(JSON.stringify(material.walls || {}), JSON.stringify(material.floors || {}), JSON.stringify(material.ceiling || {}), JSON.stringify(material.furniture || {}), JSON.stringify(material.lighting || {}), material.theme, material.updatedAt, material._id);
    }
    return opts.new ? Material.findOne({ project: filter.project }) : material;
  },

  create: (data) => {
    const id = genId();
    const walls = data.walls ? JSON.stringify(data.walls) : '{"color":"#e8e0d8","texture":""}';
    const floors = data.floors ? JSON.stringify(data.floors) : '{"color":"#c4b8a8","texture":""}';
    const ceiling = data.ceiling ? JSON.stringify(data.ceiling) : '{"color":"#ffffff","texture":""}';
    const furniture = data.furniture ? JSON.stringify(data.furniture) : '{"color":"#8B7355","texture":""}';
    const lighting = data.lighting ? JSON.stringify(data.lighting) : '{"timeOfDay":"day","intensity":1,"sunPosition":{"azimuth":45,"altitude":60},"shadows":true}';
    const theme = data.theme || 'light';
    db.prepare(`INSERT INTO materials (id, projectId, walls, floors, ceiling, furniture, lighting, theme, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.project || data.projectId, walls, floors, ceiling, furniture, lighting, theme, now(), now());
    return Material.findOne({ project: data.project || data.projectId });
  },

  deleteOne: (query) => {
    if (query.project) db.prepare('DELETE FROM materials WHERE projectId = ?').run(query.project);
    if (query._id || query.id) db.prepare('DELETE FROM materials WHERE id = ?').run(query._id || query.id);
  },
};

// ============= ACTIVITY LOG OPERATIONS =============

const ActivityLog = {
  create: (data) => {
    const id = genId();
    const details = typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {});
    db.prepare(`INSERT INTO activity_logs (id, userId, action, details, ip, userAgent, createdAt) VALUES (?,?,?,?,?,?,?)`)
      .run(id, data.user || data.userId, data.action, details, data.ip || '', data.userAgent || '', now());
    return ActivityLog.findById(id);
  },

  findById: (id) => {
    const row = db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(id);
    return rowToActivityLog(row);
  },

  find: (query = {}) => {
    let sql = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    if (query.action) { sql += ' AND action = ?'; params.push(query.action); }
    sql += ' ORDER BY createdAt DESC';
    if (query.limit) sql += ` LIMIT ${query.limit}`;
    if (query.skip) sql += ` OFFSET ${query.skip}`;
    const rows = db.prepare(sql).all(...params);
    const userCache = {};
    return rows.map(row => {
      const log = rowToActivityLog(row);
      const u = userCache[log.userId] || User.findById(log.userId);
      userCache[log.userId] = u;
      log.user = u ? { _id: u._id, name: u.name, email: u.email } : { name: 'System' };
      return log;
    });
  },

  countDocuments: (query = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM activity_logs WHERE 1=1';
    const params = [];
    if (query.action) { sql += ' AND action = ?'; params.push(query.action); }
    return db.prepare(sql).get(...params).count;
  },
};

module.exports = { User, Project, Blueprint, Annotation, Material, ActivityLog };
