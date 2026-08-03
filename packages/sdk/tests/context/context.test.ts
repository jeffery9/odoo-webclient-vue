import { describe, test, expect } from 'vitest';
import { Context } from '../../src/context/context.js';

describe('Odoo Layered Context Merger', () => {
  test('should merge multiple pre-evaluated object layers correctly', () => {
    const session = { lang: 'en_US', tz: 'UTC' };
    const user = { lang: 'zh_CN', uid: 2 };
    const field = { default_state: 'draft' };
    const action = { default_state: 'sale', active_id: 100 };

    const effective = Context.merge([session, user, field, action], {});

    expect(effective).toEqual({
      lang: 'zh_CN', // user overrides session
      tz: 'UTC',
      uid: 2,
      default_state: 'sale', // action overrides field
      active_id: 100
    });
  });

  test('should evaluate and merge string expression layers against environment', () => {
    const session = { uid: 5 };
    const fieldExpr = "{'default_user_id': uid, 'active_id': active_id}";
    const action = { active_id: 42 };

    const env = { uid: 5, active_id: 100 };

    const effective = Context.merge([session, fieldExpr, action], env);

    expect(effective).toEqual({
      uid: 5,
      default_user_id: 5, // evaluated from fieldExpr
      active_id: 42 // action overrides evaluated fieldExpr active_id (100)
    });
  });
});
