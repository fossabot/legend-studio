/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { action, observable, makeObservable, override } from 'mobx';
import {
  type Hashable,
  hashArray,
  addUniqueEntry,
  deleteEntry,
  changeEntry,
} from '@finos/legend-shared';
import { hashLambda } from '../../../../../MetaModelUtils';
import { CORE_HASH_STRUCTURE } from '../../../../../MetaModelConst';
import type { PackageableElementVisitor } from '../PackageableElement';
import type { RawVariableExpression } from '../../rawValueSpecification/RawVariableExpression';
import type { Type } from './Type';
import type { Multiplicity } from './Multiplicity';
import type { Stubable } from '../../../../../helpers/Stubable';
import type { StereotypeReference } from './StereotypeReference';
import type { TaggedValue } from './TaggedValue';
import type { PackageableElementReference } from '../PackageableElementReference';
import { FunctionDefinition } from './Function';

export class ConcreteFunctionDefinition
  extends FunctionDefinition
  implements Hashable, Stubable
{
  returnType: PackageableElementReference<Type>;
  returnMultiplicity: Multiplicity;
  parameters: RawVariableExpression[] = []; // @MARKER GENERATED MODEL DISCREPANCY --- Studio does not process lambda
  body: object[] = []; // @MARKER GENERATED MODEL DISCREPANCY --- Studio does not process lambda
  stereotypes: StereotypeReference[] = [];
  taggedValues: TaggedValue[] = [];

  constructor(
    name: string,
    returnType: PackageableElementReference<Type>,
    returnMultiplicity: Multiplicity,
  ) {
    super(name);

    makeObservable<ConcreteFunctionDefinition, '_elementHashCode'>(this, {
      returnMultiplicity: observable,
      parameters: observable.shallow,
      body: observable.ref,
      stereotypes: observable,
      taggedValues: observable,
      deleteParameter: action,
      addParameter: action,
      setReturnType: action,
      setReturnMultiplicity: action,
      deleteTaggedValue: action,
      addTaggedValue: action,
      deleteStereotype: action,
      changeStereotype: action,
      addStereotype: action,
      _elementHashCode: override,
    });

    this.returnType = returnType;
    this.returnMultiplicity = returnMultiplicity;
  }

  deleteParameter(val: RawVariableExpression): void {
    deleteEntry(this.parameters, val);
  }
  addParameter(val: RawVariableExpression): void {
    addUniqueEntry(this.parameters, val);
  }
  setReturnType(val: Type): void {
    this.returnType.setValue(val);
  }
  setReturnMultiplicity(val: Multiplicity): void {
    this.returnMultiplicity = val;
  }
  deleteTaggedValue(val: TaggedValue): void {
    deleteEntry(this.taggedValues, val);
  }
  addTaggedValue(val: TaggedValue): void {
    addUniqueEntry(this.taggedValues, val);
  }
  deleteStereotype(val: StereotypeReference): void {
    deleteEntry(this.stereotypes, val);
  }
  changeStereotype(
    oldVal: StereotypeReference,
    newVal: StereotypeReference,
  ): void {
    changeEntry(this.stereotypes, oldVal, newVal);
  }
  addStereotype(val: StereotypeReference): void {
    addUniqueEntry(this.stereotypes, val);
  }

  protected override get _elementHashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.FUNCTION,
      this.path,
      hashArray(this.parameters),
      this.returnType.hashValue,
      hashArray(this.taggedValues),
      hashArray(this.stereotypes.map((val) => val.pointerHashCode)),
      hashLambda(undefined, this.body),
    ]);
  }

  accept_PackageableElementVisitor<T>(
    visitor: PackageableElementVisitor<T>,
  ): T {
    return visitor.visit_ConcreteFunctionDefinition(this);
  }
}
