import React from 'react';
import DocNexusStudio from '../plugins/DocNexus/components/DocNexusStudio.js';
import { TerminalLog } from '../types.js';

interface DocNexusViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
  userEmail?: string;
  theme?: 'light' | 'dark';
}

export default function DocNexusView({
  logs = [],
  onAddLog,
  userToken,
  userEmail,
  theme = 'dark'
}: DocNexusViewProps) {
  return (
    <DocNexusStudio
      logs={logs}
      onAddLog={onAddLog}
      userToken={userToken}
      userEmail={userEmail}
      theme={theme}
    />
  );
}
