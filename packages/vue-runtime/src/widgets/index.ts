import { componentRegistry } from '../registry.js';
import { FieldChar } from './FieldChar.js';
import { FieldText } from './FieldText.js';
import { FieldHtml } from './FieldHtml.js';
import { FieldInteger, FieldFloat, FieldMonetary, FieldPercentage } from './numeric.js';
import { FieldBoolean } from './FieldBoolean.js';
import { FieldSelection } from './FieldSelection.js';
import { FieldDate, FieldDatetime } from './datetime.js';
import { FieldMany2one } from './FieldMany2one.js';
import { FieldOne2many } from './FieldOne2many.js';
import { FieldMany2many } from './FieldMany2many.js';
import { FieldStatusbar } from './FieldStatusbar.js';
import {
  FieldUrl,
  FieldEmail,
  FieldPhone,
  FieldBadge,
  FieldProgressBar,
  FieldPriority,
  FieldImage,
  FieldHandle,
  FieldTag,
  FieldAvatar
} from './widgets.js';

export * from './FieldChar.js';
export * from './FieldText.js';
export * from './FieldHtml.js';
export * from './numeric.js';
export * from './FieldBoolean.js';
export * from './FieldSelection.js';
export * from './datetime.js';
export * from './FieldMany2one.js';
export * from './FieldOne2many.js';
export * from './FieldMany2many.js';
export * from './FieldStatusbar.js';
export * from './widgets.js';

export function registerCoreComponents() {
  componentRegistry.add('char', FieldChar);
  componentRegistry.add('text', FieldText);
  componentRegistry.add('html', FieldHtml);
  componentRegistry.add('integer', FieldInteger);
  componentRegistry.add('float', FieldFloat);
  componentRegistry.add('monetary', FieldMonetary);
  componentRegistry.add('boolean', FieldBoolean);
  componentRegistry.add('selection', FieldSelection);
  componentRegistry.add('date', FieldDate);
  componentRegistry.add('datetime', FieldDatetime);
  componentRegistry.add('many2one', FieldMany2one);
  componentRegistry.add('one2many', FieldOne2many);
  componentRegistry.add('many2many', FieldMany2many);
  componentRegistry.add('url', FieldUrl);
  componentRegistry.add('email', FieldEmail);
  componentRegistry.add('phone', FieldPhone);
  componentRegistry.add('badge', FieldBadge);
  componentRegistry.add('progressbar', FieldProgressBar);
  componentRegistry.add('priority', FieldPriority);
  componentRegistry.add('image', FieldImage);
  componentRegistry.add('handle', FieldHandle);
  componentRegistry.add('avatar', FieldAvatar);
  componentRegistry.add('tag', FieldTag);
  componentRegistry.add('many2many_tags', FieldTag);
  componentRegistry.add('percentage', FieldPercentage);
  componentRegistry.add('statusbar', FieldStatusbar);
}
