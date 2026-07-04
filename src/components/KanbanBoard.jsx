import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'

export default function KanbanBoard({ stages, tasks, subtasks, people, taskOps, onCardClick, onAddTask }) {
  const [activeTask, setActiveTask] = useState(null)
  const { moveTask, reorderTasks } = taskOps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const draggedTask = tasks.find(t => t.id === active.id)
    if (!draggedTask) return

    const overTask = tasks.find(t => t.id === over.id)
    const overStage = stages.find(s => s.id === over.id)

    if (overStage) {
      if (draggedTask.stage_id !== overStage.id) {
        const stageOrder = tasks.filter(t => t.stage_id === overStage.id).length
        moveTask(draggedTask.id, overStage.id, stageOrder)
      }
      return
    }

    if (overTask) {
      if (draggedTask.stage_id !== overTask.stage_id) {
        const stageOrder = tasks.filter(t => t.stage_id === overTask.stage_id).length
        moveTask(draggedTask.id, overTask.stage_id, stageOrder)
      } else {
        const colTasks = tasks
          .filter(t => t.stage_id === draggedTask.stage_id)
          .sort((a, b) => a.sort_order - b.sort_order)
        const oldIdx = colTasks.findIndex(t => t.id === active.id)
        const newIdx = colTasks.findIndex(t => t.id === over.id)
        if (oldIdx !== newIdx) {
          const reordered = arrayMove(colTasks, oldIdx, newIdx).map((t, i) => ({ ...t, sort_order: i }))
          reorderTasks(reordered)
        }
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-scroll flex gap-4 pb-4 pt-1">
        {stages.map(stage => {
          const colTasks = tasks
            .filter(t => t.stage_id === stage.id)
            .sort((a, b) => a.sort_order - b.sort_order)
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              tasks={colTasks}
              subtasks={subtasks}
              people={people}
              onCardClick={onCardClick}
              onAddTask={onAddTask}
            />
          )
        })}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 shadow-xl">
            <TaskCard
              task={activeTask}
              subtasks={subtasks}
              people={people}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
