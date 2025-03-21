import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  SideNavigation,
  Badge,
  SpaceBetween,
  Button,
  Modal,
  Box,
  StatusIndicator,
} from '@cloudscape-design/components';
import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import { useAuth } from '../contexts/AuthContext';
import { storageApi } from '../services/storage';
import { WorkItem, WorkItemStatus } from '../types';

export interface WorkSideNavigationProps {
  activeFileId?: string;
  onItemSelect: (workItem: WorkItem, loadResults?: boolean) => void;
  onSectionExpand: (workItem: WorkItem) => void;
  onResetActiveFile: () => void;
}

export interface WorkSideNavigationRef {
  loadWorkItems: () => Promise<void>;
}

export const WorkSideNavigation = forwardRef<WorkSideNavigationRef, WorkSideNavigationProps>((
  {
    activeFileId,
    onItemSelect,
    onResetActiveFile,
  },
  ref
) => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadingSupportingDocId, setDownloadingSupportingDocId] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const { authState } = useAuth();
  const [downloadingChatHistoryId, setDownloadingChatHistoryId] = useState<string | null>(null);
  const [deletingChatHistoryId, setDeletingChatHistoryId] = useState<string | null>(null);
  const [deleteChatModalVisible, setDeleteChatModalVisible] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<WorkItem | null>(null);

  // Check if a file has chat history
  const hasChatHistory = (item: WorkItem): boolean => {
    return !!item.hasChatHistory;
  };

  const loadWorkItems = useCallback(async () => {
    setIsReloading(true);
    try {
      const workItems = await storageApi.listWorkItems();
      setSortedItems(workItems);
      onResetActiveFile();
    } catch (err) {
      console.error('Failed to load work items:', err);
    } finally {
      setIsReloading(false);
    }
  }, [onResetActiveFile]);

  useImperativeHandle(ref, () => ({
    loadWorkItems
  }), [loadWorkItems]);

  const handleDownload = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    setDownloadingFileId(item.fileId);
    try {
      await storageApi.downloadOriginalContent(item.fileId, item.fileName);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle supporting document download
  const handleSupportingDocDownload = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    if (!item.supportingDocumentId || !item.supportingDocumentName) {
      return;
    }

    setDownloadingSupportingDocId(item.supportingDocumentId);
    try {
      await storageApi.downloadSupportingDocument(
        item.supportingDocumentId,
        item.fileId,
        item.supportingDocumentName
      );
    } catch (error) {
      console.error('Failed to download supporting document:', error);
    } finally {
      setDownloadingSupportingDocId(null);
    }
  };

  const setSortedItems = (newItems: WorkItem[]) => {
    const sortedItems = [...newItems].sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    setItems(sortedItems);
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadWorkItems();
    }
  }, [authState.isAuthenticated, loadWorkItems]);

  // Handle chat history download and deletion
  const handleDownloadChatHistory = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    setDownloadingChatHistoryId(item.fileId);
    try {
      await storageApi.downloadChatHistory(item.fileId, item.fileName);
    } catch (error) {
      console.error('Failed to download chat history:', error);
    } finally {
      setDownloadingChatHistoryId(null);
    }
  };

  const handleDeleteChatHistory = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    // Show modal instead of browser confirm
    setChatToDelete(item);
    setDeleteChatModalVisible(true);
  };

  const confirmChatDelete = async () => {
    if (!chatToDelete) return;

    setDeletingChatHistoryId(chatToDelete.fileId);
    try {
      await storageApi.deleteChatHistory(chatToDelete.fileId);
      
      // After deletion, reload the work items to get updated hasChatHistory flag
      await loadWorkItems();
      
      // Dispatch a custom event to notify the ChatContext about the deletion
      const chatDeletedEvent = new CustomEvent('chatHistoryDeleted', { 
        detail: { fileId: chatToDelete.fileId }
      });
      document.dispatchEvent(chatDeletedEvent);
      
      setDeleteChatModalVisible(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Failed to delete chat history:', error);
    } finally {
      setDeletingChatHistoryId(null);
    }
  };

  const handleDelete = async (item: WorkItem) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
    // Keep section expanded while deleting
    onItemSelect(item, false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingFileId(itemToDelete.fileId);
    try {
      await storageApi.deleteWorkItem(itemToDelete.fileId);
      await loadWorkItems();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete work item:', err);
    } finally {
      setDeletingFileId(null);
    }
  };

  const getStatusBadge = (status: WorkItemStatus, progress: number) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge color="green">Completed</Badge>;
      case 'FAILED':
        return <Badge color="red">Failed</Badge>;
      case 'PARTIAL':
        return (
          <SpaceBetween direction="horizontal" size="xs">
            <Badge key="partial-badge" color="blue">Partial results - Stopped at {progress}%</Badge>
          </SpaceBetween>
        );
      case 'IN_PROGRESS':
        return (
          <SpaceBetween direction="horizontal" size="xs">
            <Badge key="progress-badge" color="blue">In Progress - {progress}%</Badge>
          </SpaceBetween>
        );
      default:
        return <Badge color="grey">Not Started</Badge>;
    }
  };

  const canLoad = (item: WorkItem) =>
    item.analysisStatus === 'COMPLETED' ||
    item.analysisStatus === 'PARTIAL' ||
    item.iacGenerationStatus === 'COMPLETED' ||
    item.iacGenerationStatus === 'PARTIAL';

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const pad = (num: number) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  const navigationItems: SideNavigationProps.Item[] = [
    ...items.map(item => ({
      type: 'section' as const,
      text: `[${formatDateTime(item.lastModified)}] ${item.fileName}`,
      defaultExpanded: activeFileId === item.fileId,
      key: `section-${item.fileId}`,
      items: [
        {
          type: 'link' as const,
          text: 'Analysis Results status:',
          href: `/status/analysis/${item.fileId}`,
          key: `analysis-status-${item.fileId}`,
          info: (
            <SpaceBetween direction="horizontal" size="xxxs">
              {getStatusBadge(item.analysisStatus, item.analysisProgress)}
            </SpaceBetween>
          )
        },
        ...(item.iacGenerationStatus !== 'NOT_STARTED' ? [{
          type: 'link' as const,
          text: 'IaC Generation status:',
          href: `/status/iac/${item.fileId}`,
          key: `iac-status-${item.fileId}`,
          info: (
            <SpaceBetween direction="horizontal" size="xxxs">
              {getStatusBadge(item.iacGenerationStatus, item.iacGenerationProgress)}
            </SpaceBetween>
          )
        }] : []),
        {
          type: 'link' as const,
          text: 'Download original file:',
          href: `/download/${item.fileId}`,
          key: `download-${item.fileId}`,
          info: (
            <Button
              iconName="download"
              ariaLabel="Download original file"
              variant="inline-icon"
              loading={downloadingFileId === item.fileId}
              onClick={(e: any) => handleDownload(item, e)}
            />
          )
        },
        ...(item.supportingDocumentId && item.supportingDocumentAdded ? [{
          type: 'link' as const,
          text: 'Download supporting document:',
          href: `/download-supporting/${item.fileId}/${item.supportingDocumentId}`,
          key: `download-supporting-${item.fileId}`,
          info: (
            <Button
              iconName="download"
              ariaLabel="Download supporting document"
              variant="inline-icon"
              loading={downloadingSupportingDocId === item.supportingDocumentId}
              onClick={(e: any) => handleSupportingDocDownload(item, e)}
            />
          )
        }] : []),
        {
          type: 'link' as const,
          text: 'Chat history:',
          href: `/chat-history/${item.fileId}`,
          key: `chat-history-${item.fileId}`,
          info: (
            <SpaceBetween direction="horizontal" size="xxxs">
              <Button
                iconName="download"
                ariaLabel="Download chat history"
                variant="inline-icon"
                loading={downloadingChatHistoryId === item.fileId}
                disabled={!hasChatHistory(item)}
                onClick={(e: any) => handleDownloadChatHistory(item, e)}
              >
                Download
              </Button>
              <Button
                iconName="remove"
                ariaLabel="Delete chat history"
                variant="inline-icon"
                loading={deletingChatHistoryId === item.fileId}
                disabled={!hasChatHistory(item)}
                onClick={(e: any) => handleDeleteChatHistory(item, e)}
              >
                Delete
              </Button>
            </SpaceBetween>
          )
        },
        {
          type: 'link' as const,
          text: 'Load results:',
          href: `/load/${item.fileId}`,
          key: `load-${item.fileId}`,
          info: (
            <Button
              iconName="refresh"
              onClick={async (e: any) => {
                e.preventDefault();
                e.stopPropagation();
                setLoadingFileId(item.fileId);
                try {
                  await onItemSelect(item, true);
                } finally {
                  setLoadingFileId(null);
                }
              }}
              ariaLabel="Load results"
              variant="inline-icon"
              loading={loadingFileId === item.fileId}
              disabled={!canLoad(item)}
            >
              Load
            </Button>
          )
        },
        {
          type: 'link' as const,
          text: 'Delete work item:',
          href: `/delete/${item.fileId}`,
          key: `delete-${item.fileId}`,
          info: (
            <Button
              iconName="remove"
              onClick={(e: any) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(item);
              }}
              ariaLabel="Delete results"
              variant="inline-icon"
              loading={deletingFileId === item.fileId}
            >
              Delete
            </Button>
          )
        }
      ] as const
    })),
    { type: "divider" },
  ];

  const handleFollow = (event: CustomEvent<SideNavigationProps.FollowDetail>) => {
    event.preventDefault();
    const fileId = event.detail.href.split('/').pop();
    const selectedItem = items.find(item => item.fileId === fileId);
    if (selectedItem) {
      onItemSelect(selectedItem);
    }
  };

  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <>
      <SideNavigation
        header={{
          text: 'My Work Items',
          href: '#'
        }}
        items={navigationItems}
        onFollow={handleFollow}
        itemsControl={<Button
          key='reload-button'
          iconName="refresh"
          ariaLabel="Reload Work Items"
          loading={isReloading}
          onClick={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            loadWorkItems();
          }}
        >
          Reload Work Items
        </Button>}
      />

      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="Delete Work Item"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                key="cancel-button"
                onClick={() => setDeleteModalVisible(false)}
                variant="link"
                disabled={deletingFileId !== null}
              >
                Cancel
              </Button>
              <Button
                key="delete-button"
                onClick={confirmDelete}
                variant="primary"
                loading={deletingFileId !== null}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box key="delete-message" variant="p">
            Are you sure you want to delete the work item "{itemToDelete?.fileName}"?
            This action cannot be undone.
          </Box>
          {itemToDelete && (
            <SpaceBetween key="status-indicators" size="xs">
              <StatusIndicator key="analysis-status" type={itemToDelete.analysisPartialResults ? "warning" : "info"}>
                Analysis Status: {itemToDelete.analysisStatus}
                {itemToDelete.analysisPartialResults ? " (Partial Results)" : ""}
              </StatusIndicator>
              <StatusIndicator key="iac-status" type={itemToDelete.iacPartialResults ? "warning" : "info"}>
                IaC Generation Status: {itemToDelete.iacGenerationStatus}
                {itemToDelete.iacPartialResults ? " (Partial Results)" : ""}
              </StatusIndicator>
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Modal>

      <Modal
        visible={deleteChatModalVisible}
        onDismiss={() => setDeleteChatModalVisible(false)}
        header="Delete Chat History"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                key="cancel-button"
                onClick={() => setDeleteChatModalVisible(false)}
                variant="link"
                disabled={deletingChatHistoryId !== null}
              >
                Cancel
              </Button>
              <Button
                key="delete-button"
                onClick={confirmChatDelete}
                variant="primary"
                loading={deletingChatHistoryId !== null}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box key="delete-message" variant="p">
            Are you sure you want to delete the chat history for "{chatToDelete?.fileName}"?
            This action cannot be undone.
          </Box>
        </SpaceBetween>
      </Modal>
    </>
  );
});

WorkSideNavigation.displayName = 'WorkSideNavigation';