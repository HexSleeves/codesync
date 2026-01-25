# Plan 001: WebSocket Real-time Collaboration

**Status:** 🟡 Planned  
**Priority:** High  
**Estimated Effort:** 4-6 hours  
**Created:** Jan 25, 2026  

---

## Executive Summary

Implement real-time collaboration for CodeSync sessions including cursor positions, chat messages, and user presence. This is the core differentiating feature that enables live code review collaboration.

## Success Criteria

- [ ] Multiple users can join a session and see each other online
- [ ] Cursor positions are visible to all participants in real-time
- [ ] Chat messages are delivered instantly to all participants
- [ ] Connections automatically reconnect on disconnect
- [ ] WebSocket connections are authenticated via JWT

---

## Detailed Execution Steps

### Step 1: Create Shared WebSocket Types (15 min)

```bash
# Create the file
touch packages/shared/src/ws-types.ts

# Export from index
echo 'export * from "./ws-types";' >> packages/shared/src/index.ts
```

**Actions:**
1. Define all message types (cursor, presence, chat, error)
2. Define server→client message union type
3. Define client→server message union type
4. Export from shared/index.ts

**Verification:**
```bash
cd packages/shared && bun tsc --noEmit
```

---

### Step 2: Refactor Backend WebSocket Handlers (45 min)

```bash
# Create new unified handler
touch packages/api/src/ws/index.ts

# We'll delete the old cursors.ts after migration
```

**Actions:**
1. Create session state management (connections Map, cursors Map)
2. Implement `getUserColor()` for consistent user colors
3. Implement `broadcast()` and `broadcastAll()` helpers
4. Implement `open` handler:
   - Add user to session connections
   - Send current online users to new user
   - Send existing cursors to new user
   - Broadcast join to others
5. Implement `message` handler:
   - Parse and validate message type
   - Handle cursor updates (store + broadcast)
   - Handle chat messages (persist to DB + broadcast)
6. Implement `close` handler:
   - Remove user from session
   - Clean up cursor data
   - Broadcast leave to others

**Verification:**
```bash
cd packages/api && bun tsc --noEmit
```

---

### Step 3: Add WebSocket Auth in Server Entry (30 min)

**Actions:**
1. Modify `packages/api/src/index.ts`
2. Add custom fetch handler that intercepts `/ws/sessions/:id`
3. Extract token from query string `?token=xxx`
4. Verify JWT and fetch user from database
5. Call `server.upgrade()` with user data attached
6. Fall through to Hono app for non-WS requests

**Verification:**
```bash
# Start server
cd packages/api && bun --hot src/index.ts

# Test with wscat (install: npm i -g wscat)
wscat -c "ws://localhost:8001/ws/sessions/test123?token=VALID_JWT"
```

---

### Step 4: Create Client WebSocket Hook (45 min)

```bash
touch packages/client/src/hooks/useWebSocket.ts
```

**Actions:**
1. Create `useWebSocket(sessionId)` hook
2. Manage WebSocket connection lifecycle
3. Handle reconnection with exponential backoff
4. Parse incoming messages and update state
5. Provide `sendCursor()` and `sendChat()` methods
6. Clean up on unmount

**State shape:**
```typescript
{
  connected: boolean,
  onlineUsers: OnlineUser[],
  cursors: Map<string, CursorMessage>,
  chatMessages: ChatMessage[],
}
```

**Verification:**
```bash
# Add to Session.tsx temporarily
const ws = useWebSocket(sessionId);
console.log('WS state:', ws);

# Check browser console for connection logs
```

---

### Step 5: Create UI Components (45 min)

```bash
mkdir -p packages/client/src/components/session
touch packages/client/src/components/session/OnlineUsers.tsx
touch packages/client/src/components/session/ChatPanel.tsx
touch packages/client/src/components/session/CursorOverlay.tsx
```

**OnlineUsers.tsx:**
- Avatar stack with user colors
- Tooltip with full name on hover
- "Online:" label

**ChatPanel.tsx:**
- Scrollable message list
- Input field with send button
- Auto-scroll to bottom on new message
- Show user color next to name

**CursorOverlay.tsx:**
- Absolute positioned overlay
- Filter cursors by current fileId
- Show cursor line with user color
- Show small name tag

---

### Step 6: Integrate into Session Page (30 min)

**Actions:**
1. Import `useWebSocket` hook
2. Import UI components
3. Add `OnlineUsers` to sidebar header
4. Add `ChatPanel` to sidebar (collapsible)
5. Add `CursorOverlay` to diff viewer
6. Wire up cursor tracking on line hover/click

---

### Step 7: Testing & Polish (30 min)

**Manual Testing Checklist:**
- [ ] Open session in Tab A, verify "connected" state
- [ ] Open same session in Tab B (different user), verify both see each other
- [ ] Move cursor in Tab A, verify Tab B sees cursor
- [ ] Send chat in Tab A, verify Tab B receives instantly
- [ ] Close Tab A, verify Tab B sees user leave
- [ ] Disconnect network, verify reconnection works

**Edge Cases:**
- [ ] Invalid token → connection rejected
- [ ] Session doesn't exist → graceful handling
- [ ] Rapid cursor movements → no lag/flooding

---

# WebSocket Real-time Implementation Plan

## Overview

Implement real-time collaboration features for CodeSync:
1. **Cursor Positions** - See where other users are looking
2. **Chat Messages** - Real-time chat updates
3. **User Presence** - Who's online in the session

## Current State

### What Exists

**Backend (`packages/api/src/ws/cursors.ts`)**
- Basic WebSocket handlers registered with Bun.serve()
- Connection tracking by session (`sessionConnections` Map)
- Stub for cursor message broadcast
- No authentication on WebSocket connections
- No presence tracking
- No chat integration

**Shared Types (`packages/shared/src/types.ts`)**
```typescript
interface CursorPosition {
  userId: string;
  sessionId: string;
  fileId: string | null;
  line: number;
  column: number;
  userName: string;
  color: string;
}
```

**Shared Schemas (`packages/shared/src/schemas.ts`)**
```typescript
cursorUpdateSchema = { type: 'cursor', fileId, line, column }
presenceSchema = { type: 'join' | 'leave', userId, userName }
```

### What's Missing

1. WebSocket authentication (verify JWT)
2. Proper upgrade handling with user data
3. Presence events (join/leave)
4. Chat message broadcasting
5. Client-side WebSocket hook
6. UI for cursors, presence, chat

---

## Implementation Plan

### Phase 1: Backend WebSocket Infrastructure

#### 1.1 Create unified WebSocket message types

**File: `packages/shared/src/ws-types.ts`**

```typescript
// All WebSocket message types
export type WSMessageType = 'cursor' | 'presence' | 'chat' | 'error';

export interface WSMessage {
  type: WSMessageType;
}

export interface CursorMessage extends WSMessage {
  type: 'cursor';
  userId: string;
  userName: string;
  color: string;
  fileId: string | null;
  line: number;
  column: number;
}

export interface PresenceMessage extends WSMessage {
  type: 'presence';
  action: 'join' | 'leave';
  userId: string;
  userName: string;
  color: string;
  onlineUsers: OnlineUser[];  // Full list on join
}

export interface OnlineUser {
  userId: string;
  userName: string;
  color: string;
}

export interface ChatMessage extends WSMessage {
  type: 'chat';
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface ErrorMessage extends WSMessage {
  type: 'error';
  code: string;
  message: string;
}

export type ServerMessage = CursorMessage | PresenceMessage | ChatMessage | ErrorMessage;

// Client -> Server messages
export interface ClientCursorUpdate {
  type: 'cursor';
  fileId: string | null;
  line: number;
  column: number;
}

export interface ClientChatSend {
  type: 'chat';
  text: string;
}

export type ClientMessage = ClientCursorUpdate | ClientChatSend;
```

#### 1.2 Refactor WebSocket handlers

**File: `packages/api/src/ws/index.ts`** (new main WS module)

```typescript
import type { ServerWebSocket } from 'bun';
import { verify } from 'hono/jwt';
import { config } from '../config';
import { db } from '../db/client';
import { chatMessages, users } from '../db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// Connection data
interface WSData {
  sessionId: string;
  userId: string;
  userName: string;
  color: string;
}

// Session state
interface SessionState {
  connections: Map<string, ServerWebSocket<WSData>>; // keyed by odedUser
  cursors: Map<string, CursorMessage>; // keyed by odedUser
}

const sessions = new Map<string, SessionState>();

// Generate consistent color from userId
function getUserColor(userId: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  let hash = 0;
  for (let i = 0; i < odedUser.length; i++) {
    hash = odedUser.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get or create session state
function getSession(sessionId: string): SessionState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      connections: new Map(),
      cursors: new Map(),
    });
  }
  return sessions.get(sessionId)!;
}

// Broadcast to all in session except sender
function broadcast(sessionId: string, message: object, excludeUserId?: string) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  const json = JSON.stringify(message);
  for (const [odedUser, ws] of session.connections) {
    if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

// Broadcast to all in session including sender
function broadcastAll(sessionId: string, message: object) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  const json = JSON.stringify(message);
  for (const ws of session.connections.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

export const wsHandlers = {
  async open(ws: ServerWebSocket<WSData>) {
    const { sessionId, userId, userName, color } = ws.data;
    const session = getSession(sessionId);
    
    // Add connection
    session.connections.set(userId, ws);
    
    // Get online users list
    const onlineUsers = Array.from(session.connections.values()).map(conn => ({
      userId: conn.data.userId,
      userName: conn.data.userName,
      color: conn.data.color,
    }));
    
    // Send current state to new user
    ws.send(JSON.stringify({
      type: 'presence',
      action: 'join',
      userId,
      userName,
      color,
      onlineUsers,
    }));
    
    // Send existing cursors to new user
    for (const cursor of session.cursors.values()) {
      ws.send(JSON.stringify(cursor));
    }
    
    // Notify others
    broadcast(sessionId, {
      type: 'presence',
      action: 'join',
      userId,
      userName,
      color,
      onlineUsers,
    }, userId);
    
    console.log(`[WS] User ${userName} joined session ${sessionId}`);
  },

  async message(ws: ServerWebSocket<WSData>, message: string | Buffer) {
    const { sessionId, userId, userName, color } = ws.data;
    
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'cursor': {
          const cursorMsg = {
            type: 'cursor',
            userId,
            userName,
            color,
            fileId: data.fileId,
            line: data.line,
            column: data.column,
          };
          
          // Store cursor position
          const session = getSession(sessionId);
          session.cursors.set(userId, cursorMsg);
          
          // Broadcast to others
          broadcast(sessionId, cursorMsg, userId);
          break;
        }
        
        case 'chat': {
          // Save to database
          const [msg] = await db.insert(chatMessages).values({
            id: nanoid(),
            sessionId,
            authorId: userId,
            text: data.text,
          }).returning();
          
          // Broadcast to all (including sender for confirmation)
          broadcastAll(sessionId, {
            type: 'chat',
            id: msg.id,
            userId,
            userName,
            text: data.text,
            createdAt: msg.createdAt.toISOString(),
          });
          break;
        }
      }
    } catch (err) {
      console.error('[WS] Message error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        code: 'invalid_message',
        message: 'Invalid message format',
      }));
    }
  },

  close(ws: ServerWebSocket<WSData>) {
    const { sessionId, userId, userName, color } = ws.data;
    const session = sessions.get(sessionId);
    
    if (session) {
      session.connections.delete(userId);
      session.cursors.delete(userId);
      
      if (session.connections.size === 0) {
        sessions.delete(sessionId);
      } else {
        // Notify others
        const onlineUsers = Array.from(session.connections.values()).map(conn => ({
          userId: conn.data.userId,
          userName: conn.data.userName,
          color: conn.data.color,
        }));
        
        broadcast(sessionId, {
          type: 'presence',
          action: 'leave',
          userId,
          userName,
          color,
          onlineUsers,
        });
      }
    }
    
    console.log(`[WS] User ${userName} left session ${sessionId}`);
  },
};
```

#### 1.3 Add WebSocket upgrade with auth

**Update: `packages/api/src/index.ts`**

```typescript
import { verify } from 'hono/jwt';
import { config } from './config';
import { db } from './db/client';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { wsHandlers } from './ws';

const server = Bun.serve<WSData>({
  port: config.port,
  
  async fetch(req, server) {
    const url = new URL(req.url);
    
    // WebSocket upgrade for /ws/sessions/:sessionId
    if (url.pathname.startsWith('/ws/sessions/')) {
      const sessionId = url.pathname.split('/')[3];
      const token = url.searchParams.get('token');
      
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      try {
        // Verify JWT
        const payload = await verify(token, config.jwtSecret, 'HS256');
        if (!payload?.sub) {
          return new Response('Invalid token', { status: 401 });
        }
        
        // Get user
        const user = await db.query.users.findFirst({
          where: eq(users.id, payload.sub),
        });
        
        if (!user) {
          return new Response('User not found', { status: 401 });
        }
        
        // Upgrade with user data
        const success = server.upgrade(req, {
          data: {
            sessionId,
            userId: user.id,
            userName: user.name || user.email.split('@')[0],
            color: getUserColor(user.id),
          },
        });
        
        if (success) return undefined; // Bun handles the response
        return new Response('WebSocket upgrade failed', { status: 500 });
      } catch (err) {
        console.error('WS auth error:', err);
        return new Response('Auth failed', { status: 401 });
      }
    }
    
    // Regular HTTP requests
    return app.fetch(req);
  },
  
  websocket: wsHandlers,
});
```

---

### Phase 2: Client WebSocket Hook

#### 2.1 Create useWebSocket hook

**File: `packages/client/src/hooks/useWebSocket.ts`**

```typescript
import { useCallback, useEffect, useRef, useState } from 'hono/jsx';
import { authStore } from '../stores/auth';
import type { ServerMessage, ClientMessage, OnlineUser, CursorMessage, ChatMessage } from '@codesync/shared';

interface WebSocketState {
  connected: boolean;
  onlineUsers: OnlineUser[];
  cursors: Map<string, CursorMessage>;
  chatMessages: ChatMessage[];
}

export function useWebSocket(sessionId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    onlineUsers: [],
    cursors: new Map(),
    chatMessages: [],
  });
  
  const connect = useCallback(() => {
    if (!sessionId) return;
    
    const token = authStore.token;
    if (!token) {
      console.warn('No auth token for WebSocket');
      return;
    }
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8001';
    const url = `${protocol}//${host}/ws/sessions/${sessionId}?token=${token}`;
    
    const ws = new WebSocket(url);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('[WS] Connected');
      setState(s => ({ ...s, connected: true }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'presence':
            setState(s => ({
              ...s,
              onlineUsers: message.onlineUsers,
            }));
            break;
            
          case 'cursor':
            setState(s => {
              const cursors = new Map(s.cursors);
              cursors.set(message.userId, message);
              return { ...s, cursors };
            });
            break;
            
          case 'chat':
            setState(s => ({
              ...s,
              chatMessages: [...s.chatMessages, message],
            }));
            break;
            
          case 'error':
            console.error('[WS] Error:', message.message);
            break;
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setState(s => ({ ...s, connected: false }));
      
      // Reconnect after 3 seconds
      reconnectTimeout.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };
    
    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }, [sessionId]);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
  
  // Send cursor update
  const sendCursor = useCallback((fileId: string | null, line: number, column: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor',
        fileId,
        line,
        column,
      }));
    }
  }, []);
  
  // Send chat message
  const sendChat = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        text,
      }));
    }
  }, []);
  
  return {
    connected: state.connected,
    onlineUsers: state.onlineUsers,
    cursors: state.cursors,
    chatMessages: state.chatMessages,
    sendCursor,
    sendChat,
  };
}
```

---

### Phase 3: UI Components

#### 3.1 Online Users component

**File: `packages/client/src/components/session/OnlineUsers.tsx`**

```typescript
import { Avatar, AvatarFallback } from '@/components/ui';
import type { OnlineUser } from '@codesync/shared';

interface Props {
  users: OnlineUser[];
}

export function OnlineUsers({ users }: Props) {
  if (users.length === 0) return null;
  
  return (
    <div class="flex items-center gap-2 px-4 py-2 border-b border-border">
      <span class="text-xs text-muted-foreground">Online:</span>
      <div class="flex -space-x-2">
        {users.map(user => (
          <Avatar key={user.userId} class="h-6 w-6 border-2 border-background">
            <AvatarFallback 
              style={{ backgroundColor: user.color }}
              class="text-[10px] text-white"
            >
              {user.userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 Chat Panel component

**File: `packages/client/src/components/session/ChatPanel.tsx`**

```typescript
import { useState } from 'hono/jsx';
import { Button, Input } from '@/components/ui';
import type { ChatMessage } from '@codesync/shared';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, onSend }: Props) {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  return (
    <div class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} class="text-sm">
            <span class="font-medium" style={{ color: msg.color || '#888' }}>
              {msg.userName}:
            </span>{' '}
            <span class="text-foreground">{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} class="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          placeholder="Type a message..."
          class="flex-1"
        />
        <Button type="submit" size="sm">Send</Button>
      </form>
    </div>
  );
}
```

#### 3.3 Cursor overlay component

**File: `packages/client/src/components/session/CursorOverlay.tsx`**

```typescript
import type { CursorMessage } from '@codesync/shared';

interface Props {
  cursors: Map<string, CursorMessage>;
  currentFileId: string | null;
  lineHeight: number;  // pixels
}

export function CursorOverlay({ cursors, currentFileId, lineHeight }: Props) {
  const fileCursors = Array.from(cursors.values())
    .filter(c => c.fileId === currentFileId);
  
  if (fileCursors.length === 0) return null;
  
  return (
    <div class="absolute inset-0 pointer-events-none">
      {fileCursors.map(cursor => (
        <div
          key={cursor.userId}
          class="absolute flex items-center gap-1"
          style={{
            top: `${(cursor.line - 1) * lineHeight}px`,
            left: '0',
          }}
        >
          <div
            class="w-0.5 h-5"
            style={{ backgroundColor: cursor.color }}
          />
          <span
            class="text-[10px] px-1 rounded text-white"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

### Phase 4: Integration

#### 4.1 Update Session page

Add WebSocket hook and components to Session.tsx:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import { OnlineUsers } from '@/components/session/OnlineUsers';
import { ChatPanel } from '@/components/session/ChatPanel';

function SessionPage({ sessionId }) {
  const { session, files } = useSession(sessionId);
  const {
    connected,
    onlineUsers,
    cursors,
    chatMessages,
    sendCursor,
    sendChat,
  } = useWebSocket(sessionId);
  
  // ... existing code ...
  
  return (
    <div class="flex h-screen">
      {/* Sidebar */}
      <aside class="w-64 border-r border-border flex flex-col">
        <OnlineUsers users={onlineUsers} />
        <FileTree files={files} />
        <div class="flex-1 border-t border-border">
          <ChatPanel messages={chatMessages} onSend={sendChat} />
        </div>
      </aside>
      
      {/* Main content */}
      <main class="flex-1">
        <DiffViewer
          file={selectedFile}
          cursors={cursors}
          onCursorMove={sendCursor}
        />
      </main>
    </div>
  );
}
```

---

## File Structure After Implementation

```
packages/
├── shared/src/
│   ├── types.ts
│   ├── schemas.ts
│   └── ws-types.ts          # NEW: WebSocket message types
│
├── api/src/
│   ├── index.ts             # UPDATE: WS upgrade with auth
│   └── ws/
│       ├── index.ts         # NEW: Unified WS handlers
│       └── cursors.ts       # DELETE (merged into index.ts)
│
└── client/src/
    ├── hooks/
    │   └── useWebSocket.ts  # NEW: WebSocket hook
    └── components/session/
        ├── OnlineUsers.tsx  # NEW: Online users display
        ├── ChatPanel.tsx    # NEW: Chat sidebar
        └── CursorOverlay.tsx # NEW: Cursor display
```

---

## Implementation Order

1. **Backend first** - Get WS infrastructure solid
   - [ ] Create `packages/shared/src/ws-types.ts`
   - [ ] Refactor `packages/api/src/ws/index.ts`
   - [ ] Update `packages/api/src/index.ts` with auth upgrade
   - [ ] Test with wscat or browser console

2. **Client hook** - Core WebSocket logic
   - [ ] Create `packages/client/src/hooks/useWebSocket.ts`
   - [ ] Test connection and message flow

3. **UI components** - Visible features
   - [ ] Create `OnlineUsers.tsx`
   - [ ] Create `ChatPanel.tsx`
   - [ ] Create `CursorOverlay.tsx`

4. **Integration** - Wire it all together
   - [ ] Update `Session.tsx` with WebSocket hook
   - [ ] Add components to layout
   - [ ] Test full flow

---

## Testing Plan

1. **Unit tests**
   - Message serialization/deserialization
   - Color generation consistency

2. **Integration tests**
   - Connect with valid token
   - Reject invalid token
   - Receive presence on join
   - Broadcast cursor updates
   - Persist and broadcast chat

3. **Manual testing**
   - Open 2 browser tabs with same session
   - Verify cursor positions sync
   - Verify chat syncs
   - Verify online users list updates

---

## Future Enhancements (Not in scope)

- Redis pub/sub for horizontal scaling
- Cursor debouncing/throttling
- Typing indicators
- Read receipts
- Message reactions
