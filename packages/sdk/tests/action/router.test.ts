import { describe, test, expect, vi } from 'vitest';
import { HashRouter } from '../../src/action/router.js';

describe('Odoo Hash Router Sync', () => {
  test('should parse active parameters from standard Odoo URL hashes', () => {
    const mockLocation = { hash: '#action=sale.order&id=42&view_type=form' };
    const router = new HashRouter(mockLocation);

    const params = router.getParams();
    expect(params).toEqual({
      action: 'sale.order',
      id: '42',
      view_type: 'form'
    });
  });

  test('should serialize action state parameters to URL hash format', () => {
    const mockLocation = { hash: '' };
    const router = new HashRouter(mockLocation);

    router.setParams({
      action: 'res.partner',
      view_type: 'list',
      limit: 80
    });

    expect(mockLocation.hash).toBe('#action=res.partner&view_type=list&limit=80');
  });

  test('should support register change listener for hash/popstate updates', () => {
    const mockLocation = { hash: '#action=sale.order' };
    const router = new HashRouter(mockLocation);

    const spy = vi.fn();
    router.onNavigate(spy);

    // Simulate location hash change
    mockLocation.hash = '#action=res.partner&id=10';
    router.triggerNavigate();

    expect(spy).toHaveBeenCalledWith({
      action: 'res.partner',
      id: '10'
    });
  });
});
