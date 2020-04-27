import Mustache from 'mustache';
import { isIterable } from './isIterable';

export class MustacheWriter extends Mustache.Writer {
  // @ts-ignore
  public renderSection(token, context, partials, originalTemplate) {
    let buffer = '';
    let value = context.lookup(token[1]);

    if (!value) {
      return;
    }

    if (isIterable(value)) {
      const itr = value[Symbol.iterator]();
      let first = itr.next();
      let isFirst = true;
      while (!first.done) {
        const next = itr.next();
        if (first.value != null) {
          const ctx = context.push(first.value, isFirst, next.done);
          buffer += super.renderTokens(
            token[4],
            ctx,
            partials,
            originalTemplate,
          );
        }
        isFirst = false;
        first = next;
      }
      return buffer;
    } else if (
      typeof value === 'object' ||
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      buffer += super.renderTokens(
        token[4],
        context.push(value),
        partials,
        originalTemplate,
      );
    } else if (typeof value === 'function') {
      if (typeof originalTemplate !== 'string') {
        throw new Error(
          'Cannot use higher-order sections without the original template',
        );
      }

      // Extract the portion of the original template that the section contains.
      value = value.call(
        context.view,
        originalTemplate.slice(token[3], token[5]),
        template => super.render(template, context, partials),
      );

      if (value != null) {
        buffer += value;
      }
    } else {
      buffer += super.renderTokens(
        token[4],
        context,
        partials,
        originalTemplate,
      );
    }
    return buffer;
  }
}
