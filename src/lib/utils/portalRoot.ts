'use client';

// Apply DOM patch once on client startup to prevent React removeChild crashes caused by 
// browser extensions, portals, or devtools DOM mutations
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null);
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

/**
 * Returns or creates a dedicated root div inside document.body for React Portals.
 * Isolates portals (sidebars, modals, context menus) from document.body mutations
 * caused by browser extensions or devtools.
 */
export function getPortalRoot(): HTMLElement {
  if (typeof document === 'undefined') return null as any;
  
  let root = document.getElementById('app-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'app-portal-root';
    document.body.appendChild(root);
  }
  return root;
}
