"use client";

import { useEffect, useState } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuToast } from "@/components/ui/NeuToast";
import { BackButton } from "@/components/ui/BackButton";
import { getClientToken } from "@/lib/auth";
import { listCategories, createCategory, deleteCategory, updateCategory } from "@/lib/api";
import type { Category } from "@/lib/types";

const ICON_OPTIONS = ["📖", "📚", "🔒", "💻", "🌐", "🌍", "📊", "☁️", "🧠", "⚙️", "🛡️", "🐧", "🐍", "📜", "🎯", "⛓️", "🤖", "🔐", "🎨", "📱"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📖");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("📖");
  const [editDescription, setEditDescription] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" as "success" | "error" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await listCategories();
      setCategories(result);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onCreateCategory = async () => {
    const token = getClientToken();
    if (!token || !name.trim()) return;

    setCreating(true);
    try {
      const result = await createCategory({ name: name.trim(), icon, description: description.trim() }, token);
      setCategories((prev) => [...prev, result.category]);
      setName("");
      setIcon("📖");
      setDescription("");
      setShowForm(false);
      setToast({ open: true, message: "Category created!", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Failed to create", variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const onDeleteCategory = async (id: number) => {
    const token = getClientToken();
    if (!token) return;

    setDeletingId(id);
    try {
      await deleteCategory(id, token);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setToast({ open: true, message: "Category deleted", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Failed to delete", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const onStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon || "📖");
    setEditDescription(category.description || "");
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("📖");
    setEditDescription("");
  };

  const onSaveEdit = async (id: number) => {
    const token = getClientToken();
    if (!token || !editName.trim()) return;

    setSavingId(id);
    try {
      const result = await updateCategory(
        id,
        { name: editName.trim(), icon: editIcon.trim(), description: editDescription.trim() },
        token,
      );

      setCategories((prev) => prev.map((cat) => (cat.id === id ? result.category : cat)));
      setToast({ open: true, message: "Category updated", variant: "success" });
      onCancelEdit();
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Failed to update", variant: "error" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">🏷️ Category Management</h1>
          <p className="text-sm text-[var(--text-muted)]">{categories.length} categories</p>
        </div>
        <NeuButton onClick={() => setShowForm((p) => !p)}>
          {showForm ? "Cancel" : "+ New Category"}
        </NeuButton>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-surface rounded-2xl p-5 space-y-4 animate-fade-in">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create Category</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cybersecurity"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all ${
                    icon === ic
                      ? "bg-[var(--accent)] shadow-md scale-110"
                      : "bg-[var(--card-bg)] border border-[var(--glass-border)] hover:border-[var(--accent)]"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <NeuButton onClick={onCreateCategory} loading={creating} disabled={!name.trim()}>
            Create Category
          </NeuButton>
        </div>
      )}

      {/* Category List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <p className="text-lg">🏷️</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">No categories yet. Create your first category.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="premium-card p-5 flex items-start gap-4">
              {editingId === cat.id ? (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                      className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <select
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="📖">📖</option>
                      {ICON_OPTIONS.map((ic) => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-[var(--accent)]">{cat.ebookCount} ebook{cat.ebookCount !== 1 ? "s" : ""}</p>
                    <div className="flex gap-2">
                      <NeuButton variant="ghost" className="text-xs" onClick={onCancelEdit}>
                        Cancel
                      </NeuButton>
                      <NeuButton className="text-xs" onClick={() => onSaveEdit(cat.id)} loading={savingId === cat.id}>
                        Save
                      </NeuButton>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)]">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{cat.description}</p>
                    )}
                    <p className="text-xs text-[var(--accent)] mt-1">{cat.ebookCount} ebook{cat.ebookCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <NeuButton variant="ghost" className="text-xs" onClick={() => onStartEdit(cat)}>
                      Edit
                    </NeuButton>
                    <NeuButton
                      variant="ghost"
                      className="text-xs text-[var(--danger)]"
                      onClick={() => onDeleteCategory(cat.id)}
                      loading={deletingId === cat.id}
                    >
                      Delete
                    </NeuButton>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <NeuToast message={toast.message} open={toast.open} variant={toast.variant} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </div>
  );
}
