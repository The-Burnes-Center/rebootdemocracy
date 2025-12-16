import { createDirectus, rest, readItems } from '@directus/sdk';

// Use the same API URL as other composables for consistency
// If the modal collection is on a different instance, update this URL
const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

export interface ModalData {
  id: number;
  status: string;
  title: string;
  visibility: string;
  button_text: string;
  button_url: string;
  content: string;
}

export async function fetchModalData(): Promise<ModalData | null> {
  try {
    console.log('[Modal] Fetching modal data from:', API_URL, 'collection: reboot_democracy_modal');
    
    // First, try to fetch without filter to see what we get
    const response = await directus.request(
      readItems('reboot_democracy_modal', {
        limit: 1,
        fields: ['*'],
        filter: {
          status: { _eq: 'published' }
        }
      })
    );

    console.log('[Modal] Raw response:', response);
    console.log('[Modal] Response type:', typeof response, 'is array:', Array.isArray(response));
    
    // Handle both array and single object responses
    let modals: ModalData[] = [];
    if (Array.isArray(response)) {
      modals = response as ModalData[];
    } else if (response && typeof response === 'object') {
      // If it's a single object, wrap it in an array
      modals = [response as ModalData];
    }
    
    console.log('[Modal] Processed modals array:', modals);
    const modal = modals.length > 0 ? modals[0] : null;
    
    if (modal) {
      console.log('[Modal] Found modal:', {
        id: modal.id,
        status: modal.status,
        visibility: modal.visibility,
        title: modal.title?.substring(0, 50) + '...'
      });
    } else {
      console.log('[Modal] No modal found with status=published');
    }
    
    return modal;
  } catch (error) {
    console.error('[Modal] Error fetching modal data:', error);
    if (error instanceof Error) {
      console.error('[Modal] Error message:', error.message);
      console.error('[Modal] Error stack:', error.stack);
    }
    return null;
  }
}
