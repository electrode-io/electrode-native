/* tslint:disable:variable-name */
import ObjectUtils from './java/ObjectUtils';
import ComposedModel from './models/ComposedModel';

export class InheritanceTreeSorter {
  public definitions;
  public __parent;

  constructor(__parent, definitions) {
    this.definitions = definitions;
    this.__parent = __parent;
  }

  public compare(o1, o2) {
    const model1 = this.definitions.get(o1);
    const model2 = this.definitions.get(o2);
    const model1InheritanceDepth = this.getInheritanceDepth(model1);
    const model2InheritanceDepth = this.getInheritanceDepth(model2);
    if (model1InheritanceDepth === model2InheritanceDepth) {
      const cmp = ObjectUtils.compare(
        this.__parent.config.toModelName(o1),
        this.__parent.config.toModelName(o2),
      );
      if (cmp === -1) {
        return -1;
      }
      if (cmp === 1) {
        return 1;
      }
      if (cmp === true) {
        return -1;
      }
      if (cmp === false) {
        return 1;
      }
      return cmp;
    } else if (model1InheritanceDepth > model2InheritanceDepth) {
      return 1;
    } else {
      return -1;
    }
  }

  public getInheritanceDepth(model) {
    let inheritanceDepth = 0;
    let parent = this.getParent(model);
    while (parent != null) {
      inheritanceDepth++;
      parent = this.getParent(parent);
    }
    return inheritanceDepth;
  }

  public getParent(model) {
    if (model != null && model instanceof ComposedModel) {
      const parent = model.getParent();
      if (parent != null) {
        return this.definitions.get(parent.getReference());
      }
    }
    return null;
  }
}
