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

import { guaranteeNonNullable, uniq } from '@finos/legend-shared';
import type { EnumerationMapping } from '../models/metamodels/pure/packageableElements/mapping/EnumerationMapping';
import type { SetImplementation } from '../models/metamodels/pure/packageableElements/mapping/SetImplementation';
import type { Class } from '../models/metamodels/pure/packageableElements/domain/Class';
import type { Enumeration } from '../models/metamodels/pure/packageableElements/domain/Enumeration';
import type { Mapping } from '../models/metamodels/pure/packageableElements/mapping/Mapping';
import { AggregationAwareSetImplementation } from '../models/metamodels/pure/packageableElements/mapping/aggregationAware/AggregationAwareSetImplementation';

export const getAllClassMappings = (mapping: Mapping): SetImplementation[] =>
  uniq(
    mapping.allOwnClassMappings.concat(
      mapping.allIncludedMappings.map((e) => e.allOwnClassMappings).flat(),
    ),
  );

export const getAllEnumerationMappings = (
  mapping: Mapping,
): EnumerationMapping[] =>
  uniq(
    mapping.allOwnEnumerationMappings.concat(
      mapping.allIncludedMappings
        .map((e) => e.allOwnEnumerationMappings)
        .flat(),
    ),
  );

export const extractClassMappingsFromAggregationAwareClassMappings = (
  mapping: Mapping,
): SetImplementation[] => {
  const aggregationAwareClassMappings = mapping.classMappings.filter(
    (
      classMapping: SetImplementation,
    ): classMapping is AggregationAwareSetImplementation =>
      classMapping instanceof AggregationAwareSetImplementation,
  );
  return [
    ...aggregationAwareClassMappings.map(
      (aggregate) => aggregate.mainSetImplementation,
    ),
    ...aggregationAwareClassMappings
      .map((aggregate) =>
        aggregate.aggregateSetImplementations.map(
          (setImpl) => setImpl.setImplementation,
        ),
      )
      .flat(),
  ];
};

export const getOwnClassMappingById = (
  mapping: Mapping,
  id: string,
): SetImplementation =>
  guaranteeNonNullable(
    [
      ...mapping.allOwnClassMappings,
      ...extractClassMappingsFromAggregationAwareClassMappings(mapping),
    ].find((classMapping) => classMapping.id.value === id),
    `Can't find class mapping with ID '${id}' in mapping '${mapping.path}'`,
  );

export const getClassMappingById = (
  mapping: Mapping,
  id: string,
): SetImplementation =>
  guaranteeNonNullable(
    [
      ...getAllClassMappings(mapping),
      ...extractClassMappingsFromAggregationAwareClassMappings(mapping),
    ].find((classMapping) => classMapping.id.value === id),
    `Can't find class mapping with ID '${id}' in mapping '${mapping.path}'`,
  );

export const getOwnClassMappingsByClass = (
  mapping: Mapping,
  _class: Class,
): SetImplementation[] =>
  // TODO: Add association property Mapping to class mappings, AggregationAwareSetImplementation, mappingClass
  // NOTE: Add in the proper order so find root can resolve properly down the line
  mapping.allOwnClassMappings.filter(
    (classMapping) => classMapping.class.value === _class,
  );

export const getClassMappingsByClass = (
  mapping: Mapping,
  _class: Class,
): SetImplementation[] =>
  // TODO: Add association property Mapping to class mappings, AggregationAwareSetImplementation, mappingClass
  // NOTE: Add in the proper order so find root can resolve properly down the line
  getAllClassMappings(mapping).filter(
    (classMapping) => classMapping.class.value === _class,
  );

export const getEnumerationMappingsByEnumeration = (
  mapping: Mapping,
  enumeration: Enumeration,
): EnumerationMapping[] =>
  // TODO: we don't support included mapings yet
  // return this.includes.map(m => m.included).flat().map(m => m.enumerationMappingsByEnumeration(e)).concat(this.enumerationMappings.filter(em => em.enumeration === e));
  mapping.enumerationMappings.filter(
    (enumerationMapping) =>
      enumerationMapping.enumeration.value === enumeration,
  );
