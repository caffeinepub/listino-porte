const STORAGE_KEY = "listino_porte_ids";

interface IdStore {
  doorTypeIds: Record<string, string>;
  extraOptionIds: Record<string, string>;
}

function getStore(): IdStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { doorTypeIds: {}, extraOptionIds: {} };
    return JSON.parse(raw);
  } catch {
    return { doorTypeIds: {}, extraOptionIds: {} };
  }
}

function saveStore(store: IdStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveDoorTypeId(name: string, id: bigint) {
  const store = getStore();
  store.doorTypeIds = store.doorTypeIds || {};
  store.doorTypeIds[name] = id.toString();
  saveStore(store);
}

export function getDoorTypeId(name: string): bigint | null {
  const store = getStore();
  const idStr = store.doorTypeIds?.[name];
  if (idStr === undefined) return null;
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

export function getAllDoorTypeIds(): Record<string, bigint> {
  const store = getStore();
  const result: Record<string, bigint> = {};
  for (const [name, idStr] of Object.entries(store.doorTypeIds || {})) {
    try {
      result[name] = BigInt(idStr);
    } catch {
      /* ignore */
    }
  }
  return result;
}

export function saveExtraOptionId(name: string, id: bigint) {
  const store = getStore();
  store.extraOptionIds = store.extraOptionIds || {};
  store.extraOptionIds[name] = id.toString();
  saveStore(store);
}

export function getExtraOptionId(name: string): bigint | null {
  const store = getStore();
  const idStr = store.extraOptionIds?.[name];
  if (idStr === undefined) return null;
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

export function removeDoorTypeId(name: string) {
  const store = getStore();
  delete store.doorTypeIds[name];
  saveStore(store);
}

export function removeExtraOptionId(name: string) {
  const store = getStore();
  delete store.extraOptionIds[name];
  saveStore(store);
}

export function renameDoorTypeId(oldName: string, newName: string) {
  const store = getStore();
  if (store.doorTypeIds[oldName] !== undefined) {
    store.doorTypeIds[newName] = store.doorTypeIds[oldName];
    delete store.doorTypeIds[oldName];
    saveStore(store);
  }
}

export function renameExtraOptionId(oldName: string, newName: string) {
  const store = getStore();
  if (store.extraOptionIds[oldName] !== undefined) {
    store.extraOptionIds[newName] = store.extraOptionIds[oldName];
    delete store.extraOptionIds[oldName];
    saveStore(store);
  }
}

export function clearStore() {
  localStorage.removeItem(STORAGE_KEY);
}
