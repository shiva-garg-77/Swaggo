import { useEffect } from 'react';
import { useMessageTemplateStore } from '../store/messageTemplateStore';

/**
 * Hook for using message templates
 */
export function useMessageTemplates() {
  const store = useMessageTemplateStore();

  useEffect(() => {
    if (store.templates.length === 0 && !store.isLoading) {
      store.fetchTemplates().catch(console.error);
    }
  }, [store]);

  return {
    templates: store.templates,
    recentTemplates: store.recentTemplates,
    isLoading: store.isLoading,
    error: store.error,
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    searchTemplates: store.searchTemplates
  };
}

export default useMessageTemplates;
