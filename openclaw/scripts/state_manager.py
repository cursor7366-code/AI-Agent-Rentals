"""
OpenClaw State Manager

Persists and retrieves pipeline state with atomic writes.
State is the source of truth for scheduling and deduplication.
"""

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, Field


class SourceState(BaseModel):
    """Per-source persistent state"""
    last_checked_at_utc: Optional[str] = None
    next_check_at_utc: Optional[str] = None
    priority_multiplier: int = 1
    no_change_streak: int = 0
    consecutive_failures: int = 0
    last_root_structural_hash: Optional[str] = None
    last_root_raw_hash: Optional[str] = None


class PipelineState(BaseModel):
    """Full pipeline state"""
    version: int = 1
    sources: dict[str, SourceState] = {}


class StateManager:
    """
    Manages pipeline state with atomic writes.
    
    State file is written atomically via temp file + rename
    to prevent corruption on crash.
    """
    
    def __init__(self, state_path: str | Path):
        self.state_path = Path(state_path)
        self._state: Optional[PipelineState] = None
    
    def load(self) -> PipelineState:
        """Load state from disk (or create default)"""
        if self.state_path.exists():
            try:
                data = json.loads(self.state_path.read_text())
                self._state = PipelineState(**data)
            except Exception:
                # Corrupted state - start fresh but log
                self._state = PipelineState()
        else:
            self._state = PipelineState()
        
        return self._state
    
    def save(self) -> None:
        """
        Atomically save state to disk.
        
        Uses temp file + rename to prevent partial writes.
        """
        if self._state is None:
            raise StateError("No state loaded - call load() first")
        
        # Ensure parent directory exists
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write to temp file in same directory (for atomic rename)
        fd, tmp_path = tempfile.mkstemp(
            dir=self.state_path.parent,
            prefix=".state_",
            suffix=".tmp"
        )
        
        try:
            # Write state as formatted JSON
            with os.fdopen(fd, "w") as f:
                json.dump(self._state.model_dump(), f, indent=2)
            
            # Atomic rename
            os.replace(tmp_path, self.state_path)
            
        except Exception:
            # Clean up temp file on error
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            raise
    
    def get_source_state(self, source_id: str) -> SourceState:
        """Get or create state for a source"""
        if self._state is None:
            raise StateError("No state loaded - call load() first")
        
        if source_id not in self._state.sources:
            self._state.sources[source_id] = SourceState()
        
        return self._state.sources[source_id]
    
    def update_source_state(
        self,
        source_id: str,
        *,
        checked: bool = False,
        structural_hash: Optional[str] = None,
        raw_hash: Optional[str] = None,
        changes_found: bool = False,
        failed: bool = False,
        base_interval_minutes: int = 360,
        x_no_change_cycles: int = 3,
        max_priority_multiplier: int = 16
    ) -> None:
        """
        Update source state after a check.
        
        Implements yield-based prioritization from spec:
        - If changes_found == 0 for X cycles: multiply interval
        - If changes_found > 0: reset to base interval
        """
        state = self.get_source_state(source_id)
        now = datetime.now(timezone.utc)
        
        if checked:
            state.last_checked_at_utc = now.isoformat()
            
            if structural_hash:
                state.last_root_structural_hash = structural_hash
            if raw_hash:
                state.last_root_raw_hash = raw_hash
            
            if failed:
                state.consecutive_failures += 1
            else:
                state.consecutive_failures = 0
            
            # Yield-based scheduling
            if changes_found:
                # Reset to high priority
                state.priority_multiplier = 1
                state.no_change_streak = 0
            else:
                # Increment no-change streak
                state.no_change_streak += 1
                
                # After X cycles with no changes, downgrade priority
                if state.no_change_streak >= x_no_change_cycles:
                    state.priority_multiplier = min(
                        state.priority_multiplier * 4,
                        max_priority_multiplier
                    )
                    state.no_change_streak = 0
            
            # Calculate next check time
            interval_minutes = base_interval_minutes * state.priority_multiplier
            next_check = now.timestamp() + (interval_minutes * 60)
            state.next_check_at_utc = datetime.fromtimestamp(
                next_check, timezone.utc
            ).isoformat()
    
    def get_sources_due(self, source_ids: list[str]) -> list[str]:
        """
        Get list of sources that are due for checking.
        
        A source is due if:
        - It has never been checked, OR
        - Current time >= next_check_at_utc
        """
        now = datetime.now(timezone.utc)
        due = []
        
        for source_id in source_ids:
            state = self.get_source_state(source_id)
            
            if state.next_check_at_utc is None:
                # Never checked
                due.append(source_id)
            else:
                next_check = datetime.fromisoformat(state.next_check_at_utc)
                if now >= next_check:
                    due.append(source_id)
        
        return due


class StateError(Exception):
    """State operation error"""
    pass
