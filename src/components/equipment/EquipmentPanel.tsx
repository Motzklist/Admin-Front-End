"use client";

import React, { useState, useEffect } from "react";
import { EquipmentItem, ClassEquipmentList, Grade } from "@/types/api";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

interface EquipmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: Grade | null;
  equipmentList: ClassEquipmentList | null;
  onAddItem: (item: Omit<EquipmentItem, "id">) => Promise<void>;
  onUpdateItem: (
    itemId: string,
    updates: Partial<Omit<EquipmentItem, "id">>
  ) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  isLoading?: boolean;
}

interface EditingItem {
  id: string;
  name: string;
  count: number;
  category: string;
  description: string;
}

export default function EquipmentPanel({
  isOpen,
  onClose,
  classInfo,
  equipmentList,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isLoading = false,
}: EquipmentPanelProps) {
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    count: 1,
    category: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Close editing state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
      setIsAddingNew(false);
      setNewItem({ name: "", count: 1, category: "", description: "" });
    }
  }, [isOpen]);

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;

    setIsSaving(true);
    try {
      await onAddItem({
        name: newItem.name.trim(),
        count: newItem.count,
        category: newItem.category.trim() || undefined,
        description: newItem.description.trim() || undefined,
      });
      setNewItem({ name: "", count: 1, category: "", description: "" });
      setIsAddingNew(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;

    setIsSaving(true);
    try {
      await onUpdateItem(editingItem.id, {
        name: editingItem.name.trim(),
        count: editingItem.count,
        category: editingItem.category.trim() || undefined,
        description: editingItem.description.trim() || undefined,
      });
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setIsSaving(true);
    try {
      await onDeleteItem(itemId);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (item: EquipmentItem) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      count: item.count,
      category: item.category || "",
      description: item.description || "",
    });
    setIsAddingNew(false);
  };

  const cancelEditing = () => {
    setEditingItem(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Equipment List
            </h2>
            {classInfo && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {classInfo.name}
                {classInfo.studentCount && ` • ${classInfo.studentCount} students`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-500">Loading equipment...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Equipment Items */}
              {equipmentList?.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800"
                >
                  {editingItem?.id === item.id ? (
                    /* Editing Form */
                    <div className="space-y-4">
                      <div>
                        <Label>Item Name</Label>
                        <Input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter item name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Count</Label>
                          <Input
                            type="number"
                            value={editingItem.count}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                count: parseInt(e.target.value) || 0,
                              })
                            }
                            min="0"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Input
                            type="text"
                            value={editingItem.category}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                category: e.target.value,
                              })
                            }
                            placeholder="e.g., Writing"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description (optional)</Label>
                        <Input
                          type="text"
                          value={editingItem.description}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              description: e.target.value,
                            })
                          }
                          placeholder="Additional details"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleUpdateItem}
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Item */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800 dark:text-white/90">
                            {item.name}
                          </h4>
                          {item.category && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full dark:bg-gray-800 dark:text-gray-400">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-2xl font-semibold text-brand-500">
                          {item.count}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-2 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-gray-400 hover:text-error-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Delete"
                          disabled={isSaving}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {(!equipmentList || equipmentList.items.length === 0) &&
                !isAddingNew && (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <h3 className="mt-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      No equipment items
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Add items to this class&apos;s equipment list.
                    </p>
                  </div>
                )}

              {/* Add New Item Form */}
              {isAddingNew && (
                <div className="p-4 rounded-xl border-2 border-dashed border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-500/5">
                  <h4 className="font-medium text-gray-800 dark:text-white/90 mb-4">
                    Add New Item
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Item Name *</Label>
                      <Input
                        type="text"
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Count *</Label>
                        <Input
                          type="number"
                          value={newItem.count}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              count: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          type="text"
                          value={newItem.category}
                          onChange={(e) =>
                            setNewItem({ ...newItem, category: e.target.value })
                          }
                          placeholder="e.g., Writing"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Input
                        type="text"
                        value={newItem.description}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            description: e.target.value,
                          })
                        }
                        placeholder="Additional details"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddItem}
                        disabled={isSaving || !newItem.name.trim()}
                      >
                        {isSaving ? "Adding..." : "Add Item"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingNew(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          {!isAddingNew && (
            <Button
              className="w-full"
              onClick={() => {
                setIsAddingNew(true);
                setEditingItem(null);
              }}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Equipment Item
            </Button>
          )}
          {equipmentList?.lastUpdated && (
            <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
              Last updated:{" "}
              {new Date(equipmentList.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

