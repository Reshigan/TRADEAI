import Database from 'better-sqlite3';

export function createD1Adapter(dbPath) {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  
  return {
    prepare(sql) {
      return {
        _sql: sql,
        _params: [],
        _isAll: false,
        bind(...params) {
          this._params = params;
          return this;
        },
        async first(colName) {
          const stmt = sqlite.prepare(this._sql);
          const row = stmt.get(...this._params);
          if (colName) return row?.[colName];
          return row || null;
        },
        async all() {
          this._isAll = true;
          const stmt = sqlite.prepare(this._sql);
          const results = stmt.all(...this._params);
          return { results, success: true };
        },
        async run() {
          const stmt = sqlite.prepare(this._sql);
          const info = stmt.run(...this._params);
          return { success: true, changes: info.changes };
        }
      };
    },
    batch(stmts) {
      const tx = sqlite.transaction(() => stmts.map(s => {
        const stmt = sqlite.prepare(s._sql);
        return s._isAll ? stmt.all(...s._params) : stmt.run(...s._params);
      }));
      return tx();
    }
  };
}
