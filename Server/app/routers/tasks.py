from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Meeting, Task
from app.schemas import TaskOut, TaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(
    done: bool | None = None,
    meeting_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task).order_by(Task.order_index.asc())
    if done is not None:
        query = query.filter(Task.done == done)
    if meeting_id:
        query = query.filter(Task.meeting_id == meeting_id)
    tasks = query.all()
    return [
        TaskOut(
            id=t.id,
            meeting_id=t.meeting_id,
            description=t.description,
            owner=t.owner,
            deadline=t.deadline,
            done=t.done,
            order_index=t.order_index,
        )
        for t in tasks
    ]


@router.patch("/{task_id}")
def toggle_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    task.done = payload.done
    db.commit()
    return {"id": task.id, "done": task.done}
