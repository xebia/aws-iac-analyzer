import { AppLayout, ContentLayout, Header, TopNavigation, HelpPanel } from '@cloudscape-design/components';
import { WellArchitectedAnalyzer } from './components/WellArchitectedAnalyzer';
import { HelpPanelProvider, useHelpPanel } from './contexts/HelpPanelContext';
import { helpContent } from './components/utils/help-content';
import { HelpButton } from './components/utils/HelpButton';
import '@cloudscape-design/global-styles/index.css';

function AppContent() {
  const { isToolsOpen, content, setIsToolsOpen } = useHelpPanel();
  const defaultContent = helpContent.default;

  return (
    <div>
      <TopNavigation
        identity={{
          href: '#',
          title: "Infrastructure as Code (IaC) Analyzer",
          logo: {
            src: "/aws-wa-logo.png",
            alt: "Well-Architected"
          }
        }}
      />
      <AppLayout
        content={
          <ContentLayout
            header={
              <Header
                variant="h3"
                info={<HelpButton contentId="default" />}
              >
                Review your infrastructure as code against AWS Well-Architected Framework Best Practices
              </Header>
            }
          >
            <WellArchitectedAnalyzer />
          </ContentLayout>
        }
        navigationHide={true}
        toolsOpen={isToolsOpen}
        onToolsChange={({ detail }) => setIsToolsOpen(detail.open)}
        tools={
          <HelpPanel
            header={<h2>{content?.header || defaultContent.header}</h2>}
          >
            {content?.body || defaultContent.body}
          </HelpPanel>
        }
        maxContentWidth={Number.MAX_VALUE}
      />
    </div>
  );
}

function App() {
  return (
    <HelpPanelProvider>
      <AppContent />
    </HelpPanelProvider>
  );
}

export default App;