import React from 'react';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';

interface ChatComponentProps {
    isAnalysisComplete: boolean;
    fileId?: string;
}

export const Chat: React.FC<ChatComponentProps> = ({ isAnalysisComplete, fileId }) => {

    if (!isAnalysisComplete) {
        return null;
    }

    return (
        <>
            <ChatButton isAnalysisComplete={isAnalysisComplete} />
            <ChatWindow isAnalysisComplete={isAnalysisComplete} fileId={fileId} />
        </>
    );
};