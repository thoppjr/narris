import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnConnect,
  type NodeChange,
  type NodeTypes,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as cmd from "../lib/commands";

interface PlotCanvasProps {
  projectId: string;
  onClose: () => void;
}

// Custom node component for plot point cards
function PlotPointNode({ data, selected }: { data: { label: string; description: string; color: string; onEdit: () => void; onDelete: () => void }; selected: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] max-w-[240px] cursor-pointer
        ${selected ? "ring-2 ring-sage-400" : ""}`}
      style={{ borderColor: data.color, backgroundColor: `${data.color}15` }}
      onDoubleClick={data.onEdit}
    >
      <Handle type="target" position={Position.Top} className="!bg-sage-500 !w-2.5 !h-2.5 !border-2 !border-white" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-stone-800 dark:text-sand-200 truncate">{data.label}</div>
          {data.description && (
            <div className="text-xs text-ink-muted dark:text-sand-400 mt-1 line-clamp-3">{data.description}</div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="text-ink-muted hover:text-red-500 text-xs flex-shrink-0"
        >
          x
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-sage-500 !w-2.5 !h-2.5 !border-2 !border-white" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  plotPoint: PlotPointNode,
};

export default function PlotCanvas({ projectId, onClose }: PlotCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("#7d967d");

  const colors = ["#7d967d", "#9a7058", "#5e7a5e", "#b38c73", "#85826f", "#6b6858", "#4a6249", "#7d5943"];

  // Load data
  useEffect(() => {
    Promise.all([cmd.listPlotPoints(projectId), cmd.listPlotConnections(projectId)]).then(
      ([points, connections]) => {
        setNodes(
          points.map((p) => ({
            id: p.id,
            type: "plotPoint",
            position: { x: p.pos_x, y: p.pos_y },
            data: {
              label: p.title,
              description: p.description,
              color: p.color,
              onEdit: () => startEdit(p.id, p.title, p.description, p.color),
              onDelete: () => handleDeleteNode(p.id),
            },
          }))
        );
        setEdges(
          connections.map((c) => ({
            id: c.id,
            source: c.source_id,
            target: c.target_id,
            animated: true,
            style: { stroke: "#a8baa8" },
          }))
        );
      }
    );
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (id: string, title: string, description: string, color: string) => {
    setEditingNode(id);
    setEditTitle(title);
    setEditDesc(description);
    setEditColor(color);
  };

  const saveEdit = async () => {
    if (!editingNode) return;
    const node = nodes.find((n) => n.id === editingNode);
    if (!node) return;
    await cmd.updatePlotPoint(editingNode, editTitle, editDesc, editColor, node.position.x, node.position.y);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNode
          ? {
              ...n,
              data: { ...n.data, label: editTitle, description: editDesc, color: editColor, onEdit: () => startEdit(n.id, editTitle, editDesc, editColor) },
            }
          : n
      )
    );
    setEditingNode(null);
  };

  const handleAddNode = async () => {
    const point = await cmd.createPlotPoint(projectId, "New Plot Point", Math.random() * 600, Math.random() * 400);
    const newNode: Node = {
      id: point.id,
      type: "plotPoint",
      position: { x: point.pos_x, y: point.pos_y },
      data: {
        label: point.title,
        description: point.description,
        color: point.color,
        onEdit: () => startEdit(point.id, point.title, point.description, point.color),
        onDelete: () => handleDeleteNode(point.id),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleDeleteNode = async (id: string) => {
    await cmd.deletePlotPoint(id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  const onConnect: OnConnect = useCallback(
    async (params) => {
      const conn = await cmd.createPlotConnection(projectId, params.source!, params.target!);
      setEdges((eds) =>
        addEdge({ ...params, id: conn.id, animated: true, style: { stroke: "#a8baa8" } }, eds)
      );
    },
    [projectId, setEdges]
  );

  // Save node positions on drag end
  const onNodesChangeWithSave = useCallback(
    (changes: NodeChange<Node>[]) => {
      onNodesChange(changes);
      // Save position on drag end
      for (const change of changes) {
        if (change.type === "position" && !change.dragging && change.position) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            cmd.updatePlotPoint(
              change.id,
              node.data.label as string,
              node.data.description as string,
              node.data.color as string,
              change.position.x,
              change.position.y
            );
          }
        }
      }
    },
    [onNodesChange, nodes]
  );

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
          <h2 className="text-sm font-medium text-stone-800 dark:text-sand-200">Plot Points</h2>
        </div>
        <button
          onClick={handleAddNode}
          className="px-4 py-1.5 text-sm rounded-lg bg-sage-600 text-white font-medium hover:bg-sage-700 transition-colors"
        >
          + Add Point
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithSave}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-sand-50 dark:bg-stone-900"
        >
          <Controls className="!bg-white dark:!bg-stone-800 !border-sand-200 dark:!border-stone-700 !rounded-lg !shadow-sm" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4c8b8" />
        </ReactFlow>

        {/* Edit panel */}
        {editingNode && (
          <div className="absolute top-4 right-4 bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 shadow-lg p-4 w-72 z-50">
            <h3 className="text-sm font-medium text-stone-700 dark:text-sand-200 mb-3">Edit Plot Point</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-sand-50 dark:bg-stone-700 border border-sand-200 dark:border-stone-600 mb-2
                         focus:outline-none focus:ring-2 focus:ring-sage-300"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg bg-sand-50 dark:bg-stone-700 border border-sand-200 dark:border-stone-600 mb-2 resize-none
                         focus:outline-none focus:ring-2 focus:ring-sage-300"
            />
            <div className="flex gap-1.5 mb-3">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${editColor === c ? "border-stone-800 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-sage-600 text-white hover:bg-sage-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingNode(null)}
                className="px-3 py-1.5 text-sm rounded-lg bg-sand-100 dark:bg-stone-700 text-stone-700 dark:text-sand-200 hover:bg-sand-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
