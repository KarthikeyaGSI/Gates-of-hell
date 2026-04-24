import Dexie from 'dexie';

export const db = new Dexie('GatesOfHellDB');

db.version(2).stores({
  prospects: '++id, name, status, createdAt',
  sessions: '++id, prospectId, timestamp, duration, status, failedGate',
  notes: '++id, sessionId, gate, content, timestamp',
  recordings: '++id, sessionId, blob, timestamp',
  objectionTrials: '++id, objection, result, feedback, timestamp'
});

export const saveProspect = async (name) => {
  return await db.prospects.add({
    name,
    status: 'active',
    createdAt: new Date()
  });
};

export const getProspects = async () => {
  return await db.prospects.toArray();
};

export const saveNote = async (sessionId, gate, content) => {
  return await db.notes.add({
    sessionId,
    gate,
    content,
    timestamp: new Date()
  });
};

export const saveSession = async (prospectId) => {
  return await db.sessions.add({
    prospectId,
    timestamp: new Date(),
    duration: 0,
    status: 'ongoing'
  });
};
