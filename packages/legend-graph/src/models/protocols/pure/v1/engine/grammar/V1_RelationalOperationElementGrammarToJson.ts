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

import { custom, createModelSchema } from 'serializr';
import {
  deseralizeMap,
  SerializationFactory,
  serializeMap,
} from '@finos/legend-shared';

export class V1_RelationalOperationElementGrammarToJsonInput {
  operations!: Map<string, string>;

  static readonly serialization = new SerializationFactory(
    createModelSchema(V1_RelationalOperationElementGrammarToJsonInput, {
      operations: custom(
        (val) => serializeMap<string>(val),
        (val) => deseralizeMap<string>(val),
      ),
    }),
  );
}
