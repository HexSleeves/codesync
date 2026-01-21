import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Cursor } from '../../../api/cursors/cursors';

const CURSOR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

interface CursorOverlayProps {
  cursors: Cursor[];
  lineHeight: number;
  charWidth: number;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({
  cursors,
  lineHeight,
  charWidth
}) => {
  // Get user info for cursors
  const users = useTracker(() => {
    const userIds = cursors.map(c => c.userId);
    return Meteor.users.find({ _id: { $in: userIds }}).fetch();
  }, [cursors]);
  
  const getUserName = (userId: string): string => {
    const user = users.find(u => u._id === userId);
    if (!user) return 'Anonymous';
    const profile = user.profile as any;
    const services = user.services as any;
    return profile?.name || services?.github?.username || user.emails?.[0]?.address || 'Anonymous';
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursors.map((cursor, index) => {
        const color = CURSOR_COLORS[index % CURSOR_COLORS.length];
        const top = (cursor.line - 1) * lineHeight;
        const left = cursor.column * charWidth + 56; // Account for line numbers (14 * 4 = 56px)
        const userName = getUserName(cursor.userId);
        
        return (
          <div key={cursor.userId}>
            {/* Cursor line */}
            <div
              className="absolute w-0.5 transition-all duration-100"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                height: `${lineHeight}px`,
                backgroundColor: color,
                animation: 'blink 1s infinite'
              }}
            />
            
            {/* User label */}
            <div
              className="absolute px-2 py-0.5 rounded text-xs text-white font-medium whitespace-nowrap transition-all duration-100"
              style={{
                top: `${top - 20}px`,
                left: `${left}px`,
                backgroundColor: color
              }}
            >
              {userName}
            </div>
            
            {/* Selection highlight */}
            {cursor.selection && (
              <SelectionHighlight
                selection={cursor.selection}
                color={color}
                lineHeight={lineHeight}
                charWidth={charWidth}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

interface SelectionHighlightProps {
  selection: Cursor['selection'];
  color: string;
  lineHeight: number;
  charWidth: number;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  selection,
  color,
  lineHeight,
  charWidth
}) => {
  if (!selection) return null;
  
  const { startLine, startColumn, endLine, endColumn } = selection;
  
  // Single line selection
  if (startLine === endLine) {
    return (
      <div
        className="absolute opacity-20"
        style={{
          top: `${(startLine - 1) * lineHeight}px`,
          left: `${startColumn * charWidth + 56}px`,
          width: `${(endColumn - startColumn) * charWidth}px`,
          height: `${lineHeight}px`,
          backgroundColor: color
        }}
      />
    );
  }
  
  // Multi-line selection - render line by line
  const highlights: JSX.Element[] = [];
  
  for (let line = startLine; line <= endLine; line++) {
    const isFirstLine = line === startLine;
    const isLastLine = line === endLine;
    
    const colStart = isFirstLine ? startColumn : 0;
    const colEnd = isLastLine ? endColumn : 200; // Assume max 200 chars per line
    
    highlights.push(
      <div
        key={line}
        className="absolute opacity-20"
        style={{
          top: `${(line - 1) * lineHeight}px`,
          left: `${colStart * charWidth + 56}px`,
          width: `${(colEnd - colStart) * charWidth}px`,
          height: `${lineHeight}px`,
          backgroundColor: color
        }}
      />
    );
  }
  
  return <>{highlights}</>;
};
