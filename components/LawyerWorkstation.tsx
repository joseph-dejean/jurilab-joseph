import React from 'react';
import { WorkspaceAssistantV2 } from './WorkspaceAssistantV2';

export const LawyerWorkstation: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/5 to-accent-900/5 dark:from-primary-900/20 dark:to-accent-900/10 z-0" />

            <div className="relative z-10 h-full flex flex-col">
                <div className="flex-1 min-h-0 h-full">
                    <WorkspaceAssistantV2 />
                </div>
            </div>
        </div>
    );
};
