import { useEffect, useState, useCallback } from "react";
import * as cmd from "../lib/commands";
import type { Character } from "../lib/commands";

interface CharacterSheetsProps {
  projectId: string;
  onClose: () => void;
}

interface CharacterFields {
  [key: string]: string;
}

export default function CharacterSheets({ projectId, onClose }: CharacterSheetsProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");

  const activeChar = characters.find((c) => c.id === activeId);
  const activeFields: CharacterFields = activeChar ? JSON.parse(activeChar.fields) : {};

  useEffect(() => {
    cmd.listCharacters(projectId).then((chars) => {
      setCharacters(chars);
      if (chars.length > 0) setActiveId(chars[0].id);
    });
  }, [projectId]);

  const handleCreate = async () => {
    const char = await cmd.createCharacter(projectId, "New Character");
    setCharacters((prev) => [...prev, char]);
    setActiveId(char.id);
  };

  const handleDelete = async (id: string) => {
    await cmd.deleteCharacter(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = characters.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const saveChar = useCallback(
    async (id: string, name: string, fields: CharacterFields) => {
      const fieldsStr = JSON.stringify(fields);
      await cmd.updateCharacter(id, name, fieldsStr);
      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name, fields: fieldsStr } : c))
      );
    },
    []
  );

  const handleNameChange = (name: string) => {
    if (!activeChar) return;
    saveChar(activeChar.id, name, activeFields);
  };

  const handleFieldChange = (key: string, value: string) => {
    if (!activeChar) return;
    const updated = { ...activeFields, [key]: value };
    saveChar(activeChar.id, activeChar.name, updated);
  };

  const handleAddField = () => {
    if (!activeChar || !newFieldName.trim()) return;
    const updated = { ...activeFields, [newFieldName.trim()]: "" };
    saveChar(activeChar.id, activeChar.name, updated);
    setNewFieldName("");
  };

  const handleRemoveField = (key: string) => {
    if (!activeChar) return;
    const updated = { ...activeFields };
    delete updated[key];
    saveChar(activeChar.id, activeChar.name, updated);
  };

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink dark:hover:text-sand-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-sm font-medium text-stone-800 dark:text-sand-200">Characters</h2>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-1.5 text-sm rounded-lg bg-sage-600 text-white font-medium hover:bg-sage-700 transition-colors"
        >
          + Add Character
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Character list */}
        <div className="w-56 border-r border-sand-200 dark:border-stone-700 overflow-y-auto p-3 space-y-1">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => setActiveId(char.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                ${activeId === char.id
                  ? "bg-sage-100 dark:bg-sage-900 border border-sage-300 dark:border-sage-700"
                  : "hover:bg-sand-100 dark:hover:bg-stone-800"
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-clay-300 dark:bg-clay-700 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {char.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-stone-700 dark:text-sand-200 truncate">
                  {char.name || "Unnamed"}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }}
                className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-500 text-xs flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {characters.length === 0 && (
            <div className="text-center py-8 text-ink-muted text-sm">
              No characters yet
            </div>
          )}
        </div>

        {/* Character detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeChar ? (
            <div className="max-w-2xl">
              {/* Name */}
              <input
                type="text"
                value={activeChar.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Character name..."
                className="w-full text-2xl font-light text-stone-800 dark:text-sand-100 bg-transparent border-none outline-none mb-6
                           placeholder-ink-muted"
              />

              {/* Fields */}
              <div className="space-y-4">
                {Object.entries(activeFields).map(([key, value]) => (
                  <div key={key} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-ink-muted dark:text-sand-400">
                        {key}
                      </label>
                      <button
                        onClick={() => handleRemoveField(key)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-ink-muted hover:text-red-500 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 text-sm rounded-lg bg-white dark:bg-stone-800 border border-sand-200 dark:border-stone-700
                                 text-stone-700 dark:text-sand-200 resize-none
                                 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-transparent
                                 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Add custom field */}
              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                  placeholder="Add custom field..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-800 border border-sand-200 dark:border-stone-700
                             placeholder-ink-muted
                             focus:outline-none focus:ring-2 focus:ring-sage-300"
                />
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 text-sm rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-700 dark:text-sand-200 hover:bg-sand-300 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-ink-muted">
              <p>Select or create a character to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
