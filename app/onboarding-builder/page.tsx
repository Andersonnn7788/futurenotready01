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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl mb-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Automated Onboarding Workflow Builder
              </h1>
              <p className="text-gray-600 mt-2">
                Design seamless employee onboarding experiences with drag-and-drop simplicity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBlocks([])}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
              <button
                onClick={() => setIsGuidelinesOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Insert Guidelines
              </button>
            </div>
          </div>
        </div>

        {/* Guidelines Modal */}
        {isGuidelinesOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsGuidelinesOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Insert Onboarding Guidelines</h3>
                  <p className="text-sm text-gray-500 mt-1">Configure knowledge base for AI assistance</p>
                </div>
                <button
                  onClick={() => setIsGuidelinesOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Guidelines Usage</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        These guidelines will be used by the chatbot as context for answering onboarding questions and providing assistance.
                      </p>
                    </div>
                  </div>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guidelines Content
                </label>
                <textarea
                  value={guidelinesText}
                  onChange={(e) => setGuidelinesText(e.target.value)}
                  placeholder="Enter your company policies, onboarding procedures, helpful context, and any other information that should guide the AI assistant..."
                  className="w-full h-64 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setIsGuidelinesOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGuidelines}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Save Guidelines
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Palette Section */}
          <section className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Workflow Blocks</h2>
              </div>
              <div className="space-y-3">
                {([
                  { 
                    type: "collect_info", 
                    desc: "Gather basic profile and tax forms",
                    icon: "👤"
                  },
                  { 
                    type: "e_sign", 
                    desc: "Send contracts and NDAs for e‑signature",
                    icon: "✍️"
                  },
                  { 
                    type: "provision_access", 
                    desc: "Create accounts and assign tool access",
                    icon: "🔑"
                  },
                  { 
                    type: "schedule_orientation", 
                    desc: "Book intro meetings and training",
                    icon: "📅"
                  },
                  { 
                    type: "custom_task", 
                    desc: "Add any bespoke task or checklist",
                    icon: "⚡"
                  },
                ] as Array<{ type: WorkflowBlockType; desc: string; icon: string }>).map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStartPalette(e, item.type)}
                    className="group cursor-grab active:cursor-grabbing select-none rounded-xl border border-gray-200 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 px-4 py-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                          {createBlock(item.type).title}
                        </div>
                        <div className="text-xs text-gray-600 group-hover:text-blue-700 transition-colors mt-1">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Canvas Section */}
          <section className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Workflow Canvas</h2>
              </div>
              
              <div
                ref={canvasRef}
                onDrop={handleCanvasDrop}
                onDragOver={handleCanvasDragOver}
                className="min-h-96 rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 flex flex-col gap-4 transition-colors duration-200 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50"
              >
                {blocks.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Workflow</h3>
                      <p className="text-sm text-gray-600 max-w-sm">
                        Drag workflow blocks from the palette to create your customized onboarding process
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => onDragStartCanvas(e, block.id)}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`group rounded-xl border bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 ${
                          selectedBlockId === block.id 
                            ? "ring-2 ring-blue-500 shadow-lg border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50" 
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                              selectedBlockId === block.id 
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500" 
                                : "bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-indigo-500"
                            } transition-all duration-200`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                                {block.title}
                              </div>
                              {block.description ? (
                                <div className="text-xs text-gray-600 group-hover:text-blue-700 transition-colors mt-1 line-clamp-2">
                                  {block.description}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors mt-1 italic">
                                  Click to add description
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt("Edit title", block.title) ?? block.title;
                                updateBlock(block.id, { title: newTitle });
                              }}
                              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBlock(block.id);
                              }}
                              className="text-xs px-3 py-1.5 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Block Settings Panel */}
            {selectedBlock ? (
              <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Block Configuration</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Block Title
                    </label>
                    <input
                      value={selectedBlock.title}
                      onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter block title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={selectedBlock.description ?? ""}
                      onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      rows={3}
                      placeholder="Add a detailed description of this workflow step..."
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Footer Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Example Use Cases */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Example Use Cases</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Document e‑signing</span> via the "Document E‑Signing" block
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Tool access provisioning</span> with the "Tool Access Provisioning" block
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Schedule orientation</span> meetings and intro sessions
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Attach custom tasks</span> to tailor onboarding per role
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Guidelines */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro Tips</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">💡 Guidelines:</span> Use "Insert Guidelines" to store company policies and procedures. The AI chatbot will reference these when helping with onboarding questions.
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <span className="font-medium">🎯 Best Practice:</span> Arrange blocks in chronological order to create a logical onboarding progression.
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-sm text-purple-800">
                  <span className="font-medium">⚡ Efficiency:</span> Use descriptions to provide context and specific instructions for each workflow step.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


