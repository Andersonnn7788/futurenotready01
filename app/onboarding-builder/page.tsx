"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";

type WorkflowBlockType =
  | "collect_info"
  | "e_sign"
  | "provision_access"
  | "schedule_orientation"
  | "custom_task";

type WorkflowBlock = {
  id: string;
  type: WorkflowBlockType;
  title: string;
  description?: string;
};

function createBlock(type: WorkflowBlockType): WorkflowBlock {
  const titleMap: Record<WorkflowBlockType, string> = {
    collect_info: "Collect Employee Info",
    e_sign: "Document E‑Signing",
    provision_access: "Tool Access Provisioning",
    schedule_orientation: "Schedule Orientation",
    custom_task: "Custom Task",
  };
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    title: titleMap[type],
  };
}

export default function OnboardingBuilderPage() {
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [guidelinesText, setGuidelinesText] = useState("");

  // Load any existing guidelines from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("onboarding_guidelines_v1");
      if (stored) setGuidelinesText(stored);
    } catch {}
  }, []);

  const onDragStartPalette = useCallback((ev: DragEvent, type: WorkflowBlockType) => {
    ev.dataTransfer.setData("application/x-block-type", type);
    ev.dataTransfer.effectAllowed = "copy";
  }, []);

  const onDragStartCanvas = useCallback((ev: DragEvent, blockId: string) => {
    ev.dataTransfer.setData("application/x-block-move", blockId);
    ev.dataTransfer.effectAllowed = "move";
  }, []);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const handleCanvasDrop = useCallback((ev: DragEvent) => {
    ev.preventDefault();
    const moveId = ev.dataTransfer.getData("application/x-block-move");
    const type = ev.dataTransfer.getData("application/x-block-type") as WorkflowBlockType;

    const getDropIndex = () => {
      if (!canvasRef.current) return blocks.length;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const y = ev.clientY - canvasRect.top;
      const rowHeight = 72; // approximate card height + gap
      const index = Math.max(0, Math.min(blocks.length, Math.floor(y / rowHeight)));
      return index;
    };

    const insertAt = getDropIndex();

    if (moveId) {
      setBlocks((prev) => {
        const currentIndex = prev.findIndex((b) => b.id === moveId);
        if (currentIndex === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(currentIndex, 1);
        const normalizedInsert = currentIndex < insertAt ? insertAt - 1 : insertAt;
        next.splice(normalizedInsert, 0, moved);
        return next;
      });
      return;
    }

    if (type) {
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(insertAt, 0, createBlock(type));
        return next;
      });
    }
  }, [blocks.length]);

  const handleCanvasDragOver = useCallback((ev: DragEvent) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBlockId((s) => (s === id ? null : s));
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<WorkflowBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId]
  );

  const saveGuidelines = useCallback(() => {
    try {
      localStorage.setItem("onboarding_guidelines_v1", guidelinesText);
    } catch {}
    setIsGuidelinesOpen(false);
  }, [guidelinesText]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Automated Onboarding Workflow Builder</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBlocks([])}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={() => setIsGuidelinesOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Insert Guidelines
          </button>
        </div>
      </div>

      {isGuidelinesOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsGuidelinesOpen(false)} />
          <div className="relative z-10 w-[min(92vw,48rem)] rounded-lg border bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="text-sm font-medium text-gray-900">Insert Onboarding Guidelines</div>
              <button
                onClick={() => setIsGuidelinesOpen(false)}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <label className="text-xs text-gray-700">
                These guidelines will be used by the chatbot as a knowledge base.
                <textarea
                  value={guidelinesText}
                  onChange={(e) => setGuidelinesText(e.target.value)}
                  placeholder="Paste policies, onboarding rules, and helpful context..."
                  className="mt-2 w-full min-h-56 rounded border px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
              <button
                onClick={() => setIsGuidelinesOpen(false)}
                className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveGuidelines}
                className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Guidelines
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <section className="md:col-span-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Palette</h2>
          <div className="space-y-2">
            {([
              { type: "collect_info", desc: "Gather basic profile and tax forms" },
              { type: "e_sign", desc: "Send contracts and NDAs for e‑signature" },
              { type: "provision_access", desc: "Create accounts and assign tool access" },
              { type: "schedule_orientation", desc: "Book intro meetings and training" },
              { type: "custom_task", desc: "Add any bespoke task or checklist" },
            ] as Array<{ type: WorkflowBlockType; desc: string }>).map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStartPalette(e, item.type)}
                className="cursor-grab active:cursor-grabbing select-none rounded-md border bg-white px-3 py-2 shadow-sm hover:shadow transition"
              >
                <div className="text-sm font-medium text-gray-900">
                  {createBlock(item.type).title}
                </div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="md:col-span-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Canvas</h2>
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            className="min-h-72 rounded-lg border-2 border-dashed bg-gray-50 p-3 flex flex-col gap-3"
          >
            {blocks.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-10">
                Drag blocks from the palette to build your onboarding flow.
              </div>
            ) : (
              blocks.map((block, index) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => onDragStartCanvas(e, block.id)}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`rounded-md border bg-white p-3 shadow-sm flex items-start justify-between gap-3 ${
                    selectedBlockId === block.id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{index + 1}. {block.title}</div>
                    {block.description ? (
                      <div className="text-xs text-gray-600 mt-0.5">{block.description}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTitle = prompt("Edit title", block.title) ?? block.title;
                        updateBlock(block.id, { title: newTitle });
                      }}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(block.id);
                      }}
                      className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedBlock ? (
            <div className="mt-4 rounded-md border bg-white p-3 shadow-sm">
              <div className="text-sm font-medium text-gray-900 mb-2">Block Settings</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs text-gray-700">
                  Title
                  <input
                    value={selectedBlock.title}
                    onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-700 md:col-span-2">
                  Description
                  <textarea
                    value={selectedBlock.description ?? ""}
                    onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })}
                    className="mt-1 w-full rounded border px-2 py-1 text-sm min-h-20"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="mt-8 rounded-md border bg-white p-4">
        <div className="text-sm font-medium text-gray-900 mb-2">Example Use Cases</div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Document e‑signing via the "Document E‑Signing" block</li>
          <li>Tool access provisioning with the "Tool Access Provisioning" block</li>
          <li>Schedule orientation meetings and intro sessions</li>
          <li>Attach custom tasks to tailor onboarding per role</li>
        </ul>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        Tip: Use "Insert Guidelines" to store policies; the chatbot will use them as context for answers.
      </div>
    </main>
  );
}


