import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Modal,
    Box,
    SpaceBetween,
    Button
} from '@cloudscape-design/components';
import CopyButton from './utils/CopyButton';

interface DetailsModalProps {
    visible: boolean;
    onDismiss: () => void;
    content: string;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
    visible,
    onDismiss,
    content
}) => {
    const handleDownload = () => {
        const now = new Date();
        const timestamp = now.toLocaleString('en-AU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'UTC'
        }).replace(/[/,:]/g, '').replace(/\s/g, '_');

        const newFileName = `WA_Details_${timestamp}_UTC.md`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <Modal
            visible={visible}
            onDismiss={onDismiss}
            header="Detailed Analysis"
            size="large"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <CopyButton content={content} />
                        <Button onClick={handleDownload}>
                            Download
                        </Button>
                        <Button variant="primary" onClick={onDismiss}>
                            Close
                        </Button>
                    </SpaceBetween>
                </Box>
            }
        >
            <Box padding="s">
                <ReactMarkdown>{content}</ReactMarkdown>
            </Box>
        </Modal>
    );
};